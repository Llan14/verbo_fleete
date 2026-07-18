from pydantic import BaseModel
from typing import List, Optional
from .user import UsuarioResponse # Reutilizamos el schema de usuario

# --- Esquemas para Grupos ---

class GrupoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class GrupoCreate(GrupoBase):
    pass

class Grupo(GrupoBase):
    id: int

    class Config:
        orm_mode = True

class GrupoConMiembros(Grupo):
    alumnos: List[UsuarioResponse] = []
    tutores: List[UsuarioResponse] = []


# --- Esquemas para Asignaciones ---

class AsignacionUsuarioRequest(BaseModel):
    usuario_id: int

class AsignacionResponse(BaseModel):
    mensaje: str
    grupo: GrupoConMiembros