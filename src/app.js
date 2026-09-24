const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Parse json requests
app.use(express.json());

// Enable CORS for frontend clients & cross-origin deployment
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});


// Initialize MongoDB Connection
connectDB();

// Ensure database connection is ready before processing API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection middleware error:', err.message);
  }
  next();
});

const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Mount Routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const barberRoutes = require('./routes/barberRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const wageRoutes = require('./routes/wageRoutes');
const slotRoutes = require('./routes/slotRoutes');
const reportRoutes = require('./routes/reportRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Load OpenAPI / Swagger Specification
const swaggerFilePath = path.join(__dirname, 'docs', 'swagger.yaml');
let swaggerDocument;
try {
  swaggerDocument = YAML.load(swaggerFilePath);
} catch (error) {
  console.error('Failed to load Swagger YAML:', error.message);
}

// Interactive Swagger Playground
if (swaggerDocument) {
  app.get('/api/docs/swagger.yaml', (req, res) => {
    res.sendFile(swaggerFilePath);
  });
  app.get('/api/docs/openapi.json', (req, res) => {
    res.json(swaggerDocument);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Salon Management API Docs'
  }));
}


// Health Check Endpoints
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// Core Business Domain Routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // support POST /api/users/staff through authRoutes mounting
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/wages', wageRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/reports', reportRoutes);

// Root landing endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Salon Management System Enterprise API - Operational',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
    accreditation: 'Darshan University (2501CS402)'
  });
});

// 404 Route Interceptor
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.originalUrl} not found. Refer to /api/docs for the complete API specification.`
    }
  });
});

// Production-Grade Global Error Interceptor Middleware
app.use((err, req, res, next) => {
  console.error('[System Exception Interceptor]:', err);

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        message: `Invalid format for resource identifier: ${err.value}`,
        field: err.path
      }
    });
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        message: `Resource conflict: A record with that ${duplicateField} already exists.`,
        field: duplicateField
      }
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors || {}).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: {
        message: 'Database schema validation constraint violation',
        details: validationErrors
      }
    });
  }

  // Standard or Custom Error
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

const PORT = process.env.PORT || 3000;
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Server executing at http://localhost:${PORT}`);
    console.log(`Swagger API Docs available at http://localhost:${PORT}/api/docs`);
    console.log(`Health Diagnostic available at http://localhost:${PORT}/api/health`);
  });
}

// Graceful Shutdown Handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: Closing HTTP server cleanly');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  }
});

module.exports = app;

