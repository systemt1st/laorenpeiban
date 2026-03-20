import dotenv from 'dotenv';

// Load environment variables before anything else
dotenv.config();

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cron from 'node-cron';
import app from './app';
import { initDatabase, closeDatabase } from './models/database';
import logger from './utils/logger';

// ============================
// Configuration
// ============================
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// ============================
// Initialize database
// ============================
try {
  initDatabase();
} catch (err) {
  logger.error('Failed to initialize database:', err);
  process.exit(1);
}

// ============================
// Create HTTP server
// ============================
const server = http.createServer(app);

// ============================
// WebSocket server
// ============================
const wss = new WebSocketServer({ server, path: '/ws' });

// Track connected clients
const clients = new Map<string, WebSocket>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');

  if (userId) {
    clients.set(userId, ws);
    logger.info(`WebSocket client connected: ${userId}`);
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.info(`WebSocket message from ${userId}:`, message);

      // Handle different message types
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'reminder_confirm':
          // Will be handled by reminder service when implemented
          logger.info(`Reminder confirmed by ${userId}: ${message.reminderId}`);
          break;
        default:
          logger.warn(`Unknown WebSocket message type: ${message.type}`);
      }
    } catch (err) {
      logger.error('Failed to parse WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (userId) {
      clients.delete(userId);
      logger.info(`WebSocket client disconnected: ${userId}`);
    }
  });

  ws.on('error', (err) => {
    logger.error(`WebSocket error for ${userId}:`, err);
  });

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: 'connected',
      message: '连接成功',
      timestamp: Date.now(),
    })
  );
});

/**
 * Send a WebSocket message to a specific user.
 */
export function sendToUser(userId: string, data: object): boolean {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  }
  return false;
}

/**
 * Broadcast a message to all connected clients.
 */
export function broadcast(data: object): void {
  const message = JSON.stringify(data);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// ============================
// Reminder scheduler (cron)
// ============================
// Check for due reminders every minute
const reminderJob = cron.schedule('* * * * *', () => {
  try {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Import db inline to avoid circular dependencies
    const db = require('./models/database').default;

    // Find active reminders that match the current time
    const reminders = db
      .prepare(
        `SELECT id, user_id, type, title, description, time, days
         FROM reminders
         WHERE enabled = 1 AND time = ?`
      )
      .all(currentTime) as Array<{
        id: string;
        user_id: string;
        type: string;
        title: string;
        description: string;
        time: string;
        days: string | null;
      }>;

    for (const reminder of reminders) {
      // Check if this reminder should fire today
      if (reminder.days) {
        try {
          const days: number[] = JSON.parse(reminder.days);
          if (days.length > 0 && !days.includes(currentDay)) {
            continue; // Skip — not scheduled for today
          }
        } catch {
          // If days parsing fails, trigger anyway
        }
      }

      // Log the trigger
      const { v4: uuidv4 } = require('uuid');
      const logId = uuidv4();
      db.prepare(
        `INSERT INTO reminder_logs (id, reminder_id, user_id)
         VALUES (?, ?, ?)`
      ).run(logId, reminder.id, reminder.user_id);

      // Send WebSocket notification to the user
      const sent = sendToUser(reminder.user_id, {
        type: 'reminder',
        data: {
          logId,
          reminderId: reminder.id,
          reminderType: reminder.type,
          title: reminder.title,
          description: reminder.description,
          time: reminder.time,
        },
      });

      if (sent) {
        logger.info(
          `Reminder triggered and sent: "${reminder.title}" for user ${reminder.user_id}`
        );
      } else {
        logger.warn(
          `Reminder triggered but user not connected: "${reminder.title}" for user ${reminder.user_id}`
        );
      }
    }
  } catch (err) {
    logger.error('Error in reminder scheduler:', err);
  }
});

// ============================
// Start the server
// ============================
server.listen(PORT, HOST, () => {
  logger.info(`Server is running on http://${HOST}:${PORT}`);
  logger.info(`WebSocket server is running on ws://${HOST}:${PORT}/ws`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ============================
// Graceful shutdown
// ============================
function gracefulShutdown(signal: string): void {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      logger.error('Error closing HTTP server:', err);
    } else {
      logger.info('HTTP server closed');
    }
  });

  // Stop the cron job
  reminderJob.stop();
  logger.info('Reminder scheduler stopped');

  // Close all WebSocket connections
  clients.forEach((ws, userId) => {
    try {
      ws.send(JSON.stringify({ type: 'shutdown', message: '服务器即将关闭' }));
      ws.close(1001, 'Server shutting down');
    } catch {
      // Ignore errors during shutdown
    }
    logger.info(`WebSocket connection closed for user: ${userId}`);
  });
  clients.clear();

  // Close the WebSocket server
  wss.close(() => {
    logger.info('WebSocket server closed');
  });

  // Close database connection
  closeDatabase();

  // Give a short delay for cleanup, then exit
  setTimeout(() => {
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }, 1000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

export { server, wss };
