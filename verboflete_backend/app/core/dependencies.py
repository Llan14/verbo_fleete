from collections.abc import Callable

from fastapi import Depends, HTTPException, status

from app.core.security import get_usuario_actual
from app.models.user import Roles, Usuario


def require_roles(*roles_permitidos: str) -> Callable:
    """Valida que el usuario autenticado tenga alguno de los roles permitidos."""

    def role_checker(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
        if usuario.rol == Roles.ADMIN:
            return usuario

        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes los permisos necesarios para realizar esta acción.",
            )

        return usuario

    return role_checker