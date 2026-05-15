from pydantic import BaseModel
from typing import List

# ¡Tus 5 parámetros sagrados!
class ConfiguracionGramatica(BaseModel):
    nivel: str
    contexto: str
    grupo_verbos: str
    mood: str
    tense: str

class OpcionHueco(BaseModel):
    texto: str
    es_correcta: bool

class Hueco(BaseModel):
    id_hueco: str
    explicacion: str
    opciones: List[OpcionHueco]

class GramaticaGenerateResponse(BaseModel):
    texto_con_huecos: str
    huecos: List[Hueco]

class RespuestaHueco(BaseModel):
    id_hueco: str      # Ej: "[BLANK_1]"
    opcion_idx: int    # El índice de la opción que seleccionó (0, 1, 2)

class CalificarGramaticaRequest(BaseModel):
    config: ConfiguracionGramatica
    respuestas_usuario: List[RespuestaHueco]
    json_original: str