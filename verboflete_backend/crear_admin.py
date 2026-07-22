import os
from dotenv import load_dotenv
load_dotenv()  # Carga las variables de entorno del archivo .env

from app.core.database import get_db
from app.models import Usuario
from app.core.security import get_password_hash
from app.core.config import settings


def crear_admin():
    db_session_generator = get_db()
    db = next(db_session_generator)
    try:
        # Leemos las credenciales desde la configuración centralizada (que a su vez lee de .env)
        email = settings.ADMIN_INIT_EMAIL
        password = settings.ADMIN_INIT_PASSWORD
        nombre = settings.ADMIN_NAME
        apellidos = settings.ADMIN_LASTNAME

        # Buscamos si el usuario ya existe
        usuario_existente = db.query(Usuario).filter(Usuario.email == email).first()

        if usuario_existente:
            print(f"El usuario '{email}' ya existe. Actualizando su contraseña y rol por si acaso...")
            usuario_existente.password_hash = get_password_hash(password)
            usuario_existente.rol = "admin"
            db.commit()
            print(f"¡Contraseña del usuario '{email}' actualizada con éxito!")
        else:
            print("Creando el nuevo usuario administrador...")
            nuevo_admin = Usuario(
                nombre=nombre,
                apellidos=apellidos,
                email=email,
                password_hash=get_password_hash(password),
                rol="admin",
                is_active=True
            )
            db.add(nuevo_admin)
            db.commit()
            print(f"¡Usuario administrador '{email}' creado con éxito!")
    finally:
        db.close()

if __name__ == "__main__":
    crear_admin()
