from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from openai import AsyncOpenAI

from app.core.database import get_db
from app.core.security import get_usuario_actual
from app.models import Usuario
from app.models.vocabulary import VocabularioItem
from app.schemas.vocabulary import (
    ConfiguracionVocabulario,
    GuardarVocabularioRequest,
    RevisarVocabularioRequest,
    RevisarVocabularioResponse,
    VocabularioGeneradoItem,
    VocabularioGeneradoResponse,
    VocabularioItemResponse,
    VocabularioStatsResponse,
)
from app.services.ia_service import generar_vocabulario_ia, get_openai_client

router = APIRouter(prefix="/vocabulary", tags=["Vocabulario + SRS"])


VOCAB_FALLBACK = {
    "A1": [
        ("bonjour", "hola", "Bonjour, je suis etudiant."),
        ("maison", "casa", "La maison est grande."),
        ("manger", "comer", "Je vais manger avec ma famille."),
        ("lire", "leer", "Nous aimons lire le soir."),
        ("ecole", "escuela", "L'ecole est pres d'ici."),
        ("ami", "amigo", "Mon ami parle francais."),
        ("eau", "agua", "Je bois de l'eau."),
        ("travail", "trabajo", "Elle commence le travail tot."),
    ],
    "B1": [
        ("ameliorer", "mejorar", "Je veux ameliorer ma prononciation."),
        ("reussir", "lograr", "Tu vas reussir ton examen."),
        ("environnement", "entorno", "L'environnement de travail est calme."),
        ("habitude", "habito", "J'ai l'habitude de lire chaque jour."),
        ("soutenir", "apoyar", "Nous devons soutenir nos camarades."),
        ("objectif", "objetivo", "Mon objectif est de parler couramment."),
        ("debattre", "debatir", "Ils aiment debattre sur l'education."),
        ("progres", "progreso", "Tes progres sont visibles."),
    ],
    "B2": [
        ("approfondir", "profundizar", "Je souhaite approfondir ce sujet."),
        ("nuancer", "matizar", "Il faut nuancer cette opinion."),
        ("pertinent", "pertinente", "Ton argument est pertinent."),
        ("coherence", "coherencia", "La coherence du texte est excellente."),
        ("mobiliser", "movilizar", "Nous pouvons mobiliser plus de ressources."),
        ("synthese", "sintesis", "Fais une synthese de ce chapitre."),
        ("enjeu", "desafio", "L'enjeu principal est la communication."),
        ("soutenable", "sostenible", "Cette solution n'est pas soutenable."),
    ],
}


@router.post("/generate", response_model=VocabularioGeneradoResponse)
async def generar_vocabulario(
    config: ConfiguracionVocabulario,
    client: AsyncOpenAI | None = Depends(get_openai_client),
):
    ia_result = await generar_vocabulario_ia(
        nivel=config.nivel,
        contexto=config.contexto,
        cantidad=config.cantidad,
        client=client,
    )

    if ia_result and isinstance(ia_result, dict) and isinstance(ia_result.get("items"), list):
        items_normalizados = []
        for item in ia_result["items"][: config.cantidad]:
            termino = str(item.get("termino", "")).strip()
            traduccion = str(item.get("traduccion", "")).strip()
            ejemplo = str(item.get("ejemplo", "")).strip()
            if termino and traduccion:
                items_normalizados.append(
                    VocabularioGeneradoItem(termino=termino, traduccion=traduccion, ejemplo=ejemplo)
                )

        if items_normalizados:
            return VocabularioGeneradoResponse(items=items_normalizados)

    base = VOCAB_FALLBACK.get(config.nivel.upper(), VOCAB_FALLBACK["A1"])

    items = [
        VocabularioGeneradoItem(termino=t, traduccion=tr, ejemplo=ej)
        for (t, tr, ej) in base[: config.cantidad]
    ]

    if config.contexto.strip():
        contexto = config.contexto.strip()
        items = [
            VocabularioGeneradoItem(
                termino=item.termino,
                traduccion=item.traduccion,
                ejemplo=f"{item.ejemplo} ({contexto})",
            )
            for item in items
        ]

    return VocabularioGeneradoResponse(items=items)


@router.post("/save", response_model=VocabularioItemResponse)
def guardar_vocabulario(
    payload: GuardarVocabularioRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    nuevo = VocabularioItem(
        usuario_id=usuario_actual.id,
        termino=payload.termino.strip(),
        traduccion=payload.traduccion.strip(),
        ejemplo=payload.ejemplo.strip() if payload.ejemplo else None,
        contexto=payload.contexto.strip() if payload.contexto else None,
        nivel=payload.nivel.strip() if payload.nivel else None,
        proximo_repaso=datetime.now(timezone.utc),
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/my", response_model=List[VocabularioItemResponse])
def listar_mi_vocabulario(
    nivel: str | None = Query(default=None),
    contexto: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    query = db.query(VocabularioItem).filter(VocabularioItem.usuario_id == usuario_actual.id)

    if nivel:
        query = query.filter(func.lower(VocabularioItem.nivel) == nivel.lower())
    if contexto:
        query = query.filter(func.lower(VocabularioItem.contexto).contains(contexto.lower()))
    if search:
        query = query.filter(
            func.lower(VocabularioItem.termino).contains(search.lower())
            | func.lower(VocabularioItem.traduccion).contains(search.lower())
        )

    return query.order_by(VocabularioItem.proximo_repaso.asc(), VocabularioItem.id.desc()).all()


@router.get("/due", response_model=List[VocabularioItemResponse])
def listar_vocabulario_pendiente(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    ahora = datetime.now(timezone.utc)
    return (
        db.query(VocabularioItem)
        .filter(
            VocabularioItem.usuario_id == usuario_actual.id,
            VocabularioItem.proximo_repaso <= ahora,
        )
        .order_by(VocabularioItem.proximo_repaso.asc())
        .all()
    )


@router.get("/stats", response_model=VocabularioStatsResponse)
def estadisticas_vocabulario(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    ahora = datetime.now(timezone.utc)

    total = db.query(VocabularioItem).filter(VocabularioItem.usuario_id == usuario_actual.id).count()
    pendientes = (
        db.query(VocabularioItem)
        .filter(VocabularioItem.usuario_id == usuario_actual.id, VocabularioItem.proximo_repaso <= ahora)
        .count()
    )

    aciertos_sum, errores_sum = (
        db.query(
            func.coalesce(func.sum(VocabularioItem.aciertos), 0),
            func.coalesce(func.sum(VocabularioItem.errores), 0),
        )
        .filter(VocabularioItem.usuario_id == usuario_actual.id)
        .one()
    )

    total_intentos = aciertos_sum + errores_sum
    tasa = round((aciertos_sum / total_intentos) * 100, 2) if total_intentos > 0 else 0.0

    nivel_top_data = (
        db.query(VocabularioItem.nivel, func.count(VocabularioItem.id).label("conteo"))
        .filter(VocabularioItem.usuario_id == usuario_actual.id)
        .group_by(VocabularioItem.nivel)
        .order_by(func.count(VocabularioItem.id).desc())
        .first()
    )

    nivel_top = nivel_top_data[0] if nivel_top_data and nivel_top_data[0] else "sin datos"

    return VocabularioStatsResponse(
        total_palabras=total,
        pendientes_hoy=pendientes,
        tasa_acierto=tasa,
        nivel_top=nivel_top,
    )


def _sm2_update(item: VocabularioItem, calidad: int) -> None:
    if calidad < 3:
        item.repeticiones = 0
        item.intervalo_dias = 1
        item.errores += 1
    else:
        item.aciertos += 1
        if item.repeticiones == 0:
            item.intervalo_dias = 1
        elif item.repeticiones == 1:
            item.intervalo_dias = 3
        else:
            item.intervalo_dias = round(item.intervalo_dias * item.factor_facilidad)

        item.repeticiones += 1

    nuevo_factor = item.factor_facilidad + (0.1 - (5 - calidad) * (0.08 + (5 - calidad) * 0.02))
    item.factor_facilidad = max(1.3, round(nuevo_factor, 2))
    item.proximo_repaso = datetime.now(timezone.utc) + timedelta(days=item.intervalo_dias)


@router.post("/review", response_model=RevisarVocabularioResponse)
def revisar_vocabulario(
    payload: RevisarVocabularioRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    item = (
        db.query(VocabularioItem)
        .filter(
            VocabularioItem.id == payload.item_id,
            VocabularioItem.usuario_id == usuario_actual.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Palabra no encontrada")

    _sm2_update(item, payload.calidad)
    db.add(item)
    db.commit()
    db.refresh(item)

    mensaje = "Buen trabajo. Esta palabra tardara mas en volver." if payload.calidad >= 4 else "La veremos pronto para reforzarla."
    return RevisarVocabularioResponse(item=item, mensaje=mensaje)
