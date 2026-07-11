# Guía de Contribución para SecureClient Manager (SCM)

¡Gracias por tu interés en contribuir a SCM! Este documento establece las reglas, flujos de trabajo y convenciones para el desarrollo seguro del proyecto.

## División de Trabajo y Responsabilidades
De acuerdo a la planificación del proyecto, la distribución de áreas es la siguiente:
- **Nick y Daniel:** Arquitectura, Backend (FastAPI), verificación JWT, políticas RLS, rate limiting. Seguridad Ofensiva y QA, modelo de amenazas STRIDE, análisis dinámico (ZAP/Burp). Diagrama C4.
- **Cesar:** Frontend (React), experiencia segura, sanitización de entradas, manejo de tokens/cookies, prototipo/UI final. Análisis estático del frontend (ESLint/Semgrep).
- **Oscarin:** Datos, esquema de BD, triggers de auditoría, exportación a S3, backups/PITR. Análisis estático del backend, consolidación del informe final.

## 📐 Convención de Ramas
- `main`: Código estable en producción.
- `develop`: Rama de integración para el Sprint activo.
- `feature/<id>-descripcion`: Desarrollo de nuevas tareas o historias de usuario.
- `hotfix/<id>-descripcion`: Reparaciones críticas urgentes en producción.

## 📝 Convención de Commits (Formatos aceptados)
**Estructura:** `<tipo>: <descripción corta en minúsculas>`

- `feat`: Nueva funcionalidad para el usuario (endpoints, componentes UI).
- `fix`: Corrección de un error o bug.
- `chore`: Tareas rutinarias, mantenimiento o actualización de dependencias.
- `docs`: Cambios exclusivos en la documentación o Readme.
- `build`: Cambios que afectan el sistema de compilación o herramientas externas (Docker, configuraciones de empaquetado).
- `test`: Añadir o corregir pruebas unitarias/integración (Pytest o Jest).
- `ci`: Modificaciones en los archivos de configuración de integración continua (GitHub Actions).
- `cd`: Modificaciones en los flujos de despliegue continuo.

## 🔄 Flujo de Desarrollo
1. **Antes de iniciar una tarea,** actualizar la rama `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. **Crear una rama de trabajo** a partir de `develop`:
   ```bash
   git checkout -b feature/<id>-descripcion
   ```
   *Ejemplo:* `git checkout -b feature/hu-15-registro-usuario`
3. **Realizar los cambios** y registrar commits siguiendo la convención definida.
4. **Al finalizar la tarea,** publicar la rama y crear un Pull Request hacia `develop`: `feature/<id>-descripcion` → `develop`
5. Una vez aprobado el Pull Request, la rama se integra en `develop`.

## 📦 Integración del Sprint
- La rama `develop` representa el estado consolidado del Sprint actual.
- Debe mantenerse funcional y compilable, aunque puede contener funcionalidades que aún no han sido liberadas a producción.
- Todas las funcionalidades desarrolladas durante el Sprint deben integrarse primero en `develop` mediante Pull Requests.

## 🚀 Preparación de Producción
Cuando las funcionalidades planificadas para una versión estén completas, validadas y aprobadas, se creará un Pull Request desde:
`develop` → `main`
- La rama `main` representa la versión oficial del producto.
- Solo debe contener funcionalidades validadas y aprobadas para producción.

## 🚑 Manejo de Hotfixes
Cuando se requiera corregir un error crítico en producción:
1. Crear una rama desde `main`: `hotfix/<id>-descripcion`
2. Realizar la corrección.
3. Crear un Pull Request hacia `main`: `hotfix/<id>-descripcion` → `main`
4. Replicar la corrección en `develop` mediante un Pull Request adicional o una sincronización posterior: `hotfix/<id>-descripcion` → `develop`

## 📊 Resumen del Flujo
**Desarrollo de funcionalidades:**
```text
main
 ↑
develop
 ↑
feature/<id>-descripcion
```

**Correcciones urgentes en producción:**
```text
main
 ↑
hotfix/<id>-descripcion
```

## 📋 Reglas Generales
- No realizar desarrollos directamente sobre `main`.
- No realizar desarrollos directamente sobre `develop`.
- Toda funcionalidad nueva debe desarrollarse en una rama `feature`.
- Toda corrección crítica en producción debe desarrollarse en una rama `hotfix`.
- Toda integración debe realizarse mediante Pull Request.
- La rama `develop` debe reflejar el avance consolidado del Sprint.
- La rama `main` debe contener únicamente versiones estables listas para producción.
- Los Pull Requests deben ser revisados antes de su integración cuando sea posible.
- Una rama `feature` o `hotfix` puede eliminarse después de haber sido integrada exitosamente.

## 🔒 Flujos CI/CD y DevSecOps
El proyecto adopta un enfoque DevSecOps que incluye escaneos automatizados obligatorios durante el ciclo CI/CD (GitHub Actions, etc.):
- **Seguridad en Backend:** Se integran revisiones de dependencias mediante `pip audit`, junto con herramientas de análisis estático.
- **Seguridad en Frontend:** Se emplea `bun audit` (o el auditor de dependencias configurado en el proyecto JS) para garantizar que las dependencias estén libres de vulnerabilidades conocidas.
