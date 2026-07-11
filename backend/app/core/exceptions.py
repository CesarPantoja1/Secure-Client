import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette import status
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("scm.backend")


class SCMException(Exception):
    """Base exception for SCM API errors."""

    def __init__(self, message: str, status_code: int = 500, code: str = "internal_error") -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class AuthenticationError(SCMException):
    def __init__(self, message: str = "Authentication failed", code: str = "authentication_error") -> None:
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED, code=code)


class ForbiddenError(SCMException):
    def __init__(self, message: str = "Forbidden", code: str = "forbidden") -> None:
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN, code=code)


class NotFoundError(SCMException):
    def __init__(self, message: str = "Resource not found", code: str = "not_found") -> None:
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, code=code)


class ConflictError(SCMException):
    def __init__(self, message: str = "Conflict", code: str = "conflict") -> None:
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT, code=code)


def _build_error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


async def scm_exception_handler(request: Request, exc: SCMException) -> JSONResponse:
    logger.warning("SCM exception: %s", exc.message)
    return _build_error_response(exc.status_code, exc.code, exc.message)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    logger.warning("HTTP exception: %s", exc.detail)
    return _build_error_response(exc.status_code, "http_error", str(exc.detail))


async def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.warning("Validation error: %s", exc.errors())
    return _build_error_response(
        status.HTTP_422_UNPROCESSABLE_ENTITY,
        "validation_error",
        "Request validation failed",
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception", exc_info=exc)
    return _build_error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "internal_error",
        "Internal server error",
    )
