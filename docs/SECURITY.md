# Security Operations

## Secrets policy

1. Store runtime secrets in platform secret manager or GitHub Environments.
2. Never commit secrets to repo.
3. Rotate high-impact secrets at least every 90 days:
   - `JWT_SECRET`
   - `EMAIL_APP_PASSWORD`
   - `CLOUDINARY_API_SECRET`
   - social auth secrets
4. Rotate immediately on suspected leak.

## Access control

1. Use least privilege for CI tokens and deploy credentials.
2. Protect production environment with required reviewers.
3. Restrict who can trigger production workflows.

## Dependency risk

1. Keep `npm audit` active in CI.
2. Triage moderate+ findings in each sprint.
3. Pin and update transitive dependencies regularly.

## Incident response

1. Revoke exposed secret.
2. Redeploy with rotated credentials.
3. Review logs and access history.
4. Document impact and preventive actions in `RUNBOOK.md`.
