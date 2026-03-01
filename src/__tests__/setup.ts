// Test setup file
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { disconnectRedis } from '../utils/cache';

// Load environment variables from .env
dotenv.config();

// Ensure tests use a separate database and consistent JWT secret
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    // Optionally mock console output during tests to reduce noise
    if (process.env.MOCK_CONSOLE !== 'false') {
        console.log = jest.fn();
        console.error = jest.fn();
    }

    // Start MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;

    try {
        await mongoose.connect(uri, { autoIndex: true });
    } catch (error) {
        console.error('\n❌ Failed to connect to MongoMemoryServer at', uri);
        throw error;
    }
});

afterAll(async () => {
    // Disconnect mongoose, stop mongoServer and restore console
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
    // Disconnect Redis
    await disconnectRedis();
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
});
