/**
 * Chat / Conversation Routes
 *
 * POST  /send                       - Send a message and get AI reply
 * GET   /conversations              - List conversations
 * GET   /conversations/:id/messages - Get messages in a conversation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { validate, sendMessageSchema } from '../utils/validators';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import { generateReply, Message as AIMessage } from '../services/aiService';
import { detectEmergency } from '../services/emergencyService';
import logger from '../utils/logger';

const router = Router();

// ============================
// POST /send - Send message and get AI reply
// ============================
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, error } = validate<{
      userId: string;
      message: string;
      conversationId?: string;
    }>(sendMessageSchema, req.body);

    if (error) {
      throw new BadRequestError(error);
    }

    const { userId, message } = value;
    let { conversationId } = value;

    // Verify user exists
    const user = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId) as { id: string; nickname: string } | undefined;
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // If no conversationId, create a new conversation
    if (!conversationId) {
      conversationId = uuidv4();
      const title = message.length > 20 ? message.substring(0, 20) + '...' : message;
      db.prepare(`
        INSERT INTO conversations (id, user_id, title, message_count)
        VALUES (?, ?, ?, 0)
      `).run(conversationId, userId, title);

      logger.info(`New conversation created: ${conversationId} for user ${userId}`);
    } else {
      // Verify conversation exists
      const conv = db.prepare('SELECT id FROM conversations WHERE id = ?').get(conversationId);
      if (!conv) {
        throw new NotFoundError('对话不存在');
      }
    }

    // Save user message
    const userMsgId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, user_id, role, content)
      VALUES (?, ?, ?, 'user', ?)
    `).run(userMsgId, conversationId, userId, message);

    // Fetch conversation history for AI context
    const historyRows = db.prepare(`
      SELECT role, content
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      LIMIT 20
    `).all(conversationId) as AIMessage[];

    // Generate AI reply
    const { reply, mood } = await generateReply(userId, message, historyRows);

    // Detect emergency
    const emergency = detectEmergency(message);

    // Save AI reply
    const aiMsgId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, user_id, role, content)
      VALUES (?, ?, ?, 'assistant', ?)
    `).run(aiMsgId, conversationId, userId, reply);

    // Update conversation message_count and mood
    db.prepare(`
      UPDATE conversations
      SET message_count = message_count + 2,
          mood = ?,
          summary = ?
      WHERE id = ?
    `).run(mood, reply, conversationId);

    logger.info(`Chat: user=${userId}, conv=${conversationId}, mood=${mood}, emergency=${emergency.isEmergency}`);

    res.json({
      success: true,
      data: {
        reply,
        conversationId,
        mood,
        isEmergency: emergency.isEmergency,
        emergencyLevel: emergency.level,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET /conversations - List conversations
// ============================
router.get('/conversations', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, page = '1', limit = '20' } = req.query;

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数');
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conversations = db.prepare(`
      SELECT id, user_id, title, summary, mood, message_count, started_at, ended_at
      FROM conversations
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limitNum, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM conversations WHERE user_id = ?
    `).get(userId) as { count: number };

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total.count,
          totalPages: Math.ceil(total.count / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET /conversations/:id/messages - Get messages in a conversation
// ============================
router.get('/conversations/:id/messages', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    // Verify conversation exists
    const conv = db.prepare('SELECT id, user_id, title, mood FROM conversations WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!conv) {
      throw new NotFoundError('对话不存在');
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const messages = db.prepare(`
      SELECT id, conversation_id, user_id, role, content, created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      LIMIT ? OFFSET ?
    `).all(id, limitNum, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?
    `).get(id) as { count: number };

    res.json({
      success: true,
      data: {
        conversation: conv,
        messages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total.count,
          totalPages: Math.ceil(total.count / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
