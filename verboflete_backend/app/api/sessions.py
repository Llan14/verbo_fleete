from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from fastapi.responses import Response
from datetime import datetime, date

from app.core.database import get_db
from app.core.security import get_usuario_actual
from app.models.response_detail import DetalleRespuesta
from app.models.session import Sesion
from app.schemas.session import DashboardResponse, ReportDataSchema, SesionResumenResponse, SesionCompletaResponse, TenseStatSchema, WeakestTenseSchema, WeaknessItemSchema, GamificationResponse, BadgeItemSchema

router = APIRouter(prefix="/sessions", tags=["Historial de Sesiones"])


def _pdf_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _build_simple_pdf(title: str, lines: List[str]) -> bytes:
    safe_title = _pdf_escape(title)
    max_lines = 34
    clipped = lines[:max_lines]

    content_lines = [
        "BT",
        "/F1 18 Tf",
        "50 770 Td",
        f"({safe_title}) Tj",
        "/F1 11 Tf",
        "0 -30 Td",
    ]

    for line in clipped:
        content_lines.append(f"({_pdf_escape(line)}) Tj")
        content_lines.append("0 -18 Td")

    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("latin-1", errors="ignore")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
    ]

    output = b"%PDF-1.4\n"
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output += f"{i} 0 obj\n".encode("ascii") + obj + b"\nendobj\n"

    xref_offset = len(output)
    output += f"xref\n0 {len(objects) + 1}\n".encode("ascii")
    output += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        output += f"{off:010d} 00000 n \n".encode("ascii")

    output += (
        b"trailer\n"
        + f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode("ascii")
        + b"startxref\n"
        + str(xref_offset).encode("ascii")
        + b"\n%%EOF"
    )
    return output

@router.get("/me", response_model=List[SesionResumenResponse])
def obtener_mi_historial(
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_usuario_actual)
):

    sesiones = db.query(Sesion).filter(
        Sesion.usuario_id == usuario_actual.id
    ).order_by(Sesion.fecha.desc()).all()
    
    return sesiones

@router.get("/me/{sesion_id}", response_model=SesionCompletaResponse)
def obtener_detalle_de_sesion(
    sesion_id: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_usuario_actual)
):
    sesion = db.query(Sesion).filter(
        Sesion.id == sesion_id,
        Sesion.usuario_id == usuario_actual.id
    ).first()
    
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada o no tienes permisos para verla")
    
    return sesion

@router.get("/dashboard", response_model=DashboardResponse)
def obtener_dashboard_stats(
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_usuario_actual)
):

    total_ejercicios = db.query(Sesion).filter(Sesion.usuario_id == usuario_actual.id).count()

    if total_ejercicios == 0:
        return DashboardResponse(
            totalExercises=0,
            weakestTense=None,
            stats=[],
            report={"recommendations": ["Completa tu primer ejercicio para ver tus estadísticas."], "weaknesses": []}
        )


    tenses_data = db.query(
        Sesion.tense,
        func.avg(Sesion.puntaje_total).label("promedio"),
        func.count(Sesion.id).label("total")
    ).filter(Sesion.usuario_id == usuario_actual.id).group_by(Sesion.tense).all()

    stats = [
        TenseStatSchema(
            name=t.tense.capitalize(),
            score=round(t.promedio, 2),
            total=t.total
        )
        for t in tenses_data
    ]

    weakest = None
    if stats:

        weakest_stat = min(stats, key=lambda x: x.score)
        weakest = WeakestTenseSchema(name=weakest_stat.name, score=weakest_stat.score)

    errores_data = db.query(
        DetalleRespuesta.categoria_error,
        func.count(DetalleRespuesta.id).label("conteo_errores"),
        func.avg(DetalleRespuesta.puntaje).label("mastery")
    ).join(Sesion).filter(
        Sesion.usuario_id == usuario_actual.id,
        DetalleRespuesta.categoria_error.isnot(None),
        DetalleRespuesta.puntaje < 100
    ).group_by(DetalleRespuesta.categoria_error)\
     .order_by(func.count(DetalleRespuesta.id).desc()).limit(5).all()

    weaknesses = [
        WeaknessItemSchema(
            category=err.categoria_error,
            mastery_level=round(err.mastery, 2),
            error_count=err.conteo_errores
        )
        for err in errores_data
    ]

    recomendaciones = []
    if weakest:
        recomendaciones.append(f"Te sugerimos enfocar tu práctica en el tiempo: {weakest.name}.")
    
    for w in weaknesses[:2]:
        recomendaciones.append(f"Repasa las reglas de: {w.category.lower()}.")

    if not recomendaciones:
        recomendaciones.append("¡Excelente trabajo! Sigue practicando para mantener el nivel.")


    return DashboardResponse(
        totalExercises=total_ejercicios,
        weakestTense=weakest,
        stats=stats,
        report=ReportDataSchema(
            recommendations=recomendaciones,
            weaknesses=weaknesses
        )
    )

@router.get("/admin/user-dashboard/{usuario_id}", response_model=DashboardResponse)
def obtener_dashboard_de_usuario_para_admin(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_usuario_actual)
):

    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=403,
            detail="¡Acceso denegado! Solo los administradores pueden ver los reportes de otros usuarios."
        )


    total_ejercicios = db.query(Sesion).filter(Sesion.usuario_id == usuario_id).count()

    if total_ejercicios == 0:
        return DashboardResponse(
            totalExercises=0,
            weakestTense=None,
            stats=[],
            report={"recommendations": ["El usuario aún no ha completado ejercicios."], "weaknesses": []}
        )

    tenses_data = db.query(
        Sesion.tense,
        func.avg(Sesion.puntaje_total).label("promedio"),
        func.count(Sesion.id).label("total")
    ).filter(Sesion.usuario_id == usuario_id).group_by(Sesion.tense).all()

    stats = [
        TenseStatSchema(
            name=t.tense.capitalize(),
            score=round(t.promedio, 2),
            total=t.total
        )
        for t in tenses_data
    ]

    weakest = None
    if stats:
        weakest_stat = min(stats, key=lambda x: x.score)
        weakest = WeakestTenseSchema(name=weakest_stat.name, score=weakest_stat.score)


    errores_data = db.query(
        DetalleRespuesta.categoria_error,
        func.count(DetalleRespuesta.id).label("conteo_errores"),
        func.avg(DetalleRespuesta.puntaje).label("mastery")
    ).join(Sesion).filter(
        Sesion.usuario_id == usuario_id,
        DetalleRespuesta.categoria_error.isnot(None),
        DetalleRespuesta.puntaje < 100
    ).group_by(DetalleRespuesta.categoria_error)\
     .order_by(func.count(DetalleRespuesta.id).desc()).limit(5).all()

    weaknesses = [
        WeaknessItemSchema(
            category=err.categoria_error,
            mastery_level=round(err.mastery, 2),
            error_count=err.conteo_errores
        )
        for err in errores_data
    ]

    recomendaciones = []
    if weakest:
        recomendaciones.append(f"El usuario necesita enfocar su práctica en el tiempo: {weakest.name}.")
    
    for w in weaknesses[:2]:
        recomendaciones.append(f"Debería repasar las reglas de: {w.category.lower()}.")

    if not recomendaciones:
        recomendaciones.append("El usuario tiene un excelente desempeño.")

    return DashboardResponse(
        totalExercises=total_ejercicios,
        weakestTense=weakest,
        stats=stats,
        report=ReportDataSchema(
            recommendations=recomendaciones,
            weaknesses=weaknesses
        )
    )


@router.get("/report/pdf")
def descargar_reporte_pdf(
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_usuario_actual)
):
    sesiones = (
        db.query(Sesion)
        .filter(Sesion.usuario_id == usuario_actual.id)
        .order_by(Sesion.fecha.desc())
        .limit(12)
        .all()
    )

    if not sesiones:
        raise HTTPException(status_code=404, detail="No hay sesiones para generar el reporte")

    promedio = round(sum(s.puntaje_total for s in sesiones) / len(sesiones), 2)
    mejor = max(sesiones, key=lambda s: s.puntaje_total)

    lines = [
        f"Fecha de generacion: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        f"Alumno: {getattr(usuario_actual, 'nombre', 'Usuario')} {getattr(usuario_actual, 'apellidos', '')}".strip(),
        f"Total de sesiones incluidas: {len(sesiones)}",
        f"Promedio: {promedio}%",
        f"Mejor modulo reciente: {mejor.modulo} ({round(mejor.puntaje_total, 2)}%)",
        " ",
        "Historial reciente:",
    ]

    for sesion in sesiones:
        fecha_txt = sesion.fecha.strftime("%Y-%m-%d") if sesion.fecha else "sin fecha"
        lines.append(
            f"- {fecha_txt} | {sesion.modulo} | {sesion.tense} | {round(sesion.puntaje_total, 2)}%"
        )

    pdf_bytes = _build_simple_pdf("Reporte de Progreso VerboFlete", lines)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=reporte_progreso.pdf"},
    )


def _streaks_from_dates(dates: list[date]) -> tuple[int, int]:
    if not dates:
        return 0, 0

    unique_dates = sorted(set(dates))

    longest = 1
    current_run = 1
    for i in range(1, len(unique_dates)):
        if (unique_dates[i] - unique_dates[i - 1]).days == 1:
            current_run += 1
            longest = max(longest, current_run)
        else:
            current_run = 1

    today = datetime.utcnow().date()
    latest = unique_dates[-1]
    if (today - latest).days > 1:
        return 0, longest

    current = 1
    for i in range(len(unique_dates) - 1, 0, -1):
        if (unique_dates[i] - unique_dates[i - 1]).days == 1:
            current += 1
        else:
            break

    return current, longest


@router.get("/gamification", response_model=GamificationResponse)
def obtener_gamificacion(
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_usuario_actual)
):
    sesiones = (
        db.query(Sesion)
        .filter(Sesion.usuario_id == usuario_actual.id)
        .order_by(Sesion.fecha.asc())
        .all()
    )

    fechas = [s.fecha.date() for s in sesiones if s.fecha is not None]
    current_streak, longest_streak = _streaks_from_dates(fechas)

    total_sesiones = len(sesiones)
    tiene_cien = any((s.puntaje_total or 0) >= 100 for s in sesiones)
    promedio = round(sum((s.puntaje_total or 0) for s in sesiones) / total_sesiones, 2) if total_sesiones else 0

    badges = [
        BadgeItemSchema(key="first_session", label="Primer Paso", unlocked=total_sesiones >= 1),
        BadgeItemSchema(key="streak_3", label="Constancia 3 dias", unlocked=current_streak >= 3),
        BadgeItemSchema(key="streak_7", label="Racha 7 dias", unlocked=current_streak >= 7),
        BadgeItemSchema(key="perfect_score", label="Puntaje Perfecto", unlocked=tiene_cien),
        BadgeItemSchema(key="veteran_50", label="Veterano 50 sesiones", unlocked=total_sesiones >= 50),
        BadgeItemSchema(key="average_85", label="Promedio 85+", unlocked=promedio >= 85),
    ]

    return GamificationResponse(
        current_streak=current_streak,
        longest_streak=longest_streak,
        badges=badges,
    )