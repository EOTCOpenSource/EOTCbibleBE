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
