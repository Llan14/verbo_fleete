from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import require_roles
from app.core.database import get_db
from app.core.security import get_usuario_actual
from app.models.assignment import Assignment, AssignmentRecipient, PracticeSession, Submission
from app.models.exercise_template import ExerciseTemplate
from app.models.group import Grupo
from app.models.user import Roles, Usuario
from app.schemas.assignment import (
    PracticeSessionCreateRequest,
    PracticeSessionCreateResponse,
    StudentAssignmentDetailResponse,
    StudentAssignmentListItem,
    SubmitAssignmentRequest,
    SubmitAssignmentResponse,
    TeacherAssignmentCreateRequest,
    TeacherAssignmentCreateResponse,
    TeacherAssignmentListItem,
    TeacherAssignmentRecipientResult,
    TeacherAssignmentResultsResponse,
    TeacherGradeDeliveryItem,
    TeacherGradesByGroupItem,
)

router = APIRouter(tags=["Asignaciones IA"])


def _as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _build_template_from_inline(
    db: Session,
    current_user: Usuario,
    module: str | None,
    nivel: str | None,
    contexto: str | None,
    payload: dict,
) -> ExerciseTemplate:
    if not module:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cuando envías payload inline debes indicar module.",
        )

    template = ExerciseTemplate(
        module=module,
        level=nivel,
        prompt_context=contexto,
        payload=payload,
        created_by=current_user.id,
        version="v1",
    )
    db.add(template)
    db.flush()
    return template


@router.post("/teacher/assignments", response_model=TeacherAssignmentCreateResponse, status_code=status.HTTP_201_CREATED)
def create_teacher_assignment(
    request: TeacherAssignmentCreateRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    if usuario_actual.rol not in (Roles.ADMIN, Roles.TUTOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo docentes o admins pueden crear asignaciones.")

    group = db.query(Grupo).filter(Grupo.id == request.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo no encontrado.")

    if usuario_actual.rol == Roles.TUTOR and usuario_actual not in group.tutores:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes asignar tareas en este grupo.")

    if not group.alumnos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El grupo no tiene alumnos asignados. Asigna estudiantes antes de publicar la tarea.",
        )

    template: ExerciseTemplate | None = None
    if request.draft_id is not None:
        template = db.query(ExerciseTemplate).filter(ExerciseTemplate.id == request.draft_id).first()
        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft no encontrado.")
    elif request.payload is not None:
        template = _build_template_from_inline(
            db=db,
            current_user=usuario_actual,
            module=request.module,
            nivel=request.nivel,
            contexto=request.contexto,
            payload=request.payload,
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debes enviar draft_id o payload.")

    existing_assignment = (
        db.query(Assignment)
        .filter(
            Assignment.template_id == template.id,
            Assignment.group_id == group.id,
            Assignment.title == request.title,
            Assignment.due_at == request.due_at,
            Assignment.created_by == usuario_actual.id,
        )
        .order_by(Assignment.id.desc())
        .first()
    )
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Esta tarea ya fue publicada previamente (ID: {existing_assignment.id}).",
        )

    assignment = Assignment(
        template_id=template.id,
        group_id=group.id,
        title=request.title,
        instructions=request.instructions,
        due_at=request.due_at,
        weight=request.weight,
        created_by=usuario_actual.id,
        status="published",
    )
    db.add(assignment)
    db.flush()

    recipients_count = 0
    for student in group.alumnos:
        recipient = AssignmentRecipient(
            assignment_id=assignment.id,
            student_id=student.id,
            status="pending",
        )
        db.add(recipient)
        recipients_count += 1

    db.commit()
    db.refresh(assignment)

    return TeacherAssignmentCreateResponse(
        assignment_id=assignment.id,
        recipients_count=recipients_count,
        created_at=assignment.created_at,
    )


@router.get("/teacher/assignments", response_model=list[TeacherAssignmentListItem])
def list_teacher_assignments(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    if usuario_actual.rol not in (Roles.ADMIN, Roles.TUTOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado.")

    query = db.query(Assignment).options(joinedload(Assignment.template), joinedload(Assignment.group), joinedload(Assignment.recipients))

    if usuario_actual.rol == Roles.TUTOR:
        group_ids = [g.id for g in usuario_actual.grupos_como_tutor]
        if not group_ids:
            return []
        query = query.filter(Assignment.group_id.in_(group_ids))

    assignments = query.order_by(Assignment.created_at.desc()).all()

    result = []
    for assignment in assignments:
        submitted_count = sum(1 for r in assignment.recipients if r.status == "submitted")
        result.append(
            TeacherAssignmentListItem(
                assignment_id=assignment.id,
                title=assignment.title,
                module=assignment.template.module,
                group_id=assignment.group_id,
                group_name=assignment.group.nombre,
                due_at=assignment.due_at,
                weight=assignment.weight,
                recipients_count=len(assignment.recipients),
                submitted_count=submitted_count,
            )
        )

    return result


@router.delete("/teacher/assignments/{assignment_id}", status_code=status.HTTP_200_OK)
def delete_teacher_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    if usuario_actual.rol not in (Roles.ADMIN, Roles.TUTOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado.")

    assignment = (
        db.query(Assignment)
        .options(joinedload(Assignment.recipients))
        .filter(Assignment.id == assignment_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asignación no encontrada.")

    if usuario_actual.rol == Roles.TUTOR and assignment.created_by != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar una asignación creada por otro tutor.",
        )

    recipients_deleted = len(assignment.recipients)
    db.delete(assignment)
    db.commit()

    return {
        "assignment_id": assignment_id,
        "recipients_deleted": recipients_deleted,
        "message": "Asignación eliminada correctamente.",
    }


@router.get("/teacher/assignments/{assignment_id}/results", response_model=TeacherAssignmentResultsResponse)
def get_teacher_assignment_results(
    assignment_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    if usuario_actual.rol not in (Roles.ADMIN, Roles.TUTOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado.")

    assignment = (
        db.query(Assignment)
        .options(
            joinedload(Assignment.template),
            joinedload(Assignment.group),
            joinedload(Assignment.recipients).joinedload(AssignmentRecipient.student),
        )
        .filter(Assignment.id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asignación no encontrada.")

    if usuario_actual.rol == Roles.TUTOR and usuario_actual not in assignment.group.tutores:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes ver resultados de este grupo.")

    recipients = []
    score_values = []

    for recipient in assignment.recipients:
        if recipient.score is not None:
            score_values.append(float(recipient.score))

        recipients.append(
            TeacherAssignmentRecipientResult(
                recipient_id=recipient.id,
                student_id=recipient.student_id,
                student_name=f"{recipient.student.nombre} {recipient.student.apellidos}".strip(),
                student_email=recipient.student.email,
                status=recipient.status,
                submitted_at=recipient.submitted_at,
                score=recipient.score,
            )
        )

    submitted_count = sum(1 for recipient in assignment.recipients if recipient.status == "submitted")
    average_score = round(sum(score_values) / len(score_values), 2) if score_values else None

    return TeacherAssignmentResultsResponse(
        assignment_id=assignment.id,
        title=assignment.title,
        module=assignment.template.module,
        group_name=assignment.group.nombre,
        due_at=assignment.due_at,
        weight=assignment.weight,
        submitted_count=submitted_count,
        recipients_count=len(assignment.recipients),
        average_score=average_score,
        recipients=recipients,
    )


@router.get("/teacher/grades/group/{group_id}", response_model=list[TeacherGradesByGroupItem])
def get_teacher_grades_by_group(
    group_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles(Roles.TUTOR)),
):
    group = db.query(Grupo).filter(Grupo.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo no encontrado.")

    if usuario_actual.rol == Roles.TUTOR and usuario_actual not in group.tutores:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso a este grupo.")

    assignments = (
        db.query(Assignment)
        .options(
            joinedload(Assignment.recipients)
            .joinedload(AssignmentRecipient.student),
            joinedload(Assignment.recipients)
            .joinedload(AssignmentRecipient.submission),
        )
        .filter(Assignment.group_id == group_id)
        .order_by(Assignment.created_at.desc())
        .all()
    )

    if usuario_actual.rol == Roles.TUTOR:
        assignments = [a for a in assignments if a.created_by == usuario_actual.id]

    results: list[TeacherGradesByGroupItem] = []
    for assignment in assignments:
        deliveries: list[TeacherGradeDeliveryItem] = []
        for recipient in assignment.recipients:
            feedback = recipient.submission.feedback_payload if recipient.submission else None
            errores_frecuentes: str | None = None
            if isinstance(feedback, dict):
                raw_error = feedback.get("errores_frecuentes") or feedback.get("errores")
                if raw_error is not None:
                    errores_frecuentes = str(raw_error)

            deliveries.append(
                TeacherGradeDeliveryItem(
                    alumno_id=recipient.student_id,
                    alumno_nombre=f"{recipient.student.nombre} {recipient.student.apellidos}".strip(),
                    calificacion=recipient.score,
                    errores_frecuentes=errores_frecuentes,
                )
            )

        results.append(
            TeacherGradesByGroupItem(
                tarea_id=assignment.id,
                titulo=assignment.title,
                group_id=assignment.group_id,
                entregas=deliveries,
            )
        )

    return results


@router.get("/student/assignments", response_model=list[StudentAssignmentListItem])
def list_student_assignments(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    try:
        if usuario_actual.rol != Roles.ESTUDIANTE:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo estudiantes pueden ver esta vista.")

        recipients = (
            db.query(AssignmentRecipient)
            .options(joinedload(AssignmentRecipient.assignment).joinedload(Assignment.template))
            .filter(AssignmentRecipient.student_id == usuario_actual.id)
            .all()
        )

        now = datetime.now(timezone.utc)
        result = []
        valid_recipients = [
            recipient
            for recipient in recipients
            if recipient.assignment is not None and recipient.assignment.template is not None
        ]

        for recipient in sorted(valid_recipients, key=lambda item: _as_utc(item.assignment.due_at) or now):
            computed_status = recipient.status
            due_at_utc = _as_utc(recipient.assignment.due_at)
            if recipient.status != "submitted" and due_at_utc and due_at_utc < now:
                computed_status = "overdue"

            result.append(
                StudentAssignmentListItem(
                    assignment_id=recipient.assignment_id,
                    recipient_id=recipient.id,
                    title=recipient.assignment.title,
                    module=recipient.assignment.template.module,
                    group_name=recipient.assignment.group.nombre,
                    due_at=due_at_utc or recipient.assignment.due_at,
                    weight=recipient.assignment.weight,
                    status=computed_status,
                    submitted_at=recipient.submitted_at,
                    score=recipient.score,
                )
            )

        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"student/assignments: {exc}") from exc


@router.get("/student/assignments/{assignment_id}", response_model=StudentAssignmentDetailResponse)
def get_student_assignment_detail(
    assignment_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    try:
        if usuario_actual.rol != Roles.ESTUDIANTE:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo estudiantes pueden ver esta vista.")

        recipient = (
            db.query(AssignmentRecipient)
            .options(joinedload(AssignmentRecipient.assignment).joinedload(Assignment.template))
            .filter(
                AssignmentRecipient.assignment_id == assignment_id,
                AssignmentRecipient.student_id == usuario_actual.id,
            )
            .first()
        )

        if not recipient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asignación no encontrada.")

        if recipient.assignment is None or recipient.assignment.template is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La asignación no tiene contenido disponible.")

        if recipient.opened_at is None and recipient.status == "pending":
            recipient.opened_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(recipient)

        return StudentAssignmentDetailResponse(
            assignment_id=recipient.assignment_id,
            recipient_id=recipient.id,
            title=recipient.assignment.title,
            instructions=recipient.assignment.instructions,
            module=recipient.assignment.template.module,
            group_name=recipient.assignment.group.nombre,
            due_at=recipient.assignment.due_at,
            weight=recipient.assignment.weight,
            status=recipient.status,
            payload=recipient.assignment.template.payload,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"student/assignments/{assignment_id}: {exc}") from exc


@router.post("/student/assignments/{assignment_id}/submit", response_model=SubmitAssignmentResponse)
def submit_student_assignment(
    assignment_id: int,
    request: SubmitAssignmentRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    if usuario_actual.rol != Roles.ESTUDIANTE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo estudiantes pueden enviar tareas.")

    recipient = (
        db.query(AssignmentRecipient)
        .filter(
            AssignmentRecipient.assignment_id == assignment_id,
            AssignmentRecipient.student_id == usuario_actual.id,
        )
        .first()
    )

    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asignación no encontrada.")

    if recipient.status == "submitted":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La tarea ya fue enviada.")

    submission = Submission(
        assignment_recipient_id=recipient.id,
        answers_payload=request.answers_payload,
        feedback_payload=None,
        score=request.score,
    )
    db.add(submission)

    recipient.status = "submitted"
    recipient.submitted_at = datetime.now(timezone.utc)
    recipient.score = request.score

    db.commit()
    db.refresh(submission)
    db.refresh(recipient)

    return SubmitAssignmentResponse(
        submission_id=submission.id,
        submitted_at=recipient.submitted_at,
        status=recipient.status,
        score=recipient.score,
    )


@router.post("/student/practice-sessions", response_model=PracticeSessionCreateResponse, status_code=status.HTTP_201_CREATED)
def create_practice_session(
    request: PracticeSessionCreateRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    if usuario_actual.rol != Roles.ESTUDIANTE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo estudiantes pueden guardar práctica libre.")

    template: ExerciseTemplate | None = None

    if request.draft_id is not None:
        template = db.query(ExerciseTemplate).filter(ExerciseTemplate.id == request.draft_id).first()
        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft no encontrado.")
    elif request.payload is not None:
        template = _build_template_from_inline(
            db=db,
            current_user=usuario_actual,
            module=request.module,
            nivel=request.nivel,
            contexto=request.contexto,
            payload=request.payload,
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debes enviar draft_id o payload.")

    practice = PracticeSession(
        student_id=usuario_actual.id,
        template_id=template.id,
        answers_payload=request.answers_payload,
        feedback_payload=None,
        score=request.score,
    )
    db.add(practice)
    db.commit()
    db.refresh(practice)

    return PracticeSessionCreateResponse(
        practice_session_id=practice.id,
        created_at=practice.created_at,
    )
