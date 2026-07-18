from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_usuario_actual
from app.models.user import Usuario, Roles
from app.models.group import Grupo
from app.schemas.group import GrupoCreate, GrupoConMiembros, AsignacionUsuarioRequest, AsignacionResponse

router = APIRouter(prefix="/grupos", tags=["Grupos"])

@router.post("/", response_model=GrupoConMiembros, status_code=status.HTTP_201_CREATED)
def crear_grupo(
    grupo_data: GrupoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    if usuario_actual.rol != Roles.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los administradores pueden crear grupos.")

    grupo_existente = db.query(Grupo).filter(Grupo.nombre == grupo_data.nombre).first()
    if grupo_existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"El grupo '{grupo_data.nombre}' ya existe.")

    nuevo_grupo = Grupo(**grupo_data.model_dump())
    db.add(nuevo_grupo)
    db.commit()
    db.refresh(nuevo_grupo)

    return nuevo_grupo

@router.post("/{grupo_id}/tutores", response_model=AsignacionResponse)
def asignar_tutor_a_grupo(
    grupo_id: int,
    asignacion_data: AsignacionUsuarioRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    if usuario_actual.rol != Roles.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los administradores pueden asignar tutores.")

    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo no encontrado.")

    tutor = db.query(Usuario).filter(Usuario.id == asignacion_data.usuario_id).first()
    if not tutor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario (tutor) no encontrado.")
    
    if tutor.rol != Roles.TUTOR:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario seleccionado no tiene el rol de 'tutor'.")

    if tutor in grupo.tutores:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este tutor ya está asignado a este grupo.")

    grupo.tutores.append(tutor)
    db.commit()
    db.refresh(grupo)

    return {"mensaje": f"Tutor '{tutor.nombre}' asignado al grupo '{grupo.nombre}' con éxito.", "grupo": grupo}

@router.post("/{grupo_id}/alumnos", response_model=AsignacionResponse)
def asignar_alumno_a_grupo(
    grupo_id: int,
    asignacion_data: AsignacionUsuarioRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    if usuario_actual.rol != Roles.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los administradores pueden asignar alumnos.")

    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo no encontrado.")

    alumno = db.query(Usuario).filter(Usuario.id == asignacion_data.usuario_id).first()
    if not alumno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario (alumno) no encontrado.")
    
    if alumno.rol != Roles.ESTUDIANTE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario seleccionado no tiene el rol de 'estudiante'.")

    if alumno in grupo.alumnos:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este alumno ya está en este grupo.")

    grupo.alumnos.append(alumno)
    db.commit()
    db.refresh(grupo)

    return {"mensaje": f"Alumno '{alumno.nombre}' asignado al grupo '{grupo.nombre}' con éxito.", "grupo": grupo}

@router.get("/", response_model=List[GrupoConMiembros])
def obtener_grupos(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_usuario_actual)):
    if usuario_actual.rol != Roles.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado.")
    
    grupos = db.query(Grupo).all()
    return grupos