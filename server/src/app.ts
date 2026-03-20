import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import route placeholders (these will be created later; provide empty routers as fallback)
import { Router } from 'express';

// Create route placeholders that will be replaced when actual routes are implemented
function createPlaceholderRouter(name: string): Router {
  const router = Router();
  router.all('*', (_req, res) => {
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `${name} routes are not yet implemented`,
      },
    });
  });
  return router;
}

// Attempt to load actual routers; fall back to placeholders
let userRouter: Router;
let chatRouter: Router;
let reminderRouter: Router;
let emergencyRouter: Router;
let familyRouter: Router;

try {
  userRouter = require('./routes/users').default;
} catch {
  userRouter = createPlaceholderRouter('Users');
}

try {
  chatRouter = require('./routes/chat').default;
} catch {
  chatRouter = createPlaceholderRouter('Chat');
}

try {
  reminderRouter = require('./routes/reminders').default;
} catch {
  reminderRouter = createPlaceholderRouter('Reminders');
}

try {
  emergencyRouter = require('./routes/emergency').default;
} catch {
  emergencyRouter = createPlaceholderRouter('Emergency');
}

try {
  familyRouter = require('./routes/family').default;
} catch {
  familyRouter = createPlaceholderRouter('Family');
}

// ============================
// Create Express application
// ============================
const app = express();

// ============================
// Security middleware
// ============================
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API server
}));

// ============================
// CORS configuration
// ============================
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-family-code'],
  credentials: true,
}));

// ============================
// Compression
// ============================
app.use(compression());

// ============================
// Request logging
// ============================
const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
app.use(morgan('short', { stream: morganStream }));

// ============================
// Body parsers
// ============================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================
// Health check endpoint
// ============================
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ============================
// API routes
// ============================
app.use('/api/users', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/reminders', reminderRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/family', familyRouter);

// ============================
// 404 handler (must be after all routes)
// ============================
app.use(notFoundHandler);

// ============================
// Global error handler (must be last)
// ============================
app.use(errorHandler);

export default app;
