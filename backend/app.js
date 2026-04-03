require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const { connectDB } = require('./config/connection');
const { testEmailConnection } = require('./services/EmailServices');
const { bootstrapRuntimeData } = require('./services/bootstrapRuntimeData');

// Import routes
const authRoutes = require('./routers/authRoutes');
const userRoutes = require('./routers/userRoutes');
const financialRoutes = require('./routers/financialRoutes');
const dashboardRoutes = require('./routers/dashboardRoutes');
const requestRoutes = require('./routers/requestRoutes');
const roleRoutes = require('./routers/roleRoutes');
const settingsRoutes = require('./routers/settingsRoutes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting - DISABLED for unlimited development requests
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs (increased for development)
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });

// app.use('/api/', limiter); // DISABLED - No rate limiting

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Make upload middleware available globally
app.set('upload', upload);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', userRoutes); // Admin routes
app.use('/api/records', financialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance Management System API',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'User self-registration',
        'POST /api/auth/admin-register': 'Admin registration of users',
        'POST /api/auth/login': 'User login',
        'GET /api/auth/profile': 'Get user profile'
      },
      users: {
        'GET /api/users': 'Get all users (Admin only)',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user (Admin only)',
        'DELETE /api/users/:id': 'Delete user (Admin only)',
        'PUT /api/users/profile/update': 'Update own profile',
        'PUT /api/users/change-password': 'Change password'
      },
      financial_records: {
        'POST /api/records': 'Create financial record',
        'GET /api/records': 'Get all financial records',
        'GET /api/records/:id': 'Get financial record by ID',
        'PUT /api/records/:id': 'Update financial record',
        'DELETE /api/records/:id': 'Delete financial record'
      },
      dashboard: {
        'GET /api/dashboard/monthly': 'Get monthly summary',
        'GET /api/dashboard/yearly': 'Get yearly summary',
        'GET /api/dashboard/category-wise': 'Get category-wise summary',
        'GET /api/dashboard/trends': 'Get financial trends',
        'GET /api/dashboard/reduction-plan': 'Get expense reduction plan',
        'GET /api/dashboard/system-health': 'Get live system health metrics'
      },
      requests: {
        'POST /api/requests/edit': 'Submit edit request',
        'POST /api/requests/delete': 'Submit delete request',
        'GET /api/requests/pending': 'Get pending requests (Admin only)',
        'GET /api/requests/my-requests': 'Get user requests',
        'PUT /api/requests/:id/approve': 'Approve request (Admin only)',
        'PUT /api/requests/:id/reject': 'Reject request (Admin only)'
      },
      roles: {
        'GET /api/roles': 'Get all roles (Admin only)',
        'GET /api/roles/:id': 'Get role by ID (Admin only)',
        'POST /api/roles': 'Create role (Admin only)',
        'PUT /api/roles/:id': 'Update role (Admin only)',
        'DELETE /api/roles/:id': 'Delete role (Admin only)',
        'POST /api/roles/assign': 'Assign role to user (Admin only)'
      },
      settings: {
        'GET /api/settings': 'Get application settings (Admin only)',
        'PUT /api/settings': 'Update application settings (Admin only)'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Handle multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large',
        maxSize: process.env.MAX_FILE_SIZE || '5MB'
      });
    }
  }

  // Handle CORS errors
  if (error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Initialize server and database
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    await bootstrapRuntimeData();

    // Test email connection
    await testEmailConnection();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Finance Management System API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
