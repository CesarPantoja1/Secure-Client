from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in {"/api/login", "/api/health"}:
            return await call_next(request)

        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            csrf_header = request.headers.get("X-CSRF-Token")
            csrf_cookie = request.cookies.get("scm_csrf_token")
            if csrf_header is None or csrf_cookie is None or csrf_header != csrf_cookie:
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "CSRF_INVALID",
                            "message": "Invalid CSRF token",
                        }
                    },
                )
        return await call_next(request)
