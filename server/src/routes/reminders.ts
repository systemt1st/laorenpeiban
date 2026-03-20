/**
 * Reminder Management Routes
 *
 * POST   /              - Create a reminder
 * GET    /              - List reminders (by userId, optional enabled filter)
 * PUT    /:id           - Update a reminder
 * DELETE /:id           - Delete a reminder
 * POST   /:id/confirm   - Confirm a reminder execution
 * GET    /logs          - Get reminder logs
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { validate, createReminderSchema, updateReminderSchema } from '../utils/validators';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const router = Router();

// ============================
// POST / - Create reminder
// ============================
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, error } = validate<{
      userId: string;
      type: string;
      title: string;
      description?: string;
      time: string;
      days?: number[];
      repeat?: boolean;
      enabled?: boolean;
      extraData?: Record<string, unknown>;
    }>(createReminderSchema, req.body);

    if (error) {
      throw new BadRequestError(error);
    }

    // Verify user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(value.userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const reminderId = uuidv4();
    const days = value.days ?? [1, 2, 3, 4, 5, 6, 0]; // Default: every day
    const extraData = value.extraData ? JSON.stringify(value.extraData) : null;

    db.prepare(`
      INSERT INTO reminders (id, user_id, type, title, description, time, days, repeat, enabled, extra_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reminderId,
      value.userId,
      value.type,
      value.title,
      value.description ?? null,
      value.time,
      JSON.stringify(days),
      value.repeat !== false ? 1 : 0,
      value.enabled !== false ? 1 : 0,
      extraData
    );

    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(reminderId);

    logger.info(`Reminder created: ${value.title} (${reminderId}) for user ${value.userId}`);

    res.status(201).json({
      success: true,
      data: reminder,
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET / - List reminders
// ============================
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, enabled } = req.query;

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数');
    }

    let sql = 'SELECT * FROM reminders WHERE user_id = ?';
    const params: unknown[] = [userId];

    if (enabled !== undefined) {
      sql += ' AND enabled = ?';
      params.push(enabled === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY time ASC';

    const reminders = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: reminders,
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// PUT /:id - Update reminder
// ============================
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify reminder exists
    const existing = db.prepare('SELECT id FROM reminders WHERE id = ?').get(id);
    if (!existing) {
      throw new NotFoundError('提醒不存在');
    }

    const { value, error } = validate<{
      type?: string;
      title?: string;
      description?: string;
      time?: string;
      days?: number[];
      repeat?: boolean;
      enabled?: boolean;
      extraData?: Record<string, unknown>;
    }>(updateReminderSchema, req.body);

    if (error) {
      throw new BadRequestError(error);
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (value.type !== undefined) { fields.push('type = ?'); values.push(value.type); }
    if (value.title !== undefined) { fields.push('title = ?'); values.push(value.title); }
    if (value.description !== undefined) { fields.push('description = ?'); values.push(value.description); }
    if (value.time !== undefined) { fields.push('time = ?'); values.push(value.time); }
    if (value.days !== undefined) { fields.push('days = ?'); values.push(JSON.stringify(value.days)); }
    if (value.repeat !== undefined) { fields.push('repeat = ?'); values.push(value.repeat ? 1 : 0); }
    if (value.enabled !== undefined) { fields.push('enabled = ?'); values.push(value.enabled ? 1 : 0); }
    if (value.extraData !== undefined) { fields.push('extra_data = ?'); values.push(JSON.stringify(value.extraData)); }

    fields.push("updated_at = datetime('now', 'localtime')");
    values.push(id);

    db.prepare(`UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);

    logger.info(`Reminder updated: ${id}`);

    res.json({
      success: true,
      data: reminder,
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// DELETE /:id - Delete reminder
// ============================
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM reminders WHERE id = ?').get(id);
    if (!existing) {
      throw new NotFoundError('提醒不存在');
    }

    db.prepare('DELETE FROM reminders WHERE id = ?').run(id);

    logger.info(`Reminder deleted: ${id}`);

    res.json({
      success: true,
      data: { message: '提醒已删除' },
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// POST /:id/confirm - Confirm reminder execution
// ============================
router.post('/:id/confirm', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify reminder exists
    const reminder = db.prepare('SELECT id, user_id FROM reminders WHERE id = ?').get(id) as { id: string; user_id: string } | undefined;
    if (!reminder) {
      throw new NotFoundError('提醒不存在');
    }

    // Find the most recent unconfirmed log for this reminder
    const log = db.prepare(`
      SELECT id FROM reminder_logs
      WHERE reminder_id = ? AND confirmed = 0
      ORDER BY triggered_at DESC
      LIMIT 1
    `).get(id) as { id: string } | undefined;

    if (!log) {
      throw new NotFoundError('没有找到待确认的提醒记录');
    }

    // Confirm the log
    db.prepare(`
      UPDATE reminder_logs
      SET confirmed = 1, confirmed_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(log.id);

    logger.info(`Reminder confirmed: reminder=${id}, log=${log.id}`);

    res.json({
      success: true,
      data: { message: '提醒已确认', logId: log.id },
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET /logs - Get reminder logs
// ============================
router.get('/logs', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, date, page = '1', limit = '50' } = req.query;

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数');
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    let sql = `
      SELECT rl.id, rl.reminder_id, rl.user_id, rl.triggered_at, rl.confirmed, rl.confirmed_at,
             r.type, r.title, r.description, r.time
      FROM reminder_logs rl
      LEFT JOIN reminders r ON r.id = rl.reminder_id
      WHERE rl.user_id = ?
    `;
    let countSql = 'SELECT COUNT(*) as count FROM reminder_logs WHERE user_id = ?';
    const params: unknown[] = [userId];
    const countParams: unknown[] = [userId];

    // Filter by date (today)
    if (date) {
      sql += " AND date(rl.triggered_at) = date(?)";
      countSql += " AND date(triggered_at) = date(?)";
      params.push(date);
      countParams.push(date);
    }

    sql += ' ORDER BY rl.triggered_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const logs = db.prepare(sql).all(...params);
    const total = db.prepare(countSql).get(...countParams) as { count: number };

    res.json({
      success: true,
      data: {
        logs,
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
