import logging
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_usuario_actual
from app.models import Usuario
from app.schemas.reading import CalificarReadingRequest, ConfiguracionReading, ReadingGenerateResponse
from app.services.ia_service import generar_reading_ia
from app.core.database import get_db
from app.models.session import Sesion
from app.models.response_detail import DetalleRespuesta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reading", tags=["Módulo Lectura"])

@router.post("/generate", response_model=ReadingGenerateResponse)
async def reading_generate(
    config: ConfiguracionReading,
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    try:
        # Llamamos a la función chingona que acabamos de hacer
        datos_ia = await generar_reading_ia(
            nivel=config.nivel,
            contexto=config.contexto,
            grupo_verbos=config.grupo_verbos,
            mood=config.mood,
            tense=config.tense
        )
        
        # FastAPI y Pydantic se encargan de validar que el JSON venga bien
        return ReadingGenerateResponse(
            texto_frances=datos_ia["texto_frances"],
            preguntas=datos_ia["preguntas"]
        )
        
    except Exception as e:
        logger.error(f"Error generando reading: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al generar el texto de lectura: {str(e)}"
        )
@router.post("/evaluate")
async def evaluate_reading(
    data: CalificarReadingRequest,
    db: Sesion = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    try:
        import json
        quiz_data = json.loads(data.json_original)
        preguntas = quiz_data.get("preguntas", [])
        
        aciertos = 0
        errores_reporte = []

        # Comparamos cada respuesta
        for resp in data.respuestas_usuario:
            idx = resp.pregunta_idx
            opcion_elegida = resp.opcion_idx
            
            pregunta_real = preguntas[idx]
            # Buscamos cuál era la correcta en el JSON original
            idx_correcta = next(i for i, o in enumerate(pregunta_real["opciones"]) if o["es_correcta"])
            
            if opcion_elegida == idx_correcta:
                aciertos += 1
            else:
                # Si falló, guardamos el reporte del error incluyendo la explicación si existe
                explicacion_error = pregunta_real['opciones'][opcion_elegida].get('explicacion', 'Sin explicación.')
                errores_reporte.append(
                    f"Pregunta: {pregunta_real['pregunta']} | Elegiste: {pregunta_real['opciones'][opcion_elegida]['texto']} "
                    f"| Era: {pregunta_real['opciones'][idx_correcta]['texto']} | Feedback: {explicacion_error}"
                )

        # Calculamos score base 100
        score_final = (aciertos / len(preguntas)) * 100

        # 1. Guardamos la Sesión
        nueva_sesion = Sesion(
            usuario_id=usuario_actual.id,
            modulo="Lectura",
            mood=data.config.mood,
            tense=data.config.tense,
            puntaje_total=score_final,
            texto_generado_ia=quiz_data["texto_frances"] # Guardamos el texto para el historial
        )
        db.add(nueva_sesion)
        db.flush()

        # 2. Guardamos el Detalle (Reporte de errores)
        detalle = DetalleRespuesta(
            sesion_id=nueva_sesion.id,
            verbo_infinitivo="Comprensión Lectora",
            respuesta_correcta=f"{aciertos}/{len(preguntas)} aciertos",
            respuesta_usuario=" | ".join(errores_reporte) if errores_reporte else "¡Perfecto!",
            puntaje=score_final,
            categoria_error="Reading Comprehension",
            feedback_ia="Evaluación automática" # Sin feedback de IA como pediste
        )
        db.add(detalle)
        db.commit()

        return {"score": score_final, "aciertos": aciertos}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))