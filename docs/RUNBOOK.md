# Operations Runbook

## Core health checks

1. API health:
   - `GET /api/v1/health`
2. Container status:
   - `docker compose ps`
3. Recent logs:
   - `docker compose logs --tail=200 api`
4. Mongo availability:
   - verify `MONGODB_URI` connectivity
5. Redis availability:
   - verify `REDIS_URL` connectivity
6. Sentry:
   - verify new errors and spike trends

## Common incidents

## API unavailable

1. Check API container restart loop.
2. Check required env vars.
3. Check Mongo/Redis reachability.
4. Roll back to previous image tag if deployment introduced failure.

## High error rate

1. Check Sentry event groups and latest deploy timestamp.
2. Check recent logs for failing routes.
3. Disable recent feature flag or roll back image tag.

## Slow responses

1. Check DB latency and connection pool pressure.
2. Check Redis connectivity (cache misses).
3. Check host CPU/memory saturation.

## Post-incident

1. Record timeline, impact, root cause, fix.
2. Add preventive action item.
3. Update this runbook if steps were missing.
