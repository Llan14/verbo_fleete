from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class ConfiguracionVocabulario(BaseModel):
    nivel: str
    contexto: str
    cantidad: int = Field(default=8, ge=3, le=20)


class VocabularioGeneradoItem(BaseModel):
    termino: str
    traduccion: str
    ejemplo: str


class VocabularioGeneradoResponse(BaseModel):
    items: List[VocabularioGeneradoItem]


class GuardarVocabularioRequest(BaseModel):
    termino: str
    traduccion: str
    ejemplo: str = ""
    contexto: str = "general"
    nivel: str = "A1"


class VocabularioItemResponse(BaseModel):
    id: int
    termino: str
    traduccion: str
    ejemplo: str | None
    contexto: str | None
    nivel: str | None
    repeticiones: int
    intervalo_dias: int
    factor_facilidad: float
    aciertos: int
    errores: int
    proximo_repaso: datetime

    class Config:
        from_attributes = True


class RevisarVocabularioRequest(BaseModel):
    item_id: int
    calidad: int = Field(ge=0, le=5)


class RevisarVocabularioResponse(BaseModel):
    item: VocabularioItemResponse
    mensaje: str


class VocabularioStatsResponse(BaseModel):
    total_palabras: int
    pendientes_hoy: int
    tasa_acierto: float
    nivel_top: str
