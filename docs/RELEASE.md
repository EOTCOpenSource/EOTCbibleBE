# Release Process

## Branching and tags

1. Merge PR into `main`.
2. CI must pass (`lint`, `audit`, `test`, `build`, compose validation).
3. Tag release from `main`:
   - `git tag vX.Y.Z`
   - `git push origin vX.Y.Z`

## Image publishing

- GitHub Actions publishes:
  - `ghcr.io/eyob13-coder/eotcbiblebe:latest`
  - `ghcr.io/eyob13-coder/eotcbiblebe:<commit-sha>`

## Pre-release checklist

1. Confirm `.env.example` updated for any new config.
2. Confirm backward compatibility notes in PR.
3. Confirm `/api/v1/health` responds correctly in test/staging.
4. Confirm DB changes and rollback instructions are documented.

## Rollback

1. Identify previous known-good image tag (commit SHA).
2. Redeploy previous image:
   - `IMAGE_TAG=<previous-sha> docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --pull always api`
3. Verify `/api/v1/health`.
4. Record incident and root cause in runbook notes.
