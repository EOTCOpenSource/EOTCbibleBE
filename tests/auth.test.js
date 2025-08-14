const request = require('supertest');
const mongoose = require('mongoose');

// Import the app (we'll need to modify server.js to export the app)
let app;

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '24h';
process.env.MONGODB_URI = 'mongodb://localhost:27017/biblebackend_test';

beforeAll(async () => {
  try {
    // Connect to test database with timeout
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    // Import app after setting up environment
    app = require('../server');
  } catch (error) {
    console.log('⚠️  Skipping database tests - no MongoDB instance available');
    console.log('   Tests will run but may fail if database is required');
    // Import app even if database connection fails
    app = require('../server');
  }
}, 30000);

afterAll(async () => {
  // Clean up
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
});

beforeEach(async () => {
  // Clear all collections before each test if connected
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});

describe('POST /api/v1/auth/register', () => {
  const validUserData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123'
  };

  describe('Successful Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      // Check response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');

      // Check user data
      const user = response.body.data.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('firstName', 'John');
      expect(user).toHaveProperty('lastName', 'Doe');
      expect(user).toHaveProperty('email', 'john.doe@example.com');
      expect(user).toHaveProperty('fullName', 'John Doe');
      expect(user).toHaveProperty('role', 'user');
      expect(user).toHaveProperty('isEmailVerified', false);
      expect(user).toHaveProperty('createdAt');

      // Check token
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
    }, 30000);

    it('should handle single name correctly', async () => {
      const singleNameData = {
        name: 'John',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(singleNameData)
        .expect(201);

      const user = response.body.data.user;
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('');
      expect(user.fullName).toBe('John');
    }, 30000);

    it('should handle multiple word names correctly', async () => {
      const multiNameData = {
        name: 'John Michael Doe',
        email: 'john.michael.doe@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(multiNameData)
        .expect(201);

      const user = response.body.data.user;
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Michael Doe');
      expect(user.fullName).toBe('John Michael Doe');
    }, 30000);

    it('should convert email to lowercase', async () => {
      const uppercaseEmailData = {
        name: 'Jane Doe',
        email: 'JANE.DOE@EXAMPLE.COM',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(uppercaseEmailData)
        .expect(201);

      expect(response.body.data.user.email).toBe('jane.doe@example.com');
    }, 30000);
  });

  describe('Validation Errors', () => {
    it('should return 400 when name is missing', async () => {
      const invalidData = {
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Please provide name, email, and password');
    });

    it('should return 400 when email is missing', async () => {
      const invalidData = {
        name: 'John Doe',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Please provide name, email, and password');
    });

    it('should return 400 when password is missing', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john.doe@example.com'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Please provide name, email, and password');
    });

    it('should return 400 when all fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Please provide name, email, and password');
    });
  });

  describe('Duplicate Email Registration', () => {
    it('should return 400 when trying to register with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User with this email already exists');
    }, 30000);

    it('should return 400 when trying to register with existing email (case insensitive)', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same email but different case
      const duplicateData = {
        name: 'Jane Doe',
        email: 'JOHN.DOE@EXAMPLE.COM',
        password: 'password456'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User with this email already exists');
    }, 30000);
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      // Import User model to check if password was hashed
      const { User } = require('../models');
      const savedUser = await User.findById(response.body.data.user.id);

      expect(savedUser.password).not.toBe(validUserData.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt hash pattern
    }, 30000);
  });
});

describe('POST /api/v1/auth/login', () => {
  const validUserData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123'
  };

  beforeEach(async () => {
    // Register a user before each login test
    await request(app)
      .post('/api/v1/auth/register')
      .send(validUserData);
  });

  describe('Successful Login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(validUserData.email);
    });
  });

  describe('Login Validation', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: validUserData.password })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Please provide email and password');
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUserData.email })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Please provide email and password');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
});

describe('GET /api/v1/auth/me', () => {
  const validUserData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123'
  };

  let authToken;

  beforeEach(async () => {
    // Register and login to get token
    await request(app)
      .post('/api/v1/auth/register')
      .send(validUserData);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: validUserData.email,
        password: validUserData.password
      });

    authToken = loginResponse.body.data.token;
  });

  describe('Successful Profile Retrieval', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.password).toBeUndefined(); // Password should be excluded
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('database');
  });
});
