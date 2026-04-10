---
description: Reset Docker infrastructure and re-apply database migrations
---

You are executing the **reset database** workflow. This tears down Docker services (optionally removing volumes), brings them back up, and re-applies Alembic migrations so the database is always in a clean, ready state.

## Steps

### 1. Check Docker is Running

Run `docker compose ps` to verify Docker is accessible. If it fails, tell the user to start Docker Desktop first.

### 2. Ask About Volume Reset

Ask the user: **"Do you want to remove data volumes too? This will delete all Postgres data and start fresh."**

- If **yes** (or the user already said "fresh" / "clean" / "reset" in their message): proceed with `docker compose down -v`
- If **no**: proceed with `docker compose down`

### 3. Tear Down Infrastructure

```bash
docker compose down -v   # (or without -v based on user choice)
```

### 4. Bring Up Infrastructure

```bash
docker compose up -d
```

### 5. Wait for Health Checks

Wait for both services to be healthy:

```bash
# Poll until Postgres is ready (max 30 seconds)
for i in {1..30}; do
  docker compose exec postgres pg_isready -U dev -d invictus_agents 2>/dev/null && break
  sleep 1
done
```

```bash
# Poll until Redis is ready
for i in {1..10}; do
  docker compose exec redis redis-cli ping 2>/dev/null | grep -q PONG && break
  sleep 1
done
```

If either service fails to become healthy after the timeout, show the logs (`docker compose logs postgres` or `docker compose logs redis`) and stop.

### 6. Apply Migrations

```bash
alembic upgrade head
```

If this fails, show the error and suggest:
- Check that `DATABASE_URL` in `.env` matches the Docker Compose config
- Try `docker compose logs postgres` for more details

### 7. Verify

Run a quick connectivity check:

```bash
psql "postgresql://dev:dev@localhost:5433/invictus_agents" -c "\dt"
```

Confirm that `agent_runs` and `audit_log` tables exist.

### 8. Print Summary

Print:
- Docker services status (`docker compose ps`)
- Tables created
- Reminder: "You can now start the API server with `uvicorn api.main:app --reload`"
