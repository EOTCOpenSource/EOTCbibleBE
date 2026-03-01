# TypeScript Backend Project

 A Node.js backend project built with TypeScript, Express, and MongoDB.

## Features

- TypeScript support
- Express.js web framework
- MongoDB with Mongoose ODM
- JWT authentication
- Google OAuth 2.0 integration
- Password hashing with bcrypt
- Testing with Jest and Supertest
- Development with hot reload using nodemon

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tsbackend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Edit the `.env` file with your configuration values.

## Development

Start the development server with hot reload:
```bash
npm run dev
```

## Building

Build the project for production:
```bash
npm run build
```

## Running

Start the production server:
```bash
npm start
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
src/
├── controllers/     # Route controllers
├── models/         # Mongoose models
├── routes/         # Express routes
├── middleware/     # Custom middleware
├── config/         # Configuration files
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Environment Variables

Configure the following variables in your `.env` file:

- `PORT` - Server port (default: 3000)

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration time
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL
- `SESSION_SECRET` - Session secret key

## License

ISC

## CI/CD Deployment

The repository includes a deployment workflow at `.github/workflows/deploy.yml` with:

- CI (lint, test, build)
- Docker image publish to GHCR
- Deployment jobs currently disabled until hosting platform is selected (AWS/GCP/Railway)

### Required files on deployment hosts

On each target server (`staging` and `production`), keep this project checked out at your app directory with:

- `docker-compose.yml`
- `docker-compose.prod.yml`
- `.env`

The deploy job runs:

```bash
IMAGE_TAG=<tag> docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --pull always api
```

### Required GitHub Environment Secrets

Create environments named `staging` and `production` in GitHub, then set:

- Shared:
  - `GHCR_USERNAME`
  - `GHCR_TOKEN` (PAT with `read:packages`)
- Staging:
  - `STAGING_SSH_HOST`
  - `STAGING_SSH_PORT` (optional, defaults to `22`)
  - `STAGING_SSH_USER`
  - `STAGING_SSH_KEY`
  - `STAGING_APP_DIR` (absolute path to repo on server)
- Production:
  - `PROD_SSH_HOST`
  - `PROD_SSH_PORT` (optional, defaults to `22`)
  - `PROD_SSH_USER`
  - `PROD_SSH_KEY`
  - `PROD_APP_DIR` (absolute path to repo on server)

### Trigger behavior

- Push to `main`: runs CI and publishes Docker image to GHCR
- Manual run (`workflow_dispatch`): can trigger image build/publish flow
- Deployment steps remain commented until platform decision is finalized

## Operations Docs

- `ENVIRONMENT.md` - environment variable contract
- `RELEASE.md` - release and rollback process
- `RUNBOOK.md` - incident response and health checks
- `SECURITY.md` - secrets and operational security policy
- `HOSTING_DECISION.md` - platform selection matrix

## Monitoring and Alerting

- Scheduled synthetic health checks are configured in:
  - `.github/workflows/healthcheck-monitor.yml`
- The workflow checks your `HEALTHCHECK_URL` every 15 minutes.
- If configured, it sends a webhook alert on failure.

Required repository/environment secrets:

- `HEALTHCHECK_URL` (example: `https://your-api-domain/api/v1/health`)
- `ALERT_WEBHOOK_URL` (optional: Slack/Teams/Discord webhook)
