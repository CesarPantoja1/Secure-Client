import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter
from app.api.routes import auth
from app.middleware.csrf import CSRFMiddleware

from app.core.config import settings
from app.core.exceptions import (
    SCMException,
    general_exception_handler,
    http_exception_handler,
    request_validation_exception_handler,
    scm_exception_handler,
)

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)
logger = logging.getLogger("scm.backend")


# Definición del ciclo de vida (Lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SCM backend started")
    yield


# Inicialización de FastAPI con lifespan
app = FastAPI(title="SCM Backend", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter

# Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware CSRF
app.add_middleware(CSRFMiddleware)

# Manejadores de Excepciones
app.add_exception_handler(RequestValidationError, request_validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(SCMException, scm_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
