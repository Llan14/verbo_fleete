from openai import AsyncOpenAI

from app.schemas.ai import ExerciseDraftCreateRequest
from app.services.ia_service import (
    generar_contexto_escritura_ia,
    generar_gramatica_huecos_ia,
    generar_opciones_listening_ia,
    generar_reading_ia,
    generar_texto_listening_ia,
    generar_verbo_hablar_ia,
)


async def generate_exercise_payload(request: ExerciseDraftCreateRequest, client: AsyncOpenAI | None):
    module = request.module

    if module == "reading":
        return await generar_reading_ia(
            nivel=request.nivel,
            contexto=request.contexto,
            grupo_verbos=request.grupo_verbos,
            mood=request.mood,
            tense=request.tense,
            client=client,
        )

    if module == "grammar":
        return await generar_gramatica_huecos_ia(
            nivel=request.nivel,
            contexto=request.contexto,
            grupo_verbos=request.grupo_verbos,
            mood=request.mood,
            tense=request.tense,
            client=client,
        )

    if module == "speaking":
        return await generar_verbo_hablar_ia(
            nivel=request.nivel,
            contexto=request.contexto,
            grupo_verbos=request.grupo_verbos,
            mood=request.mood,
            tense=request.tense,
            client=client,
        )

    if module == "writing":
        return await generar_contexto_escritura_ia(
            nivel=request.nivel,
            contexto=request.contexto,
            grupo_verbos=request.grupo_verbos,
            mood=request.mood,
            tense=request.tense,
            client=client,
        )

    if module == "listening":
        texto = await generar_texto_listening_ia(
            nivel=request.nivel,
            contexto=request.contexto,
            grupo_verbos=request.grupo_verbos,
            mood=request.mood,
            tense=request.tense,
            client=client,
        )
        opciones = await generar_opciones_listening_ia(texto, request.nivel, client=client)
        return {
            "texto": texto,
            "cuestionario": opciones,
        }

    raise ValueError(f"Módulo no soportado: {module}")
