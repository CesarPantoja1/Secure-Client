# SecureClient Manager (SCM)

> Plataforma de Integridad y Gestión Empresarial (SaaS multi-tenant) con enfoque Zero-Trust.

## Tabla de Contenidos
1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Casos de Uso Principales](#casos-de-uso-principales)
3. [Arquitectura y Stack Tecnológico](#arquitectura-y-stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Seguridad y OWASP Top 10](#seguridad-y-owasp-top-10)
6. [Flujos CI/CD (DevSecOps)](#flujos-cicd-devsecops)
7. [Instalación y Despliegue](#instalación-y-despliegue)
8. [Licencia](#licencia)
9. [Equipo del Proyecto](#equipo-del-proyecto)

## Descripción del Proyecto
SecureClient Manager (SCM) es una plataforma SaaS multi-tenant diseñada específicamente para sectores de alta responsabilidad como estudios contables, consultorios médicos y agencias de marketing que manejan información crítica y sensible. 

SCM centraliza la gestión de clientes, tareas y notas internas bajo un modelo de control de acceso basado en roles (RBAC) y un aislamiento estricto de datos por inquilino mediante Row Level Security (RLS). Cada acción queda registrada en un log de auditoría inmutable, garantizando confidencialidad, integridad, disponibilidad y no repudio. 

## Casos de Uso Principales
- **CU-01:** Registro e inicio de sesión seguro (con posibilidad de MFA para Administradores).
- **CU-02:** Alta de un nuevo tenant (empresa cliente) y su primer administrador.
- **CU-03:** Gestión de usuarios y roles dentro de un tenant (Administrador).
- **CU-04:** Gestión de clientes (crear, consultar, actualizar, eliminar) — CRUD acotado por rol y tenant.
- **CU-05:** Gestión de tareas asociadas a clientes.
- **CU-06:** Registro de notas de reunión.
- **CU-07:** Consulta y exportación del log de auditoría (solo Administrador).
- **CU-08:** Visualización de dashboard operativo (métricas, pendientes, actividad reciente).
- **CU-09:** Cierre de sesión / expiración automática por inactividad.
- **CU-10:** Recuperación ante desastre (restauración desde backup / PITR) — operación de infraestructura.

## Arquitectura y Stack Tecnológico
La arquitectura se basa en un Monolito Modular de Backend (API Proxy) con un Frontend Desacoplado, orquestado en contenedores y expuesto mediante Zero-Trust (Cloudflare Tunnels).
- **Frontend:** React servido a través de Nginx como proxy inverso.
- **Backend:** Python + FastAPI.
- **Base de Datos y Autenticación:** Supabase Cloud (PostgreSQL con RLS, Supabase Auth).
- **Despliegue y Redes:** Docker Compose, Red interna de Docker, Cloudflare Tunnels (Zero-Trust).

## Estructura del Proyecto
```text
/scm-proyecto-final
├── /frontend
│   ├── /src
│   ├── Dockerfile
│   └── nginx.conf          # Configuración del reverse proxy
├── /backend
│   ├── /app
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
├── .env                    # Variables críticas (Service Role, JWT Secret)
└── /docs                   # Diagramas C4, modelo STRIDE, etc.
```

## Seguridad y OWASP Top 10
El proyecto cubre rigurosamente aspectos de seguridad integrados desde el diseño:
- **Control de Acceso (A01):** Implementación de RLS (Row Level Security) estricto por `tenant_id` y `rol_id` en PostgreSQL validado a través de JWT.
- **Fallos Criptográficos (A02):** TLS 1.3 obligatorio, hashing vía Supabase Auth, cifrado at-rest.
- **Inyección SQL (A03):** Uso exclusivo de queries parametrizadas (SDK de Supabase).
- **Diseño Inseguro (A04):** Basado en modelos de amenazas (STRIDE) y diseño Zero-Trust.
- **Misconfigurations (A05):** CORS restringido explícitamente, cabeceras de seguridad estrictas (CSP, HSTS).
- **Autenticación (A07):** Expiración de sesión, bloqueo de intentos (Rate limiting con Slowapi).
- **Auditoría y Trazabilidad:** Logs de auditoría implementados como *Append-Only* garantizando la inmutabilidad de los registros.

## Flujos CI/CD (DevSecOps)
El proyecto integrará pipelines automatizados para asegurar la calidad del código y la seguridad continua mediante GitHub Actions:
- **Verificación de Seguridad en Frontend:** Uso de herramientas de validación de vulnerabilidades de dependencias como `bun audit`.
- **Verificación de Seguridad en Backend:** Uso de herramientas para evaluar dependencias de Python como `pip audit`, e integración de análisis estático.

## Instalación y Despliegue
Para desplegar la aplicación localmente:
1. Clonar el repositorio.
2. Configurar las variables de entorno en el archivo `.env` basándose en `.env.example`.
3. Ejecutar Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
La aplicación no expone puertos externos de la API de forma directa, sino a través del túnel seguro (Cloudflare) y el proxy inverso (Nginx).

## Licencia
Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## Equipo del Proyecto
- **Daniel Mera**
- **Nick Valverde**
- **Oscar Tumbaco**
- **Cesar Pantoja**
