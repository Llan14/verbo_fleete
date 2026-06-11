from pydantic import BaseModel
from typing import List

class ConfiguracionListening(BaseModel):
    nivel: str
    contexto: str
    grupo_verbos: str
    mood: str
    tense: str

class ListeningGenerateResponse(BaseModel):
    audio_base64: str
    texto_original: str

class ListeningGradeRequest(BaseModel):
    config: ConfiguracionListening
    texto_original: str
    respuesta_usuario: str

class ListeningGradeResponse(BaseModel):
    score: float
    feedback: str
    texto_original: str

# 1. El esquema para cada opción individual
class OpcionItem(BaseModel):
    id: str
    texto: str

# 2. El esquema de respuesta que no encuentra (el del error)
class ListeningOpcionesResponse(BaseModel):
    id: str
    urlAudio: str
    pregunta: str
    opciones: List[OpcionItem]
    idOpcionCorrecta: str
    explicacion: str

# 3. El esquema para cuando el usuario califica su respuesta
class ListeningOpcionesGradeRequest(BaseModel):
    id_opcion_usuario: str
    id_opcion_correcta: str
    explicacion: str
    pregunta: str
    config: ConfiguracionListening # Esta clase ya debería existir en tu archivo