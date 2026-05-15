from app.core.database import get_db
from app.models import Usuario
from app.core.security import get_password_hash

def crear_admin():
    # Obtenemos la conexión a la base de datos
    db = next(get_db())
    email = "admin@verboflete.com"
    password = "TuContrasenaSegura123"
    
    # Buscamos si el usuario ya existe
    usuario_existente = db.query(Usuario).filter(Usuario.email == email).first()
    
    if usuario_existente:
        print("El usuario ya existe en la base de datos. Actualizando su contraseña por si acaso...")
        usuario_existente.password_hash = get_password_hash(password)
        usuario_existente.rol = "admin"
        db.commit()
        print("¡Contraseña actualizada!")
    else:
        print("Creando el nuevo usuario administrador...")
        nuevo_admin = Usuario(
            nombre="Admin",
            apellidos="VerboFlete",
            email=email,
            password_hash=get_password_hash(password),
            rol="admin"
        )
        db.add(nuevo_admin)
        db.commit()
        print("¡Usuario administrador creado con éxito!")

if __name__ == "__main__":
    crear_admin()
