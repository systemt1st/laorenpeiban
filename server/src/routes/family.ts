/**
 * Family Dashboard Routes
 *
 * POST  /verify             - Verify a family code
 * GET   /dashboard/:userId  - Get dashboard overview
 * GET   /summary/:userId    - Get conversation summaries
 */

import { Router, Request, Response, NextFunction } from 'express';
import db from '../models/database';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const router = Router();

// ============================
// POST /verify - Verify family code
// ============================
router.post('/verify', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { familyCode } = req.body;

    if (!familyCode) {
      throw new BadRequestError('缺少家属验证码');
    }

    const user = db.prepare(`
      SELECT id, nickname, age, gender, avatar_url, family_code, created_at
      FROM users
      WHERE family_code = ?
    `).get(familyCode) as Record<string, unknown> | undefined;

    if (!user) {
      throw new NotFoundError('无效的家属验证码');
    }

    logger.info(`Family code verified for user: ${user.nickname} (${user.id})`);

    res.json({
      success: true,
      data: {
        userId: user.id,
        nickname: user.nickname,
        age: user.age,
        gender: user.gender,
        avatarUrl: user.avatar_url,
        familyCode: user.family_code,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET /dashboard/:userId - Get dashboard overview
// ============================
router.get('/dashboard/:userId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = db.prepare('SELECT id, nickname FROM users WHERE id = ?').get(userId) as { id: string; nickname: string } | undefined;
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Today's conversation count
    const conversationCount = db.prepare(`
      SELECT COUNT(*) as count FROM conversations
      WHERE user_id = ? AND date(started_at) = date(?)
    `).get(userId, today) as { count: number };

    // Latest mood from the most recent conversation today
    const latestMood = db.prepare(`
      SELECT mood FROM conversations
      WHERE user_id = ? AND date(started_at) = date(?) AND mood IS NOT NULL
      ORDER BY started_at DESC
      LIMIT 1
    `).get(userId, today) as { mood: string } | undefined;

    // Today's reminder completion rate
    const totalRemindersToday = db.prepare(`
      SELECT COUNT(*) as count FROM reminder_logs
      WHERE user_id = ? AND date(triggered_at) = date(?)
    `).get(userId, today) as { count: number };

    const confirmedRemindersToday = db.prepare(`
      SELECT COUNT(*) as count FROM reminder_logs
      WHERE user_id = ? AND date(triggered_at) = date(?) AND confirmed = 1
    `).get(userId, today) as { count: number };

    const reminderCompletionRate = totalRemindersToday.count > 0
      ? Math.round((confirmedRemindersToday.count / totalRemindersToday.count) * 100)
      : 100;

    // Today's emergency events count
    const emergencyCount = db.prepare(`
      SELECT COUNT(*) as count FROM emergency_events
      WHERE user_id = ? AND date(created_at) = date(?)
    `).get(userId, today) as { count: number };

    // Most recent conversation summary
    const recentSummary = db.prepare(`
      SELECT id, title, summary, mood, started_at FROM conversations
      WHERE user_id = ? AND summary IS NOT NULL
      ORDER BY started_at DESC
      LIMIT 5
    `).all(userId);

    // Today's reminder logs
    const todayReminderLogs = db.prepare(`
      SELECT rl.id, rl.reminder_id, rl.triggered_at, rl.confirmed, rl.confirmed_at,
             r.type, r.title, r.time
      FROM reminder_logs rl
      LEFT JOIN reminders r ON r.id = rl.reminder_id
      WHERE rl.user_id = ? AND date(rl.triggered_at) = date(?)
      ORDER BY rl.triggered_at DESC
    `).all(userId, today);

    logger.info(`Family dashboard accessed for user: ${user.nickname} (${userId})`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
        },
        today: {
          date: today,
          conversationCount: conversationCount.count,
          mood: latestMood?.mood ?? 'neutral',
          reminderCompletionRate,
          reminderTotal: totalRemindersToday.count,
          reminderConfirmed: confirmedRemindersToday.count,
          emergencyCount: emergencyCount.count,
        },
        recentSummaries: recentSummary,
        todayReminderLogs: todayReminderLogs,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET /summary/:userId - Get conversation summaries
// ============================
router.get('/summary/:userId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { days = '7' } = req.query;

    // Verify user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const daysNum = Math.min(90, Math.max(1, parseInt(days as string, 10) || 7));

    const summaries = db.prepare(`
      SELECT id, title, summary, mood, message_count, started_at, ended_at
      FROM conversations
      WHERE user_id = ?
        AND started_at >= datetime('now', 'localtime', ?)
      ORDER BY started_at DESC
    `).all(userId, `-${daysNum} days`);

    // Aggregate mood distribution
    const moodDistribution: Record<string, number> = {};
    for (const s of summaries as Array<{ mood: string | null }>) {
      const mood = s.mood || 'neutral';
      moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        days: daysNum,
        total: summaries.length,
        summaries,
        moodDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
