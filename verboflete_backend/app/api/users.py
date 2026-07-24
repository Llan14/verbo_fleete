from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.security import get_password_hash, verify_password, get_usuario_actual
from app.models.habilities import ProgresoHabilidad
from app.models.session import Sesion
from app.schemas.user import (
    AlumnoVinculadoResponse,
    AsignarHijoRequest,
    HijoProgresoResponse,
    UsuarioCreate,
    UsuarioResetPasswordAdmin,
    UsuarioResponse,
    UsuarioUpdateAdmin,
    UsuarioUpdatePassword,
)
from app.core.dependencies import require_roles
from app.core.database import get_db
from app.models import Usuario
from app.models.user import Roles

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


def _normalizar_rol(rol: str | None) -> str:
    value = (rol or Roles.ESTUDIANTE).strip().lower()
    if value == "parent":
        return Roles.PADRES
    return value


def _validar_rol_permitido(rol: str) -> None:
    permitidos = {Roles.ADMIN, Roles.TUTOR, Roles.ESTUDIANTE, Roles.PADRES}
    if rol not in permitidos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol no válido. Usa uno de: {', '.join(sorted(permitidos))}.",
        )


def _es_rol_padre(rol: str | None) -> bool:
    return (rol or "").strip().lower() in {Roles.PADRES, "parent"}

@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_usuario_actual)):
    
    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="¡Solo los administradores pueden crear usuarios nuevos."
        )
    
    usuario_existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Este correo ya está registrado en el sistema"
        )

    rol_normalizado = _normalizar_rol(usuario.rol)
    _validar_rol_permitido(rol_normalizado)

    hashed_password = get_password_hash(usuario.password)

    nuevo_usuario = Usuario(
        nombre=usuario.nombre,
        apellidos=usuario.apellidos,
        email=usuario.email,
        password_hash=hashed_password,
        rol=rol_normalizado
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario

@router.get("/", response_model=List[UsuarioResponse])
def obtener_usuarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_usuario_actual)):
    
    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="¡Acceso denegado! Solo los administradores pueden ver esta lista."
        )

    usuarios = db.query(Usuario).filter(Usuario.rol != Roles.ADMIN).offset(skip).limit(limit).all()

    return usuarios

@router.delete("/{usuario_id}", status_code=status.HTTP_200_OK)
def suspender_usuario(usuario_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_usuario_actual)):
    
    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="¡Acceso denegado! No tienes permisos para suspender cuentas."
        )
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
        
    usuario.is_active = False
    
    db.commit()
    
    return {"message": f"El usuario {usuario.nombre} ha sido suspendido exitosamente"}

@router.get("/me", response_model=UsuarioResponse)
def obtener_mi_perfil(usuario_actual: Usuario = Depends(get_usuario_actual)):
    return usuario_actual

@router.patch("/{usuario_id}/reactivar", status_code=status.HTTP_200_OK)
def reactivar_usuario(usuario_id: int, db: Session = Depends(get_db), usuario_actual: Usuario = Depends(get_usuario_actual)):
    
    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="¡Acceso denegado! No tienes permisos para reactivar cuentas."
        )
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
        
    if usuario.is_active:
        return {"message": f"El usuario {usuario.nombre} ya estaba activo"}
        
    usuario.is_active = True
    
    db.commit()
    
    return {"message": f"¡El usuario {usuario.nombre} ha sido reactivado con éxito!"}

@router.patch("/{usuario_id}/password", status_code=status.HTTP_200_OK)
def actualizar_password(
    usuario_id: int, 
    datos: UsuarioUpdatePassword, 
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    if usuario_actual.id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado para cambiar la contraseña de otro usuario"
        )

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    if not verify_password(datos.password_actual, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )

    nueva_password_hasheada = get_password_hash(datos.password_nueva)
    usuario.password_hash = nueva_password_hasheada
    
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}

@router.get("/stats")
def obtener_estadisticas_gramaticales(
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_usuario_actual)
):
    stats = db.query(ProgresoHabilidad).filter(
        ProgresoHabilidad.usuario_id == usuario_actual.id
    ).all()

    return {
        "usuario": usuario_actual.email,
        "habilidades": {s.categoria: s.puntaje for s in stats}
    }

@router.patch("/{usuario_id}", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
def actualizar_usuario_como_admin(
    usuario_id: int, 
    datos_actualizados: UsuarioUpdateAdmin, 
    db: Session = Depends(get_db), 
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="¡Acceso denegado! Solo los administradores pueden editar perfiles de otros usuarios."
        )

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado en la base de datos."
        )

    if datos_actualizados.email and datos_actualizados.email != usuario.email:
        email_ocupado = db.query(Usuario).filter(Usuario.email == datos_actualizados.email).first()
        if email_ocupado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ese correo electrónico ya está siendo usado por otro usuario."
            )

    datos_dict = datos_actualizados.model_dump(exclude_unset=True)

    if "rol" in datos_dict:
        rol_normalizado = _normalizar_rol(datos_dict["rol"])
        _validar_rol_permitido(rol_normalizado)
        datos_dict["rol"] = rol_normalizado
    
    for key, value in datos_dict.items():
        setattr(usuario, key, value)

    db.commit()
    db.refresh(usuario)

    return usuario


@router.post("/padres/{padre_id}/hijos", response_model=List[AlumnoVinculadoResponse], status_code=status.HTTP_200_OK)
def asignar_hijo_a_padre(
    padre_id: int,
    payload: AsignarHijoRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    if usuario_actual.rol != Roles.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden vincular padres con alumnos.",
        )

    padre = db.query(Usuario).filter(Usuario.id == padre_id).first()
    if not padre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario padre no encontrado.")
    if not _es_rol_padre(padre.rol):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario no tiene rol 'padres'.")

    alumno = db.query(Usuario).filter(Usuario.id == payload.alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alumno no encontrado.")
    if alumno.rol != Roles.ESTUDIANTE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo puedes vincular usuarios con rol 'estudiante'.")

    if alumno not in padre.hijos_asociados:
        padre.hijos_asociados.append(alumno)
        db.commit()
        db.refresh(padre)

    return padre.hijos_asociados


@router.get("/padres/{padre_id}/hijos", response_model=List[AlumnoVinculadoResponse])
def listar_hijos_de_padre(
    padre_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual),
):
    if usuario_actual.rol != Roles.ADMIN and usuario_actual.id != padre_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado.")

    padre = db.query(Usuario).filter(Usuario.id == padre_id).first()
    if not padre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario padre no encontrado.")
    if not _es_rol_padre(padre.rol):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario no tiene rol 'padres'.")

    return padre.hijos_asociados


@router.get("/me/hijos", response_model=List[AlumnoVinculadoResponse])
def listar_mis_hijos(
    usuario_actual: Usuario = Depends(require_roles(Roles.PADRES)),
):
    return usuario_actual.hijos_asociados


@router.get("/me/hijos/progreso", response_model=List[HijoProgresoResponse])
def listar_progreso_de_mis_hijos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles(Roles.PADRES)),
):
    resultado: list[HijoProgresoResponse] = []
    for hijo in usuario_actual.hijos_asociados:
        habilidades = (
            db.query(ProgresoHabilidad)
            .filter(ProgresoHabilidad.usuario_id == hijo.id)
            .all()
        )

        promedio = 0
        if habilidades:
            promedio = int(round(sum(item.puntaje for item in habilidades) / len(habilidades)))

        # Se acota por seguridad visual del frontend.
        promedio = max(0, min(100, promedio))

        ultima_sesion: Sesion | None = (
            db.query(Sesion)
            .filter(Sesion.usuario_id == hijo.id)
            .order_by(Sesion.fecha.desc())
            .first()
        )

        ultima_actividad: datetime | None = ultima_sesion.fecha if ultima_sesion else None

        resultado.append(
            HijoProgresoResponse(
                id=hijo.id,
                nombre=hijo.nombre,
                apellidos=hijo.apellidos,
                email=hijo.email,
                progreso=promedio,
                ultima_actividad=ultima_actividad,
            )
        )

    return resultado

@router.delete("/{usuario_id}/hard-delete", status_code=status.HTTP_200_OK)
def eliminar_usuario_definitivamente(
    usuario_id: int, 
    db: Session = Depends(get_db), 
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden eliminar registros permanentemente."
        )
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.delete(usuario)
    db.commit()
    
    return {"message": f"El usuario {usuario.email} ha sido eliminado permanentemente de la base de datos."}


# 2. RESET DE PASSWORD POR EL ADMIN (SIN CONTRASEÑA ACTUAL)
@router.patch("/{usuario_id}/reset-password-admin", status_code=status.HTTP_200_OK)
def resetear_password_admin(
    usuario_id: int, 
    datos: UsuarioResetPasswordAdmin,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_usuario_actual)
):
    # Verificamos que quien lo hace sea Admin
    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Función exclusiva para administradores."
        )

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Hasheamos la contraseña temporal/nueva
    nueva_password_hasheada = get_password_hash(datos.nueva_password)
    usuario.password_hash = nueva_password_hasheada
    
    db.commit()
    
    return {"message": f"Contraseña del usuario {usuario.email} reseteada exitosamente por el administrador."}