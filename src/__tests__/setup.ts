// Test setup file
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Ensure tests use a separate database and consistent JWT secret
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DB_NAME = process.env.DB_NAME || 'tsbackend_test';
process.env.MONGODB_URI = process.env.MONGODB_URI || `mongodb://localhost:27017/${process.env.DB_NAME}`;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';



// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
import mongoose from 'mongoose';

beforeAll(async () => {
    // Optionally mock console output during tests to reduce noise
    if (process.env.MOCK_CONSOLE !== 'false') {
        console.log = jest.fn();
        console.error = jest.fn();
    }

    // Connect to test MongoDB
    const uri = process.env.MONGODB_URI || `mongodb://localhost:27017/${process.env.DB_NAME}`;
    await mongoose.connect(uri, { autoIndex: true });
});

afterAll(async () => {
    // Disconnect mongoose and restore console
    await mongoose.disconnect();
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
});
