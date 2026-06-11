import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_usuario_actual
from app.models import Usuario
from app.models.response_detail import DetalleRespuesta
from app.models.session import Sesion

# NOTA: Asegúrate de definir estos esquemas (Pydantic) en app.schemas.listening
from app.schemas.listening import (
    ConfiguracionListening, 
    ListeningOpcionesResponse, # El nuevo esquema con la estructura JSON que necesitas
    ListeningOpcionesGradeRequest, # Esquema para recibir la respuesta elegida por el usuario
    ListeningGradeResponse
)
# Asumimos que extiendes tu servicio de IA para soportar preguntas de opción múltiple
from app.services.ia_service import (
    generar_texto_listening_ia, 
    generar_audio_tts, 
    evaluar_listening_ia,
    generar_opciones_listening_ia # <-- Nueva función hipotética para estructurar el cuestionario
)

router = APIRouter(prefix="/listening", tags=["Módulo Escuchar"])

@router.post("/generate-opciones", response_model=ListeningOpcionesResponse)
async def listening_generate_opciones(
    config: ConfiguracionListening,
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    try:
        # 1. Generamos el texto (esto tiene que ir primero por fuerza)
        texto = await generar_texto_listening_ia(
            nivel=config.nivel,
            contexto=config.contexto,
            grupo_verbos=config.grupo_verbos,
            mood=config.mood,
            tense=config.tense
        )
        
        # 2. ⚡ AQUÍ ESTÁ LA MAGIA DE LA VELOCIDAD ⚡
        # Mandamos a pedir el audio y las opciones al MISMO TIEMPO
        audio_b64, cuestionario_ia = await asyncio.gather(
            generar_audio_tts(texto),
            generar_opciones_listening_ia(texto, config.nivel)
        )
        
        return ListeningOpcionesResponse(
            id=cuestionario_ia.get("id", "generado_dinamicamente"),
            urlAudio=audio_b64, # Tu string de Base64 o URL guardada
            pregunta=cuestionario_ia.get("pregunta", "¿De qué trata el audio?"),
            opciones=cuestionario_ia.get("opciones", []),
            idOpcionCorrecta=cuestionario_ia.get("idOpcionCorrecta"),
            explicacion=cuestionario_ia.get("explicacion", "Sin explicación disponible")
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al generar las opciones: {str(e)}"
        )


@router.post("/grade-opciones", response_model=ListeningGradeResponse)
async def listening_grade_opciones(
    request: ListeningOpcionesGradeRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    try:
        # Evaluamos si la opción enviada por el usuario coincide con la correcta
        es_correcta = request.id_opcion_usuario == request.id_opcion_correcta
        score = 100.0 if es_correcta else 0.0
        
        feedback = (
            f"¡Excelente! Respuesta correcta. {request.explicacion}" 
            if es_correcta 
            else f"Incorrecto. La respuesta correcta era la {request.id_opcion_correcta}. {request.explicacion}"
        )

        # Registramos la sesión en el historial del usuario
        nueva_sesion = Sesion(
            usuario_id=usuario_actual.id,
            modulo="escuchar_opciones",
            mood=request.config.mood,
            tense=request.config.tense,
            puntaje_total=score,
            texto_generado_ia=request.pregunta # Guardamos la pregunta realizada
        )
        db.add(nueva_sesion)
        db.flush()

        # Guardamos el detalle específico del fallo o acierto
        detalle = DetalleRespuesta(
            sesion_id=nueva_sesion.id,
            verbo_infinitivo="Opción Múltiple",
            respuesta_correcta=request.id_opcion_correcta,
            respuesta_usuario=request.id_opcion_usuario,
            puntaje=score,
            categoria_error="Comprensión Oral - Opciones",
            feedback_ia=feedback
        )
        db.add(detalle)
        db.commit()
        
        return ListeningGradeResponse(
            score=score,
            feedback=feedback,
            texto_original=request.pregunta
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al procesar la calificación: {str(e)}"
        )