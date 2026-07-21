from pydantic import BaseModel

class ConfiguracionSpeaking(BaseModel):
    nivel: str
    contexto: str
    grupo_verbos: str
    mood: str
    tense: str

class EjercicioSpeakingResponse(BaseModel):
    verbo_infinitivo: str
    persona_tecnica: str
    sujeto: str
    respuesta_esperada: str
    mood: str
<<<<<<< HEAD
    tense: str
=======
    tense: str

    mood: str
    tense: str

# Nuevo esquema para la validación de audio
class ValidarAudioRequest(BaseModel):
    verbo_infinitivo: str
    respuesta_esperada: str
    config: str # JSON string con mood y tense

    class Config:
        from_attributes = True

>>>>>>> 2ca181e (creacion de gruopos)
