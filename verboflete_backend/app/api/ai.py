from fastapi import APIRouter, Depends, HTTPException, status
from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.core.database import get_db
from app.core.security import get_usuario_actual
from app.models.exercise_template import ExerciseTemplate
from app.models.user import Usuario, Roles
from app.schemas.ai import ExerciseDraftCreateRequest, ExerciseDraftResponse
from app.services.exercise_generation_service import generate_exercise_payload
from app.services.ia_service import get_openai_client

router = APIRouter(prefix="/ai", tags=["IA Drafts"])


@router.post("/exercises/draft", response_model=ExerciseDraftResponse, status_code=status.HTTP_201_CREATED)
async def create_exercise_draft(
    request: ExerciseDraftCreateRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles(Roles.TUTOR, Roles.ESTUDIANTE)),
    client: AsyncOpenAI | None = Depends(get_openai_client),
):
    try:
        payload = await generate_exercise_payload(request, client)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"No se pudo generar el ejercicio: {exc}") from exc

    draft = ExerciseTemplate(
        module=request.module,
        level=request.nivel,
        prompt_context=request.contexto,
        payload=payload,
        created_by=usuario_actual.id,
        version="v1",
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)

    return ExerciseDraftResponse(
        draft_id=draft.id,
        module=draft.module,
        payload=draft.payload,
        generated_at=draft.created_at.isoformat(),
        version=draft.version,
    )
