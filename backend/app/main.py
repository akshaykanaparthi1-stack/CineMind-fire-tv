import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from contextlib import asynccontextmanager
from .config.settings import settings
from .routers import health, preferences, watchlist, recommendations, sessions, assistant

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cinemind.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"CineMind AI backend starting on port {settings.port} [{settings.environment} mode]")
    if settings.supabase_url:
        logger.info(f"Configured Supabase URL: {settings.supabase_url}")
    yield
    logger.info("CineMind AI backend shutting down...")

app = FastAPI(
    title="CineMind AI API",
    description=(
        "AI-powered 10-foot television entertainment discovery, personalized recommendations, "
        "and multi-generational Family Vote consensus engine for Amazon Fire TV."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Configuration for Fire TV Web app & Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers for Consistent JSON Envelope
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": exc.detail,
            "source": "error"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"])
        error_details.append(f"{field}: {err['msg']}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "message": "Validation Error: " + "; ".join(error_details),
            "source": "validation_error"
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "message": f"Internal server error: {str(exc)}",
            "source": "internal_error"
        }
    )

# Include API Routers
app.include_router(health.router)
app.include_router(preferences.router)
app.include_router(watchlist.router)
app.include_router(recommendations.router)
app.include_router(sessions.router)
app.include_router(assistant.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=True)
