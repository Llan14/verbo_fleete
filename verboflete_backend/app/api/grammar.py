import logging
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_usuario_actual
from app.models import Usuario
from app.schemas.grammar import ConfiguracionGramatica, GramaticaGenerateResponse
from app.services.ia_service import generar_gramatica_huecos_ia
from app.core.database import get_db
from app.models.response_detail import DetalleRespuesta
from app.models.session import Sesion
from app.schemas.grammar import CalificarGramaticaRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/grammar", tags=["Módulo Gramática (Huecos)"])

@router.post("/generate", response_model=GramaticaGenerateResponse)
async def gramatica_generate(
    config: ConfiguracionGramatica,
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    try:
        # Llamamos al motor de IA con tus 5 parámetros sagrados
        datos_ia = await generar_gramatica_huecos_ia(
            nivel=config.nivel,
            contexto=config.contexto,
            grupo_verbos=config.grupo_verbos,
            mood=config.mood,
            tense=config.tense
        )
        
        # Pydantic valida que la respuesta cumpla con la estructura exacta
        return GramaticaGenerateResponse(
            texto_con_huecos=datos_ia["texto_con_huecos"],
            huecos=datos_ia["huecos"]
        )
        
    except Exception as e:
        logger.error(f"--- ❌ ERROR GENERANDO GRAMÁTICA ---")
        logger.exception(e)
        raise HTTPException(
            status_code=500, 
            detail=f"Error al generar el ejercicio de gramática: {str(e)}"
        )

@router.post("/evaluate")
async def evaluate_gramatica(
    data: CalificarGramaticaRequest,
    db: Sesion = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    try:
        import json
        # 1. Parseamos el JSON original que la IA generó antes
        ejercicio_original = json.loads(data.json_original)
        huecos_reales = ejercicio_original.get("huecos", [])
        
        aciertos = 0
        total_huecos = len(huecos_reales)
        errores_reporte = []

        # Convertimos la lista de huecos reales en un diccionario para buscar más rápido
        dict_huecos_reales = {h["id_hueco"]: h for h in huecos_reales}

        # 2. Comparamos las respuestas del usuario
        for resp in data.respuestas_usuario:
            hueco_real = dict_huecos_reales.get(resp.id_hueco)
            
            if not hueco_real:
                continue # Si por alguna razón manda un hueco que no existe, lo saltamos
                
            opciones = hueco_real["opciones"]
            opcion_elegida = resp.opcion_idx
            
            # Buscamos cuál era el índice de la opción correcta
            try:
                idx_correcta = next(
                    i for i, o in enumerate(opciones) 
                    if o.get("es_correcta") is True or str(o.get("es_correcta")).lower() == "true"
                )
            except StopIteration:
            # Si la IA falló y no mandó ninguna correcta, asignamos la opción 0 por defecto
            # para que el backend no colapse y el usuario pueda terminar su sesión.
                logger.warning(f"La IA no marcó ninguna opción correcta para el hueco {resp.id_hueco}. Forzando índice 0.")
                idx_correcta = 0
            
            if opcion_elegida == idx_correcta:
                aciertos += 1
            else:
                # Si falló, armamos el chisme para el reporte
                texto_elegido = opciones[opcion_elegida]["texto"] if 0 <= opcion_elegida < len(opciones) else "Ninguna"
                texto_correcto = opciones[idx_correcta]["texto"]
                explicacion = hueco_real.get("explicacion", "Revisa la gramática.")
                
                errores_reporte.append(
                    f"Hueco {resp.id_hueco} | Elegiste: '{texto_elegido}' | Correcto: '{texto_correcto}' -> {explicacion}"
                )

        # 3. Calculamos el score base 100
        score_final = (aciertos / total_huecos) * 100 if total_huecos > 0 else 0

        # 4. Guardamos la Sesión Principal
        nueva_sesion = Sesion(
            usuario_id=usuario_actual.id,
            modulo="gramatica",
            mood=data.config.mood,
            tense=data.config.tense,
            puntaje_total=score_final,
            texto_generado_ia=ejercicio_original["texto_con_huecos"] # Guardamos la historia original
        )
        db.add(nueva_sesion)
        db.flush() # Para obtener el ID de la sesión antes del commit final

        # 5. Guardamos el Detalle (El reporte de errores)
        detalle = DetalleRespuesta(
            sesion_id=nueva_sesion.id,
            verbo_infinitivo="Rellenar Huecos", # Le ponemos un nombre genérico
            respuesta_correcta=f"{aciertos}/{total_huecos} aciertos",
            respuesta_usuario=" | ".join(errores_reporte) if errores_reporte else "¡Todo perfecto, crack!",
            puntaje=score_final,
            categoria_error="Gramática (Opciones Múltiples)",
            feedback_ia="Evaluación automática. " + ("Revisa los errores." if errores_reporte else "¡Excelente trabajo!")
        )
        db.add(detalle)
        db.commit()

        # 6. Le regresamos al Frontend el resultado
        return {
            "score": score_final, 
            "aciertos": aciertos,
            "total": total_huecos,
            "mensaje": "¡Guardado en el dashboard!"
        }

    except Exception as e:
        db.rollback()
        logger.error(f"--- ❌ ERROR EVALUANDO GRAMÁTICA ---")
        logger.exception(e)
        raise HTTPException(status_code=500, detail=f"Error evaluando el ejercicio: {str(e)}")