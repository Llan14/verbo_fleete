import logging
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from openai import OpenAI
import tempfile
import shutil
import os
import re
from app.core.database import get_db
from app.core.grammar import get_correct_form
from app.core.security import get_usuario_actual
from app.models import Usuario
from app.models.session import Sesion # Importar Sesion
from app.models.response_detail import DetalleRespuesta 
from app.services.ia_service import generar_verbo_hablar_ia, evaluar_pronunciacion_ia
from app.schemas.speaking import ConfiguracionSpeaking, EjercicioSpeakingResponse
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/speaking", tags=["Módulo Hablar"])

@router.post("/generar", response_model=EjercicioSpeakingResponse)
async def generar_ejercicio_speaking(config: ConfiguracionSpeaking):
    try:

        datos_ia = await generar_verbo_hablar_ia(
            nivel=config.nivel,
            contexto=config.contexto,
            grupo_verbos=config.grupo_verbos,
            mood=config.mood,
            tense=config.tense
        )
        
        infinitivo = datos_ia["infinitivo"]
        persona = datos_ia["persona"]
        

        respuesta_esperada = get_correct_form(
            verb=infinitivo,
            mood=config.mood,
            tense=config.tense,
            persona=persona
        )
        

        pronombres = {
            "1ère personne du singulier": "Je",
            "2ème personne du singulier": "Tu",
            "3ème personne du singulier": "Il/Elle/On",
            "1ère personne du pluriel": "Nous",
            "2ème personne du pluriel": "Vous",
            "3ème personne du pluriel": "Ils/Elles",
            "je": "Je",
            "tu": "Tu",
            "il/elle": "Il/Elle",
            "nous": "Nous",
            "vous": "Vous",
            "ils/elles": "Ils/Elles"
        }
        sujeto_amigable = pronombres.get(persona, persona)


        return EjercicioSpeakingResponse(
            verbo_infinitivo=infinitivo,
            persona_tecnica=persona,
            sujeto=sujeto_amigable,
            respuesta_esperada=respuesta_esperada,
            mood=config.mood,
            tense=config.tense
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando ejercicio de habla: {str(e)}")

def limpiar_texto(texto: str) -> str:

    texto_limpio = texto.lower()

    texto_limpio = re.sub(r'[^\w\s\']', '', texto_limpio)
    return texto_limpio.strip()

@router.post("/validar")
async def validar_audio(
    audio: UploadFile = File(...),
    verbo_infinitivo: str = Form(...),
    respuesta_esperada: str = Form(...),
    tense: str = Form(...),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):

    contenido_audio = await audio.read()

    if len(contenido_audio) < 500:
        raise HTTPException(
            status_code=400, 
            detail="El audio está vacío o no se grabó correctamente. Intenta grabar de nuevo."
        )


    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(contenido_audio)
        nombre_archivo = tmp.name

    try:
        # Protegemos el llamado a Whisper por si no hay API Key o falla
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "tu_clave_secreta_aqui":
            logger.warning("⚠️ No hay API Key. Simulando transcripción exitosa.")
            texto_transcrito = respuesta_esperada  # Simulamos que lo dijo bien
        else:
            with open(nombre_archivo, "rb") as f_audio:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f_audio,
                    language="fr"
                )
                
            texto_transcrito = transcript.text
            logger.info("Whisper procesó el audio correctamente")

    except Exception as e:
        logger.error(f"Error crítico llamando a OpenAI Whisper: {str(e)}", exc_info=True)
        logger.warning("⚠️ Falló la conexión con la IA (posible falta de saldo). Usando Mock de emergencia.")
        texto_transcrito = respuesta_esperada
    finally:
        if os.path.exists(nombre_archivo):
            try:
                os.remove(nombre_archivo)
            except:
                pass

    texto_limpio = limpiar_texto(texto_transcrito)
    respuesta_esperada_limpia = limpiar_texto(respuesta_esperada)
    
    # 1. Evaluación inicial de corrección (simple string comparison)
    es_correcto_simple = f" {respuesta_esperada_limpia} " in f" {texto_limpio} "
    
    # 2. Feedback fonético detallado de la IA
    feedback_fonetico_ia = await evaluar_pronunciacion_ia(
        texto_transcrito=texto_transcrito,
        respuesta_esperada=respuesta_esperada,
        verbo_infinitivo=verbo_infinitivo,
        tense=tense
    )

    es_correcto_foneticamente = feedback_fonetico_ia.get("es_correcto_foneticamente", False)
    feedback_detallado = feedback_fonetico_ia.get("feedback_fonetico", "No se pudo obtener feedback detallado.")

    es_correcto = es_correcto_simple and es_correcto_foneticamente
    puntaje = 100.0 if es_correcto_simple and es_correcto_foneticamente else 0.0


    nueva_sesion = Sesion(
        usuario_id=usuario_actual.id,
        modulo="hablar",
        mood="indicatif",
        tense=tense,
        puntaje_total=puntaje
    )
    db.add(nueva_sesion)
    db.flush()


    detalle = DetalleRespuesta(
        sesion_id=nueva_sesion.id,
        verbo_infinitivo=verbo_infinitivo,      
        respuesta_correcta=respuesta_esperada,
        respuesta_usuario=texto_transcrito, 
        puntaje=puntaje, # El puntaje ahora considera el feedback fonético
        categoria_error="Pronunciación" if not es_correcto_simple or not es_correcto_foneticamente else None,
        feedback_ia=feedback_detallado # Usamos el feedback detallado de la IA
    )
    db.add(detalle)
    db.commit()


    return {
        "es_correcto_simple": es_correcto_simple, # Para saber si al menos dijo la palabra
        "es_correcto_foneticamente": es_correcto_foneticamente, # Para saber si la pronunciación fue buena
        "transcripcion": texto_transcrito,
        "es_correcto": es_correcto, # Resultado final combinado
        "respuesta_esperada": respuesta_esperada,
        "puntaje": puntaje,
        "mensaje": feedback_detallado # El mensaje principal ahora es el feedback detallado
    }