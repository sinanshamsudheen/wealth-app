from fastapi import Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            "meta": {"request_id": request.state.request_id if hasattr(request.state, "request_id") else None},
        },
    )


# Convenience factories
def not_found(message: str = "Resource not found") -> AppException:
    return AppException(code="NOT_FOUND", message=message, status_code=404)


def unauthorized(message: str = "Not authenticated") -> AppException:
    return AppException(code="UNAUTHORIZED", message=message, status_code=401)


def forbidden(message: str = "Insufficient permissions") -> AppException:
    return AppException(code="FORBIDDEN", message=message, status_code=403)


def validation_error(message: str, details: dict | None = None) -> AppException:
    return AppException(code="VALIDATION_ERROR", message=message, status_code=422, details=details)


def conflict(message: str) -> AppException:
    return AppException(code="CONFLICT", message=message, status_code=409)
