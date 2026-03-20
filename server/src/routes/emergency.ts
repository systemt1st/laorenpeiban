/**
 * Emergency Routes
 *
 * POST   /contacts     - Add an emergency contact
 * GET    /contacts     - List emergency contacts
 * PUT    /contacts/:id - Update an emergency contact
 * DELETE /contacts/:id - Delete an emergency contact
 * POST   /events       - Record an emergency event
 * GET    /events       - List emergency events
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { validate, createEmergencyContactSchema, createEmergencyEventSchema } from '../utils/validators';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import { getEmergencyGuidance } from '../services/emergencyService';
import logger from '../utils/logger';

const router = Router();

// ============================
// POST /contacts - Add emergency contact
// ============================
router.post('/contacts', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, error } = validate<{
      userId: string;
      name: string;
      relationship: string;
      phone: string;
      priority?: number;
    }>(createEmergencyContactSchema, req.body);

    if (error) {
      throw new BadRequestError(error);
    }

    // Verify user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(value.userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const contactId = uuidv4();

    db.prepare(`
      INSERT INTO emergency_contacts (id, user_id, name, relationship, phone, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(contactId, value.userId, value.name, value.relationship, value.phone, value.priority ?? 0);

    const contact = db.prepare('SELECT * FROM emergency_contacts WHERE id = ?').get(contactId);

    logger.info(`Emergency contact created: ${value.name} for user ${value.userId}`);

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET /contacts - List emergency contacts
// ============================
router.get('/contacts', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数');
    }

    const contacts = db.prepare(`
      SELECT * FROM emergency_contacts
      WHERE user_id = ?
      ORDER BY priority ASC
    `).all(userId);

    res.json({
      success: true,
      data: contacts,
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// PUT /contacts/:id - Update emergency contact
// ============================
router.put('/contacts/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM emergency_contacts WHERE id = ?').get(id);
    if (!existing) {
      throw new NotFoundError('紧急联系人不存在');
    }

    const { name, relationship, phone, priority } = req.body;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (relationship !== undefined) { fields.push('relationship = ?'); values.push(relationship); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (priority !== undefined) { fields.push('priority = ?'); values.push(priority); }

    if (fields.length === 0) {
      throw new BadRequestError('至少需要提供一个更新字段');
    }

    values.push(id);

    db.prepare(`UPDATE emergency_contacts SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const contact = db.prepare('SELECT * FROM emergency_contacts WHERE id = ?').get(id);

    logger.info(`Emergency contact updated: ${id}`);

    res.json({
      success: true,
      data: contact,
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// DELETE /contacts/:id - Delete emergency contact
// ============================
router.delete('/contacts/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM emergency_contacts WHERE id = ?').get(id);
    if (!existing) {
      throw new NotFoundError('紧急联系人不存在');
    }

    db.prepare('DELETE FROM emergency_contacts WHERE id = ?').run(id);

    logger.info(`Emergency contact deleted: ${id}`);

    res.json({
      success: true,
      data: { message: '紧急联系人已删除' },
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// POST /events - Record emergency event
// ============================
router.post('/events', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, error } = validate<{
      userId: string;
      triggerKeyword: string;
      userDescription?: string;
      riskLevel: string;
      actionTaken?: string;
      context?: string;
    }>(createEmergencyEventSchema, req.body);

    if (error) {
      throw new BadRequestError(error);
    }

    // Verify user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(value.userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const eventId = uuidv4();

    db.prepare(`
      INSERT INTO emergency_events (id, user_id, trigger_keyword, user_description, risk_level, action_taken, context)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventId,
      value.userId,
      value.triggerKeyword,
      value.userDescription ?? null,
      value.riskLevel,
      value.actionTaken ?? null,
      value.context ?? null
    );

    // Get emergency guidance
    const guidance = getEmergencyGuidance(value.triggerKeyword, value.riskLevel);

    // Get emergency contacts for this user
    const emergencyContacts = db.prepare(`
      SELECT id, name, relationship, phone, priority
      FROM emergency_contacts
      WHERE user_id = ?
      ORDER BY priority ASC
    `).all(value.userId);

    const event = db.prepare('SELECT * FROM emergency_events WHERE id = ?').get(eventId);

    logger.warn(`Emergency event recorded: level=${value.riskLevel}, keyword="${value.triggerKeyword}", user=${value.userId}`);

    res.status(201).json({
      success: true,
      data: {
        event,
        guidance,
        emergencyContacts,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET /events - List emergency events
// ============================
router.get('/events', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, page = '1', limit = '20' } = req.query;

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数');
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const events = db.prepare(`
      SELECT * FROM emergency_events
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limitNum, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM emergency_events WHERE user_id = ?
    `).get(userId) as { count: number };

    res.json({
      success: true,
      data: {
        events,
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
