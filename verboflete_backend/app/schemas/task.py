from pydantic import BaseModel
from datetime import datetime

class TareaBase(BaseModel):
    """Esquema base con los campos comunes de una tarea."""
    titulo: str
    descripcion: str | None = None
    fecha_entrega: datetime

class TareaCreate(TareaBase):
    """Esquema para la creación de una tarea. No necesita más campos."""
    pass

class TareaResponse(TareaBase):
    """
    Esquema para devolver una tarea en la respuesta de la API.
    Incluye el ID y el ID del grupo al que pertenece.
    """
    id: int
    grupo_id: int

    class Config:
        from_attributes = True # Reemplaza a orm_mode