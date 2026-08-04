# Presentacion y Reporte de Estadias - VerboFlete

Version: 1.1
Ultima actualizacion: 2026-08-04

Este documento funciona como guion de exposicion y como base de reporte escrito.

## 1. Datos de portada

- Proyecto: VerboFlete
- Tema: Plataforma de aprendizaje de frances asistida por IA
- Alumno(a): [Completar]
- Carrera: [Completar]
- Empresa/Institucion: [Completar]
- Asesor academico: [Completar]
- Asesor empresarial: [Completar]
- Periodo de estadias: [Completar]

## 2. Contexto del problema

Situacion detectada:

- Baja continuidad de practica en estudiantes.
- Retroalimentacion tardia en ejercicios.
- Dificultad para medir progreso real por habilidad.
- Poca personalizacion en actividades.

## 3. Objetivo general

Desarrollar una plataforma web para practica de frances asistida por IA, con seguimiento de desempeno, gestion de tareas y componentes de motivacion para mejorar continuidad de aprendizaje.

## 4. Objetivos especificos

1. Implementar modulos de practica por habilidad.
2. Mostrar progreso por metricas en dashboard.
3. Incorporar reportes descargables para seguimiento.
4. Integrar vocabulario con repaso adaptativo SRS.
5. Habilitar gestion administrativa de usuarios y grupos.

## 5. Alcance del proyecto

Incluye:

- App web con autenticacion y control por rol.
- Modulos academicos principales.
- Dashboard de progreso con graficas.
- Gestion de grupos y asignaciones.
- Reporte PDF y gamificacion.

No incluye (en esta fase):

- Aplicacion movil nativa.
- Integracion LMS institucional.
- Despliegue productivo multi-tenant.

## 6. Metodologia de trabajo

- Enfoque incremental por sprints.
- Validaciones funcionales por modulo.
- Priorizacion por valor academico y estabilidad.
- Correccion de incidencias en cierre.

## 7. Roadmap ejecutado (resumen)

1. Sprint 1: Listening y experiencia de audio.
2. Sprint 2: Speaking contextual con feedback.
3. Sprint 3: Dashboard con visualizacion.
4. Sprint 4: Vocabulario FE/BE.
5. Sprint 5: Reporte PDF.
6. Sprint 6: Writing/Grammar + base SRS.
7. Sprint 7: Gamificacion.
8. Sprint 8: Tema global y UX.
9. Sprint 9: Estabilizacion y documentacion.

## 8. Arquitectura de la solucion

- Frontend: Next.js + Tailwind
- Backend: FastAPI + SQLAlchemy
- DB local: SQLite
- Seguridad: JWT

## 9. Demostracion sugerida (8 a 10 minutos)

1. Login con rol admin y vista de gestion.
2. Login con rol alumno y acceso a dashboard.
3. Mostrar progreso, errores y recomendaciones.
4. Descargar PDF de reporte.
5. Abrir modulo vocabulario y repaso SRS.
6. Mostrar dark/light mode.
7. Entrar a admin grupos y listar grupos existentes.

## 10. Resultados obtenidos

### 10.1 Tecnicos

- Plataforma funcional por roles.
- Persistencia de vocabulario y sesiones.
- Dashboard con analitica visual.
- Flujo de asignacion en grupos activo.

### 10.2 Funcionales

- Alumno practica y consulta avance.
- Admin administra usuarios y grupos.
- Tutor revisa grupos y asignaciones.
- Padre consulta progreso de hijos (modulo disponible).

## 11. Incidencias relevantes y solucion

1. Dashboard de alumno redirigia a tareas.
	Solucion: ajuste de ruta home por rol a /alumno/dashboard.

2. Admin grupos mostraba "Not authenticated".
	Solucion: ajuste de consumo API en pantalla de grupos, preservando Authorization.

## 12. Indicadores para reporte de impacto

- Porcentaje de tareas completadas.
- Promedio de puntaje por modulo.
- Retencion semanal de uso.
- Dias de racha por alumno.
- Evolucion de errores frecuentes.

## 13. Dificultades encontradas

1. Consistencia de rutas por rol entre vistas antiguas y nuevas.
2. Diferencias en patrones de consumo API frontend.
3. Cobertura de pruebas aun en crecimiento.

## 14. Competencias desarrolladas en estadias

- Diseno de APIs REST con FastAPI.
- Desarrollo frontend con Next.js y estado cliente.
- Integracion de autenticacion JWT.
- Debug de incidencias reales de navegacion y auth.
- Documentacion tecnica y funcional.

## 15. Conclusiones

El proyecto cumple con el objetivo de ofrecer una base solida para aprendizaje asistido por IA, con medicion de progreso y administracion academica. Se finaliza una version lista para piloto ampliado y para evolucionar a una etapa de robustecimiento (pruebas, observabilidad y despliegue formal).

## 16. Trabajo futuro

1. Estandarizar consumo API en todos los modulos.
2. Incrementar cobertura automatizada (unitarias e2e).
3. Mejorar diseno institucional de reportes PDF.
4. Agregar analitica historica de gamificacion.
5. Preparar despliegue continuo y monitoreo.

## 17. Anexos sugeridos para entrega final

Anexo A: Capturas de pantallas por modulo.

Anexo B: Tabla de endpoints principales.

Anexo C: Evidencia de pruebas funcionales.

Anexo D: Cronograma de actividades ejecutadas.
