from pydantic import BaseModel
from typing import List

# 1. Lo que React nos va a mandar (Tus 5 parámetros sagrados)
class ConfiguracionReading(BaseModel):
    nivel: str
    contexto: str
    grupo_verbos: str
    mood: str
    tense: str

# 2. Las piezas del Quiz que devuelve la IA
class OpcionQuiz(BaseModel):
    texto: str
    es_correcta: bool

class PreguntaQuiz(BaseModel):
    pregunta: str
    opciones: List[OpcionQuiz]

# 3. La respuesta final que se va a React
class ReadingGenerateResponse(BaseModel):
    texto_frances: str
    preguntas: List[PreguntaQuiz]

class RespuestaUsuario(BaseModel):
    pregunta_idx: int
    opcion_idx: int

class CalificarReadingRequest(BaseModel):
    config: ConfiguracionReading
    respuestas_usuario: List[RespuestaUsuario]
    json_original: str # El JSON completo que generó la IA (para comparar)