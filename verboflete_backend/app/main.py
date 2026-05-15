from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. Importaciones de configuración y base de datos
from app.core.config import settings
from app.core.database import engine, Base

# 2. Importaciones de los routers (Tus endpoints)
from app.api import (
    auth, 
    users, 
    sessions, 
    speaking, 
    writing, 
    listening, 
    grammar, 
    reading
)

# 3. Inicialización de la aplicación
app = FastAPI(title=settings.PROJECT_NAME)

# 4. Evento de inicio: Creación de tablas en la base de datos
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

# 5. Configuración de CORS (Leyendo dinámicamente desde tu .env)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS, # <-- ¡Esta es la clave del éxito!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 6. Agrupación y registro de rutas
routers = [
    auth.router,     # Pongo auth y users al principio por convención
    users.router,
    sessions.router,
    speaking.router,
    writing.router,
    listening.router,
    grammar.router,
    reading.router,
]

# Inyectamos todas las rutas con el prefijo unificado "/api"
for router in routers:
    app.include_router(router, prefix="/api")

# 7. Ruta raíz (Verificación de salud del servidor)
@app.get("/")
def home():
    return {"mensaje": f"Bienvenido a {settings.PROJECT_NAME} API. El servidor está funcionando correctamente."}