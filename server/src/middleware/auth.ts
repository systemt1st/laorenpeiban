import { Request, Response, NextFunction } from 'express';
import db from '../models/database';
import { UnauthorizedError } from './errorHandler';
import logger from '../utils/logger';

/**
 * Extend the Express Request type to carry user context.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      familyCode?: string;
    }
  }
}

/**
 * Authentication middleware.
 * Checks for x-user-id header and verifies the user exists in the database.
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;

    if (!userId) {
      throw new UnauthorizedError('缺少用户标识，请在请求头中提供 x-user-id');
    }

    // Verify user exists in database
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as
      | { id: string }
      | undefined;

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    // Attach userId to request for downstream handlers
    req.userId = userId;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Family authentication middleware.
 * Checks for x-family-code header and verifies the family code is valid.
 * Also sets req.userId to the user associated with that family code.
 */
export function familyAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const familyCode = req.headers['x-family-code'] as string | undefined;

    if (!familyCode) {
      throw new UnauthorizedError('缺少家属验证码，请在请求头中提供 x-family-code');
    }

    // Verify family code exists and find associated user
    const user = db
      .prepare('SELECT id, nickname FROM users WHERE family_code = ?')
      .get(familyCode) as { id: string; nickname: string } | undefined;

    if (!user) {
      throw new UnauthorizedError('无效的家属验证码');
    }

    // Attach context to request
    req.familyCode = familyCode;
    req.userId = user.id;

    logger.info(`Family access authenticated for user ${user.nickname} (${user.id})`);

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication middleware.
 * If x-user-id is provided it will be validated and attached,
 * but the request is not rejected if it's missing.
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;

    if (userId) {
      const user = db
        .prepare('SELECT id FROM users WHERE id = ?')
        .get(userId) as { id: string } | undefined;

      if (user) {
        req.userId = userId;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}
