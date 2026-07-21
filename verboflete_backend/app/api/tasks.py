from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_usuario_actual
from app.models import Usuario, Grupo, Tarea
from app.schemas.task import TareaCreate, TareaResponse

router = APIRouter()

@router.post("/tareas/grupo/{grupo_id}", response_model=TareaResponse, status_code=status.HTTP_201_CREATED, tags=["Tareas y Calendario"])
def crear_tarea_en_grupo(
    grupo_id: int,
    tarea: TareaCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    """
    Crea una nueva tarea para un grupo específico.
    - **Admins**: Pueden crear tareas en cualquier grupo.
    - **Tutores**: Solo pueden crear tareas en los grupos que gestionan.
    - **Alumnos**: No tienen permiso para crear tareas.
    """
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El grupo especificado no existe.")

    # --- Lógica de Permisos ---
    es_admin = usuario_actual.rol == "admin"
    es_tutor_del_grupo = usuario_actual in grupo.tutores

    if not (es_admin or es_tutor_del_grupo):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear tareas en este grupo."
        )

    nueva_tarea = Tarea(
        **tarea.model_dump(),
        grupo_id=grupo_id
    )

    db.add(nueva_tarea)
    db.commit()
    db.refresh(nueva_tarea)

    return nueva_tarea

@router.get("/calendario/tareas", response_model=List[TareaResponse], tags=["Tareas y Calendario"])
def obtener_tareas_calendario(
    grupo_id: Optional[int] = Query(None, description="Filtro opcional para que el admin vea las tareas de un solo grupo."),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    """
    Obtiene la lista de tareas visibles para el usuario actual.
    - **Alumnos**: Ven las tareas de todos los grupos a los que pertenecen.
    - **Tutores**: Ven las tareas de todos los grupos que gestionan.
    - **Admins**: Ven todas las tareas de todos los grupos. Pueden filtrar por `grupo_id`.
    """
    query = db.query(Tarea)

    if usuario_actual.rol == "admin":
        if grupo_id:
            # Si el admin especifica un grupo, filtramos por él.
            query = query.filter(Tarea.grupo_id == grupo_id)
        # Si no, el admin ve todo (no se aplica filtro adicional).

    elif usuario_actual.rol == "tutor":
        # Obtenemos los IDs de los grupos que el tutor gestiona.
        ids_grupos_tutor = [g.id for g in usuario_actual.grupos_como_tutor]
        if not ids_grupos_tutor:
            return [] # Si no es tutor de ningún grupo, no ve tareas.
        query = query.filter(Tarea.grupo_id.in_(ids_grupos_tutor))

    elif usuario_actual.rol == "estudiante":
        # Obtenemos los IDs de los grupos a los que pertenece el alumno.
        ids_grupos_alumno = [g.id for g in usuario_actual.grupos_como_alumno]
        if not ids_grupos_alumno:
            return [] # Si no está en ningún grupo, no ve tareas.
        query = query.filter(Tarea.grupo_id.in_(ids_grupos_alumno))
        
    else:
        # Por si acaso hay otros roles en el futuro, no devolvemos nada.
        return []

    # Ordenamos las tareas por fecha de entrega más próxima.
    tareas = query.order_by(Tarea.fecha_entrega.asc()).all()
    return tareas