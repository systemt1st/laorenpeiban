/**
 * User Management Routes
 *
 * POST   /           - Create a new user
 * GET    /:id        - Get user info (with preferences & health profile)
 * PUT    /:id        - Update user basic info
 * PUT    /:id/preferences - Update user preferences
 * PUT    /:id/health      - Update health profile
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { validate, createUserSchema, updateUserSchema } from '../utils/validators';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const router = Router();

// ============================
// Helper: generate a 6-digit family code
// ============================
function generateFamilyCode(): string {
  // Generate a random 6-digit code and ensure uniqueness
  let code: string;
  let exists: unknown;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
    exists = db.prepare('SELECT id FROM users WHERE family_code = ?').get(code);
  } while (exists);
  return code;
}

// ============================
// POST / - Create user
// ============================
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, error } = validate<{
      nickname: string;
      age?: number;
      gender?: string;
      address?: string;
      avatarUrl?: string;
    }>(createUserSchema, req.body);

    if (error) {
      throw new BadRequestError(error);
    }

    const userId = uuidv4();
    const familyCode = generateFamilyCode();

    // Insert user
    db.prepare(`
      INSERT INTO users (id, nickname, age, gender, address, avatar_url, family_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      value.nickname,
      value.age ?? null,
      value.gender ?? null,
      value.address ?? null,
      value.avatarUrl ?? null,
      familyCode
    );

    // Create default user_preferences record
    const prefId = uuidv4();
    db.prepare(`
      INSERT INTO user_preferences (id, user_id)
      VALUES (?, ?)
    `).run(prefId, userId);

    // Create default health_profiles record
    const healthId = uuidv4();
    db.prepare(`
      INSERT INTO health_profiles (id, user_id)
      VALUES (?, ?)
    `).run(healthId, userId);

    // Fetch the created user
    const user = db.prepare(`
      SELECT id, nickname, age, gender, address, avatar_url, family_code, created_at, updated_at
      FROM users WHERE id = ?
    `).get(userId);

    logger.info(`User created: ${value.nickname} (${userId}), family_code: ${familyCode}`);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// GET /:id - Get user info
// ============================
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = db.prepare(`
      SELECT
        u.id, u.nickname, u.age, u.gender, u.address, u.avatar_url,
        u.family_code, u.created_at, u.updated_at,
        p.voice_speed, p.voice_volume, p.font_size, p.interests,
        h.conditions, h.medications, h.allergies
      FROM users u
      LEFT JOIN user_preferences p ON p.user_id = u.id
      LEFT JOIN health_profiles h ON h.user_id = u.id
      WHERE u.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // Parse JSON fields
    const interests = user.interests
      ? (() => { try { return JSON.parse(user.interests as string); } catch { return user.interests; } })()
      : null;
    const conditions = user.conditions
      ? (() => { try { return JSON.parse(user.conditions as string); } catch { return user.conditions; } })()
      : null;
    const medications = user.medications
      ? (() => { try { return JSON.parse(user.medications as string); } catch { return user.medications; } })()
      : null;
    const allergies = user.allergies
      ? (() => { try { return JSON.parse(user.allergies as string); } catch { return user.allergies; } })()
      : null;

    res.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        age: user.age,
        gender: user.gender,
        address: user.address,
        avatarUrl: user.avatar_url,
        familyCode: user.family_code,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        preferences: {
          voiceSpeed: user.voice_speed,
          voiceVolume: user.voice_volume,
          fontSize: user.font_size,
          interests,
        },
        health: {
          conditions,
          medications,
          allergies,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// PUT /:id - Update user basic info
// ============================
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify user exists
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) {
      throw new NotFoundError('用户不存在');
    }

    const { value, error } = validate<{
      nickname?: string;
      age?: number;
      gender?: string;
      address?: string;
      avatarUrl?: string;
    }>(updateUserSchema, req.body);

    if (error) {
      throw new BadRequestError(error);
    }

    // Build dynamic update
    const fields: string[] = [];
    const values: unknown[] = [];

    if (value.nickname !== undefined) { fields.push('nickname = ?'); values.push(value.nickname); }
    if (value.age !== undefined) { fields.push('age = ?'); values.push(value.age); }
    if (value.gender !== undefined) { fields.push('gender = ?'); values.push(value.gender); }
    if (value.address !== undefined) { fields.push('address = ?'); values.push(value.address); }
    if (value.avatarUrl !== undefined) { fields.push('avatar_url = ?'); values.push(value.avatarUrl); }

    fields.push("updated_at = datetime('now', 'localtime')");
    values.push(id);

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    // Return updated user
    const user = db.prepare(`
      SELECT id, nickname, age, gender, address, avatar_url, family_code, created_at, updated_at
      FROM users WHERE id = ?
    `).get(id);

    logger.info(`User updated: ${id}`);

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// PUT /:id/preferences - Update preferences
// ============================
router.put('/:id/preferences', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify user exists
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) {
      throw new NotFoundError('用户不存在');
    }

    const { voice_speed, voice_volume, font_size, interests } = req.body;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (voice_speed !== undefined) { fields.push('voice_speed = ?'); values.push(voice_speed); }
    if (voice_volume !== undefined) { fields.push('voice_volume = ?'); values.push(voice_volume); }
    if (font_size !== undefined) { fields.push('font_size = ?'); values.push(font_size); }
    if (interests !== undefined) {
      fields.push('interests = ?');
      values.push(typeof interests === 'string' ? interests : JSON.stringify(interests));
    }

    if (fields.length === 0) {
      throw new BadRequestError('至少需要提供一个更新字段');
    }

    fields.push("updated_at = datetime('now', 'localtime')");
    values.push(id);

    db.prepare(`UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);

    // Return updated preferences
    const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(id) as Record<string, unknown> | undefined;

    logger.info(`User preferences updated: ${id}`);

    res.json({
      success: true,
      data: prefs,
    });
  } catch (err) {
    next(err);
  }
});

// ============================
// PUT /:id/health - Update health profile
// ============================
router.put('/:id/health', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify user exists
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) {
      throw new NotFoundError('用户不存在');
    }

    const { conditions, medications, allergies } = req.body;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (conditions !== undefined) {
      fields.push('conditions = ?');
      values.push(typeof conditions === 'string' ? conditions : JSON.stringify(conditions));
    }
    if (medications !== undefined) {
      fields.push('medications = ?');
      values.push(typeof medications === 'string' ? medications : JSON.stringify(medications));
    }
    if (allergies !== undefined) {
      fields.push('allergies = ?');
      values.push(typeof allergies === 'string' ? allergies : JSON.stringify(allergies));
    }

    if (fields.length === 0) {
      throw new BadRequestError('至少需要提供一个更新字段');
    }

    fields.push("updated_at = datetime('now', 'localtime')");
    values.push(id);

    db.prepare(`UPDATE health_profiles SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);

    // Return updated health profile
    const health = db.prepare('SELECT * FROM health_profiles WHERE user_id = ?').get(id) as Record<string, unknown> | undefined;

    logger.info(`User health profile updated: ${id}`);

    res.json({
      success: true,
      data: health,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
