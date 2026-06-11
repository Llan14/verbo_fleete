from app.core.config import settings
from asyncio.log import logger
import os
from openai import AsyncOpenAI
from openai import AsyncOpenAI, AuthenticationError, RateLimitError
import json
import uuid

client =AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

import json
async def _ejecutar_con_reintentos(mensajes, fallback_mock=None, response_format={"type": "json_object"}, max_retries=3, temperature=0.7):
    """
    Llama a OpenAI con reintentos. Si falla por falta de API Key o porque el JSON
    es inválido repetidas veces, devuelve un mock de prueba para no romper la app.
    """
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "tu_clave_secreta_aqui":
        logger.warning("⚠️ No hay API Key configurada. Usando datos de prueba (Mock).")
        return fallback_mock

    for intento in range(max_retries):
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=mensajes,
                response_format=response_format if response_format else None,
                temperature=temperature
            )
            
            if response_format and response_format.get("type") == "json_object":
                contenido = response.choices[0].message.content
                return json.loads(contenido)
            else:
                return response.choices[0].message.content.strip()
                
        except (AuthenticationError, RateLimitError):
            logger.error("❌ Error de Autenticación o Cuota con OpenAI (API Key inválida o sin saldo). Usando Mock.")
            return fallback_mock
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ La IA devolvió un JSON malformado (Intento {intento+1}/{max_retries}): {e}")
        except Exception as e:
            logger.warning(f"⚠️ Error genérico en la IA (Intento {intento+1}/{max_retries}): {e}")
            
    logger.error("❌ Se agotaron los reintentos de la IA. Usando Mock de emergencia.")
    return fallback_mock

async def generar_reading_ia(nivel: str, contexto: str, grupo_verbos: str, mood: str, tense: str):
    # 1. El diccionario maestro de longitudes
    limites_palabras = {
        "A1": "60 y 80",
        "A2": "80 y 100",
        "B1": "120 y 180",
        "B2": "180 y 220",
        "C1": "220 y 500"
    }
    
    # Sacamos el rango exacto basado en el nivel que llega de React
    rango_palabras = limites_palabras.get(nivel.upper(), "100 y 150")

    prompt = f"""
Eres un profesor experto de francés creando material de examen. 
Genera un texto de comprensión lectora en FRANCÉS adaptado al nivel {nivel}.

CONTEXTO Y GRAMÁTICA:
- Tema: "{contexto}"
- Modo: {mood}
- Tiempo verbal principal: {tense}
- Integra de forma natural verbos de este grupo: {grupo_verbos}.

⚠️ REGLA CRÍTICA DE LONGITUD (NIVEL {nivel}): ⚠️
El texto DEBE tener ESTRICTAMENTE entre {rango_palabras} palabras. 
Cuenta las palabras antes de generar la respuesta. Si el texto tiene menos o más palabras que este rango, el ejercicio será inválido.

REGLAS DEL QUIZ:
- Crea EXACTAMENTE 5 preguntas de comprensión lectora de opción múltiple en francés basadas en el texto.
- Cada pregunta debe tener 4 opciones de respuesta (solo una correcta).
- Las opciones incorrectas (distractores) deben ser plausibles pero claramente descartables si se leyó con atención. Evita opciones absurdas u obvias.

REGLAS JSON:
- Devuelve ÚNICAMENTE el JSON, sin explicaciones.

JSON:
{{
  "texto_frances": "...",
  "preguntas": [
    {{
      "pregunta": "...",
      "opciones": [
        {{"texto": "...", "es_correcta": true}},
        {{"texto": "...", "es_correcta": false}},
        {{"texto": "...", "es_correcta": false}},
        {{"texto": "...", "es_correcta": false}}
      ]
    }}
  ]
}}
"""
    
    mensajes = [
        {"role": "system", "content": "Experto en francés. JSON estricto."},
        {"role": "user", "content": prompt}
    ]

    mock_fallback = {
        "texto_frances": "(DATOS DE PRUEBA - SIN API KEY) Le petit garçon marche dans le parc. Il regarde les arbres et les oiseaux. Il est très content de voir le soleil briller.",
        "preguntas": [
            {
                "pregunta": "Où est le petit garçon?",
                "opciones": [
                    {"texto": "Dans le parc", "es_correcta": True},
                    {"texto": "Dans la maison", "es_correcta": False},
                {"texto": "Au supermarché", "es_correcta": False},
                    {"texto": "À l'école", "es_correcta": False}
                ]
            }
        ]
    }
    
    return await _ejecutar_con_reintentos(mensajes, mock_fallback)

async def generar_gramatica_huecos_ia(nivel: str, contexto: str, grupo_verbos: str, mood: str, tense: str):
    # 1. Diccionario de longitud
    limites_palabras = {
        "A1": "50 a 70",
        "A2": "70 a 100",
        "B1": "110 a 140",
        "B2": "150 a 190",
        "C1": "200 a 250"
    }
    rango_palabras = limites_palabras.get(nivel.upper(), "80 a 120")

    # 2. Diccionario de complejidad
    complejidad = {
        "A1": "Oraciones muy cortas y simples. Vocabulario básico.",
        "A2": "Oraciones conectadas con conectores básicos (et, mais, parce que).",
        "B1": "Textos fluidos, uso de pronombres relativos y subordinadas.",
        "B2": "Estructuras complejas, conectores lógicos avanzados.",
        "C1": "Lenguaje altamente sofisticado, expresiones idiomáticas complejas."
    }
    instruccion_complejidad = complejidad.get(nivel.upper(), "Complejidad intermedia.")

    huecos_por_nivel = {
        "A1": 4,
        "A2": 5,
        "B1": 7,
        "B2": 9,
        "C1": 12
    }
    num_huecos = huecos_por_nivel.get(nivel.upper(), 5)
    
    lista_marcadores = ", ".join([f"[BLANK_{i}]" for i in range(1, num_huecos + 1)])

    prompt = f"""
Eres un asistente de aprendizaje de francés. Crea un ejercicio mixto de "Rellenar huecos" (Fill-in-the-blanks) con opciones múltiples.

PARÁMETROS BASE:
- Nivel: {nivel}
- Contexto de la historia: "{contexto}"
- Verbos principales a utilizar: {grupo_verbos}
- Modo: {mood}
- Tiempo verbal principal: {tense}

⚠️ REGLAS ESTRICTAS DE LONGITUD Y COMPLEJIDAD: ⚠️
- El texto DEBE tener ESTRICTAMENTE entre {rango_palabras} palabras.
- Complejidad exigida: {instruccion_complejidad}

REGLAS DEL TEXTO Y LOS HUECOS:
- Selecciona EXACTAMENTE {num_huecos} palabras clave en el texto para convertirlas en huecos.
- MUY IMPORTANTE: Los huecos NO deben ser solo de verbos. Haz una mezcla de:
  1. Verbos conjugados (respetando {mood} y {tense}).
  2. Artículos (le, la, un...).
  3. Preposiciones (à, de, en...).
  4. Pronombres.
- Reemplaza esas {num_huecos} palabras en el texto EXCLUSIVAMENTE con estos marcadores: {lista_marcadores}.

REGLAS DE LAS OPCIONES:
- Para cada marcador, genera 4 opciones. Solo 1 debe ser correcta.
- Las opciones incorrectas deben ser errores comunes para estudiantes de nivel {nivel}.
- Las opciones incorrectas deben ser errores comunes para estudiantes de nivel {nivel} (falsos amigos, mala conjugación, errores de género o número).
- Asegúrate de que gramatical y lógicamente solo exista una respuesta válida posible para el contexto del hueco.
- Agrega una breve explicación (en español) de por qué la respuesta es correcta.

JSON ESTRICTO:
{{
  "texto_con_huecos": "...",
  "huecos": [
    {{
      "id_hueco": "[BLANK_1]",
      "explicacion": "...",
      "opciones": [
        {{"texto": "...", "es_correcta": true}},
        {{"texto": "...", "es_correcta": false}},
        {{"texto": "...", "es_correcta": false}},
        {{"texto": "...", "es_correcta": false}}
      ]
    }}
  ]
}}
"""
    
    mensajes = [
        {"role": "system", "content": "Experto en pedagogía francesa. Generador de JSON estricto."},
        {"role": "user", "content": prompt}
    ]

    mock_fallback = {
        "texto_con_huecos": "Je [BLANK_1] très heureux aujourd'hui. Nous [BLANK_2] au cinéma. (MODO PRUEBA - SIN API KEY)",
        "huecos": [
            {
                "id_hueco": "[BLANK_1]",
                "explicacion": "'suis' es el verbo être conjugado con je.",
                "opciones": [
                    {"texto": "suis", "es_correcta": True},
                    {"texto": "est", "es_correcta": False},
                {"texto": "es", "es_correcta": False},
                    {"texto": "sommes", "es_correcta": False}
                ]
            },
            {
                "id_hueco": "[BLANK_2]",
                "explicacion": "'allons' es el verbo aller conjugado con nous.",
                "opciones": [
                    {"texto": "allons", "es_correcta": True},
                    {"texto": "allez", "es_correcta": False},
                {"texto": "vont", "es_correcta": False},
                {"texto": "allions", "es_correcta": False}
                ]
            }
        ]
    }
    
    return await _ejecutar_con_reintentos(mensajes, mock_fallback)

async def generar_verbo_hablar_ia(nivel: str, contexto: str, grupo_verbos: str, mood: str, tense: str):
    prompt = f"""
Eres un asistente de aprendizaje de francés. Genera un ejercicio de conjugación oral en FRANCÉS 
para un estudiante de nivel {nivel}, en modo {mood} y tiempo {tense}, basado en el contexto: "{contexto}".

Elige UN ÚNICO verbo del siguiente grupo: {grupo_verbos}.

REGLAS JSON:
- Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin markdown, sin texto extra.
- 'infinitivo': El verbo elegido en infinitivo (ej: manger, finir, aller).
- 'persona': ÚNICAMENTE uno de estos pronombres directos: je, tu, il/elle, nous, vous, ils/elles.

JSON:
{{
  "infinitivo": "...",
  "mood": "{mood}",
  "tense": "{tense}",
  "persona": "..."
}}
"""
    
    mensajes = [
        {"role": "system", "content": "Experto en gramática francesa. Salida en JSON estricto."},
        {"role": "user", "content": prompt}
    ]
    mock_fallback = {
        "infinitivo": "parler",
        "mood": mood,
        "tense": tense,
        "persona": "je"
    }
    return await _ejecutar_con_reintentos(mensajes, mock_fallback)

async def generar_contexto_escritura_ia(nivel: str, contexto: str, grupo_verbos: str, mood: str, tense: str):
    prompt = f"""
Eres un asistente de aprendizaje de francés. Vas a iniciar un roleplay (chat) con un estudiante 
de nivel {nivel}, en modo {mood} y tiempo {tense}, sobre el contexto: "{contexto}".

Durante el chat, el estudiante deberá practicar verbos del siguiente grupo: {grupo_verbos}.

REGLAS JSON:
- Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin markdown, sin texto extra.
- 'escenario': Breve descripción en español para contextualizar al usuario (ej: "Estás en un café en París, yo soy el mesero. Pide tu orden usando verbos en presente").
- 'primer_mensaje': Tu primer mensaje en francés iniciando la interacción e invitando al usuario a responder.
- En lugar de nombres propios, usa ÚNICAMENTE pronombres directos: je, tu, il/elle, nous, vous, ils/elles.

JSON:
{{
  "escenario": "...",
  "primer_mensaje": "..."
}}
"""
    
    mensajes = [
        {"role": "system", "content": "Experto en roleplay educativo. Salida en JSON estricto."},
        {"role": "user", "content": prompt}
    ]
    mock_fallback = {"escenario": "Estás en el parque.", "primer_mensaje": "Bonjour, comment ça va?"}
    return await _ejecutar_con_reintentos(mensajes, mock_fallback)

async def generar_respuesta_chat_ia(mensaje: str, config: dict, historial: list):
    mensajes_api = [
        {"role": "system", "content": f"""
Eres un asistente de aprendizaje de francés en un roleplay con un estudiante de nivel {config['nivel']}, 
en modo {config['mood']} y tiempo {config['tense']}, sobre el contexto: "{config['contexto']}".

El estudiante practica verbos del siguiente grupo: {config['grupo_verbos']}.

REGLAS DE RESPUESTA:
- Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin markdown, sin texto extra.
- Continúa el roleplay de forma natural y termina siempre con una pregunta.
- En lugar de nombres propios, usa ÚNICAMENTE pronombres directos: je, tu, il/elle, nous, vous, ils/elles.
- 'correcciones': Analiza el ÚLTIMO mensaje del usuario. Si hay errores de conjugación o gramática, devuélvelos. Si fue correcto, devuelve [].

JSON:
{{
  "respuesta_chat": "...",
  "correcciones": [
    {{
      "error": "...",
      "correccion": "...",
      "explicacion": "..."
    }}
  ]
}}
"""}
    ]
    
    if historial:
        mensajes_api.extend(historial)
        
    mensajes_api.append({"role": "user", "content": mensaje})
    
    mock_fallback = {"respuesta_chat": "Très bien! Continue...", "correcciones": []}
    return await _ejecutar_con_reintentos(mensajes_api, mock_fallback)

import base64

async def generar_texto_listening_ia(nivel: str, contexto: str, grupo_verbos: str, mood: str, tense: str) -> str:    
    prompt = f"""
Eres un asistente de aprendizaje de francés. Escribe un dictado en FRANCÉS para un estudiante de nivel {nivel},
en modo {mood} y tiempo {tense}, sobre el contexto: "{contexto}".

INSTRUCCIONES DE DIFICULTAD SEGÚN NIVEL:
- A1/A2: Máximo 2 frases muy cortas, vocabulario básico, estructuras simples y directas.
- B1/B2: Un párrafo de 3-4 frases, vocabulario variado, oraciones compuestas.
- C1/C2: Un párrafo complejo, vocabulario rico, conectores avanzados.

REGLAS GENERALES:
- Usa verbos del siguiente grupo: {grupo_verbos}, en modo {mood} y tiempo {tense}.
- El texto debe sonar natural al ser leído en voz alta, como si fuera una narración o conversación real.
- Devuelve ÚNICAMENTE el texto en francés, sin JSON, sin introducciones, sin explicaciones.
    """
    
    mensajes = [{"role": "user", "content": prompt}]
    mock_fallback = "Bonjour, ceci est un test audio car la clé API OpenAI n'est pas configurée. Écoutez bien."
    return await _ejecutar_con_reintentos(mensajes, mock_fallback, response_format=None, temperature=0.3)

async def generar_audio_tts(texto: str) -> str:
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "tu_clave_secreta_aqui":
        logger.warning("⚠️ No hay API Key para TTS. Devolviendo audio vacío de prueba.")
        return "" # Retornamos vacío si no hay key
        
    try:
        response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=texto,
            response_format="mp3"
        )
        audio_b64 = base64.b64encode(response.content).decode('utf-8')
        return audio_b64
    except Exception as e:
        logger.error(f"❌ Error generando audio TTS: {e}")
        return ""

async def evaluar_listening_ia(texto_original: str, respuesta_usuario: str) -> dict:
    prompt = f"""
Eres un asistente de aprendizaje de francés. Evalúa el siguiente dictado de comprensión oral.

Texto original: "{texto_original}"
Lo que escribió el alumno: "{respuesta_usuario}"

REGLAS JSON:
- Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin markdown, sin texto extra.
- 'score': Número de 0 a 100 basado en qué tan bien identificó las palabras al escucharlas.
- 'feedback': Feedback pedagógico en español enfocado en la comprensión auditiva:
    * Qué palabras o frases no logró identificar correctamente y por qué son difíciles de escuchar en francés (sonidos nasales, liaison, encadenamiento, etc.).
    * Qué patrones de pronunciación francesa le están costando trabajo.
    * Un consejo concreto para entrenar el oído en esos sonidos específicos.
    * Si el score es 100, felicita al alumno y destaca qué sonidos del francés domina bien.

JSON:
{{"score": 0, "feedback": "..."}}
"""
    mensajes = [{"role": "user", "content": prompt}]
    mock_fallback = {"score": 85, "feedback": "¡Muy bien! (Evaluación de prueba)"}
    return await _ejecutar_con_reintentos(mensajes, mock_fallback)

async def evaluar_pronunciacion_ia(texto_transcrito: str, respuesta_esperada: str, verbo_infinitivo: str, tense: str) -> dict:
    prompt = f"""
Eres un profesor de francés experto en fonética y pronunciación.
El estudiante intentó conjugar el verbo "{verbo_infinitivo}" en tiempo "{tense}".
La respuesta esperada era: "{respuesta_esperada}"
Lo que el sistema de reconocimiento de voz transcribió fue: "{texto_transcrito}"

Tu tarea es analizar la transcripción del usuario en comparación con la respuesta esperada y proporcionar un feedback detallado sobre la pronunciación.

REGLAS JSON:
- Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin markdown, sin texto extra.
- 'es_correcto_foneticamente': booleano, true si la pronunciación es casi perfecta, false si hay errores notables.
- 'feedback_fonetico': Un feedback pedagógico en español (máximo 50 palabras) que:
    * Identifique los errores de pronunciación específicos (ej: "la 'r' no fue vibrante", "la 'e' final fue muda", "confundiste el sonido 'ou' con 'u'").
    * Explique brevemente por qué es un error común o cómo se produce el sonido correcto.
    * Ofrezca un consejo práctico para mejorar ese sonido o aspecto específico.
    * Si la pronunciación es correcta, felicita y destaca un aspecto positivo.

JSON:
{{
  "es_correcto_foneticamente": true,
  "feedback_fonetico": "..."
}}
"""
    mensajes = [{"role": "system", "content": "Experto en fonética francesa. Salida en JSON estricto."},
                {"role": "user", "content": prompt}]

    mock_fallback = {
        "es_correcto_foneticamente": False,
        "feedback_fonetico": "Tu pronunciación de 'r' fue un poco suave. Intenta vibrar más la punta de la lengua contra el paladar. ¡Sigue practicando!"
    }

    return await _ejecutar_con_reintentos(mensajes, mock_fallback)

async def evaluar_chat_ia(config: dict, historial: list):
    
    mensajes_api = [
        {"role": "system", "content": f"""
Eres un asistente de aprendizaje de francés evaluando un roleplay completo.
El estudiante de nivel {config['nivel']} practicó verbos del grupo {config['grupo_verbos']} en modo {config['mood']} y tiempo {config['tense']}.

Evalúa el historial completo de la conversación y devuelve un JSON estricto con:
- Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin markdown, sin texto extra.
- 'score': Número de 0 a 100 basado en precisión gramatical, conjugación correcta y fluidez escrita.
- 'feedback': Feedback pedagógico en español que incluya:
    * Qué errores gramaticales o de conjugación repitió con más frecuencia y por qué son errores (explica la regla).
    * Qué estructuras usó bien, para reforzar lo positivo.
    * Un consejo concreto enfocado en el modo {config['mood']} y tiempo {config['tense']} que practicó.
    * Si el score es 100, felicita al alumno y destaca su dominio de las estructuras trabajadas.

JSON:
{{"score": 0, "feedback": "..."}}
"""}
    ]
    mensajes_api.extend(historial)
    
    mock_fallback = {"score": 90, "feedback": "Buen trabajo practicando. (Modo prueba)"}
    return await _ejecutar_con_reintentos(mensajes_api, mock_fallback)

async def analizar_error_gramatical(verbo_correcto: str, respuesta_usuario: str, contexto: str = ""):

    try:
        prompt = f"""
Eres un asistente de aprendizaje de francés especializado en gramática.
El usuario está practicando verbos.
Respuesta correcta: "{verbo_correcto}"
Respuesta del usuario: "{respuesta_usuario}"
Contexto de la frase: "{contexto}"

Tu tarea es:
1. Identificar la categoría del error basándote ÚNICAMENTE en esta lista:
   [AUXILIAR, PARTICIPIO, ACCORD, CONJUGACION, ORTOGRAFIA, GRAMATICA].
2. Feedback corto (máximo 20 palabras) en español que explique:
    * Por qué está mal y cuál es la regla que se rompe.
    * La forma correcta de recordarlo (un truco o patrón simple si aplica).

- Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin markdown, sin texto extra.

JSON:
{{
    "categoria": "NOMBRE_DE_LA_CATEGORIA",
    "feedback": "Tu explicación aquí."
}}
"""

        mensajes = [
            {"role": "system", "content": "Eres un experto lingüista que solo responde en formato JSON."},
            {"role": "user", "content": prompt}
        ]
        mock_fallback = {"categoria": "GRAMATICA", "feedback": "Revisa la conjugación."}
        return await _ejecutar_con_reintentos(mensajes, mock_fallback)
    except Exception as e:
        logger.error(f"Error en analizar_error_gramatical: {e}")
        return {
            "categoria": "GRAMATICA",
            "feedback": "Hubo un error al analizar tu respuesta, pero revísala con cuidado."
        }

async def generar_opciones_listening_ia(texto_audio: str, nivel: str) -> dict:
    """
    Toma el texto generado para el audio y le pide a la IA que genere 
    una pregunta de comprensión de opción múltiple en formato JSON.
    """
    prompt = f"""
    Eres un profesor de idiomas nivel {nivel}. 
    Basado en el siguiente texto de un ejercicio de escucha: "{texto_audio}"
    
    Genera UNA pregunta de comprensión auditiva con 3 opciones múltiples.
    
    REGLAS CRÍTICAS:
    1. La opción correcta debe ser ALEATORIA en cada ejercicio (A, B o C).
    2. La "pregunta" y el texto de las "opciones" DEBEN ESTAR ESTRICTAMENTE EN EL MISMO IDIOMA QUE EL TEXTO DEL AUDIO. No las traduzcas.
    3. La "explicacion" DEBE ESTAR EN ESPAÑOL para que el estudiante entienda por qué es la respuesta correcta.
    
    Debes devolver ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta (sin formato markdown, sin texto adicional):
    {{
        "pregunta": "¿Pregunta en el idioma del audio?",
        "opciones": [
            {{"id": "A", "texto": "Primera opción en el idioma del audio"}},
            {{"id": "B", "texto": "Segunda opción en el idioma del audio"}},
            {{"id": "C", "texto": "Tercera opción en el idioma del audio"}}
        ],
        "idOpcionCorrecta": "<LETRA DE LA OPCIÓN CORRECTA (A, B o C)>",
        "explicacion": "Explicación en español de por qué esta es la correcta."
    }}
    """

    mensajes = [
        {"role": "system", "content": "Experto creador de evaluaciones. Salida en JSON estricto."},
        {"role": "user", "content": prompt}
    ]

    mock_fallback = {
        "pregunta": "¿De qué trata principalmente el texto?",
        "opciones": [
            {"id": "A", "texto": "Opción de prueba 1"},
            {"id": "B", "texto": "Opción de prueba correcta"},
            {"id": "C", "texto": "Opción de prueba 3"}
        ],
        "idOpcionCorrecta": "B",
        "explicacion": "Respuesta generada en modo prueba por falta de API Key."
    }

    try:
        resultado_json = await _ejecutar_con_reintentos(mensajes, mock_fallback)
        
        # Le añadimos un ID único al ejercicio generado
        resultado_json["id"] = str(uuid.uuid4())
        
        return resultado_json

    except Exception as e:
        # En caso de que la IA falle o el JSON no se pueda parsear, retornamos un error seguro
        raise Exception(f"Error al generar las opciones con la IA: {str(e)}")