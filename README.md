# Bible Backend API

A RESTful API for Bible study applications with user authentication.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start server**
   ```bash
   npm start
   ```

## API Endpoints

- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user  
- `GET /api/v1/auth/me` - Get user profile (requires token)
- `GET /api/v1/health` - Health check

## Environment Variables

Copy `env.example` to `.env` and configure:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - Token expiration (default: 24h)
- `PORT` - Server port (default: 3000)

## Testing

```bash
npm test
```
