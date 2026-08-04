# Guia Tecnica Final - VerboFlete

Version: 1.1
Ultima actualizacion: 2026-08-04

## 1. Proposito del documento

Esta guia sirve como base tecnica para:

1. Operacion del sistema en entorno local.
2. Mantenimiento de modulos frontend y backend.
3. Diagnostico rapido de incidencias comunes.
4. Transferencia de conocimiento para manual tecnico y soporte.

## 2. Arquitectura general

### 2.1 Stack

- Frontend: Next.js (App Router), React, Tailwind CSS.
- Backend: FastAPI, SQLAlchemy.
- Base de datos: SQLite (local).
- Autenticacion: JWT Bearer token.

### 2.2 Estructura por carpetas

- Backend: verboflete_backend/app
- Frontend: verboflete_frontend/src
- Documentacion: docs

## 3. Modulos funcionales

### 3.1 Modulos academicos

- Reading
- Listening
- Speaking
- Writing
- Grammar
- Vocabulary con repaso SRS

### 3.2 Modulos de seguimiento

- Dashboard de progreso
- Reporte de errores/debilidades
- Reporte PDF
- Gamificacion (rachas e insignias)

### 3.3 Modulos administrativos

- Gestion de usuarios
- Gestion de grupos
- Asignacion de tutores y alumnos

## 4. Rutas clave del frontend

### 4.1 Privado Alumno

- /alumno/dashboard
- /alumno/tareas
- /alumno/lectura
- /alumno/gramatica
- /alumno/escucha
- /alumno/chatrol
- /alumno/habla
- /alumno/vocabulario
- /alumno/calendario

### 4.2 Administrativo

- /admin/usuarios
- /admin/grupos

## 5. Endpoints backend relevantes

### 5.1 Usuarios

- GET /api/usuarios/me
- GET /api/usuarios
- POST /api/usuarios
- PATCH /api/usuarios/{usuario_id}

### 5.2 Grupos

- GET /api/grupos/
- POST /api/grupos/
- POST /api/grupos/{grupo_id}/tutores
- POST /api/grupos/{grupo_id}/alumnos
- GET /api/grupos/mis-grupos

### 5.3 Sesiones y reportes

- GET /api/sessions/me
- GET /api/sessions/dashboard
- GET /api/sessions/gamification
- GET /api/sessions/report/pdf

### 5.4 Vocabulario

- POST /api/vocabulary/generate
- POST /api/vocabulary/save
- GET /api/vocabulary/my
- GET /api/vocabulary/due
- GET /api/vocabulary/stats
- POST /api/vocabulary/review

## 6. Modelo de datos (resumen)

### 6.1 Entidades principales

- usuarios
- grupos
- grupo_tutor
- grupo_alumno
- sesiones
- detalle_respuestas
- progreso_habilidades
- vocabulario_items

### 6.2 Campos SRS en vocabulario

- repeticiones
- intervalo_dias
- factor_facilidad
- proximo_repaso
- aciertos
- errores

## 7. Logica SRS implementada

Regla base SM-2 simplificada:

1. Si calidad < 3: reinicio de repeticiones e intervalo corto.
2. Si calidad >= 3: incremento de repeticiones.
3. Intervalo recalculado por factor de facilidad.
4. Factor de facilidad minimo: 1.3.
5. proximo_repaso se calcula segun intervalo.

## 8. Gestion de autenticacion y autorizacion

### 8.1 JWT

- El backend emite token con sub, rol, exp.
- El frontend lo almacena en cookies/localStorage para sesiones cliente.

### 8.2 Control por rol

- Normalizacion de rol y home por rol en verboflete_frontend/src/lib/rbac.ts.
- Restricciones de ruta en verboflete_frontend/src/proxy.ts.

## 9. Tema visual (dark/light)

- Inicializador global: verboflete_frontend/src/components/ThemeInitializer.tsx
- Toggle global: verboflete_frontend/src/components/ThemeToggleGlobal.tsx
- Variables visuales: verboflete_frontend/src/app/globals.css

## 10. Procedimiento de arranque local

### 10.1 Backend

1. Abrir terminal en verboflete_backend
2. Instalar dependencias:
  pip install -r requirements.txt
3. Levantar servidor:
  uvicorn app.main:app --reload

### 10.2 Frontend

1. Abrir terminal en verboflete_frontend
2. Instalar dependencias:
  npm install
3. Levantar servidor:
  npm run dev

## 11. Pruebas de humo sugeridas

1. Login con usuario admin.
2. Acceso a /admin/usuarios.
3. Acceso a /admin/grupos y visualizacion de grupos.
4. Login con alumno y apertura de /alumno/dashboard.
5. Descarga de PDF desde dashboard.

## 12. Incidencias recientes y solucion aplicada

### 12.1 Redireccion incorrecta de dashboard alumno

- Sintoma: enlace Dashboard llevaba a tareas.
- Solucion: ajuste de home por rol a /alumno/dashboard y alias de ruta alumno.

### 12.2 Error 401 en admin grupos

- Sintoma: mensaje "Not authenticated" en carga inicial.
- Causa tecnica: perdida de Authorization en flujo con redireccion API.
- Solucion: consumo con API base directa en pantalla admin grupos, manteniendo token Bearer.

## 13. Mantenimiento recomendado

1. Estandarizar un patron unico de consumo API para todo el frontend.
2. Agregar pruebas E2E para rutas por rol.
3. Incorporar observabilidad de errores 401/403.
4. Versionar cambios de base de datos con Alembic en cada incremento.

## 14. Anexos tecnicos para manual

Anexo A (pendiente): Mapa de endpoints por modulo.

Anexo B (pendiente): Matriz de permisos por rol.

Anexo C (pendiente): Diagrama de flujo login -> validacion de rol -> ruta home.
