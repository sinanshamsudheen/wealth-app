import asyncio
import json
import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.tasks.celery_app import celery_app

logger = structlog.get_logger()

# Lazy-initialized engine (one per worker process)
_engine = None
_session_factory = None


def _get_session_factory():
    global _engine, _session_factory
    if _session_factory is None:
        _engine = create_async_engine(settings.DATABASE_URL, pool_size=5)
        _session_factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)
    return _session_factory


@celery_app.task(name="app.tasks.audit.write_audit_log")
def write_audit_log(
    tenant_id: str,
    user_id: str | None,
    action: str,
    resource_type: str,
    resource_id: str | None,
    metadata: dict | None = None,
):
    async def _write():
        session_factory = _get_session_factory()
        async with session_factory() as session:
            await session.execute(
                text(
                    """
                    INSERT INTO admin.audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, metadata, created_at)
                    VALUES (:id, :tenant_id, :user_id, :action, :resource_type, :resource_id, :metadata, :created_at)
                    """
                ),
                {
                    "id": str(uuid.uuid4()),
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "action": action,
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                    "metadata": json.dumps(metadata) if metadata else None,
                    "created_at": datetime.now(timezone.utc),
                },
            )
            await session.commit()

    try:
        asyncio.run(_write())
        logger.info("audit_log_written", action=action, resource_type=resource_type)
    except Exception as exc:
        logger.error("audit_log_failed", action=action, error=str(exc))
        # Don't retry — audit is best-effort
