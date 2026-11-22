import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne, executeRun } from '../db/database';

export const JWT_SECRET = process.env.JWT_SECRET || 'activity-points-secret-key-cse-2025';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'hod' | 'mentor' | 'student' | 'dean';
  department_id: string;
  mentor_id?: string;
  roll_no?: string;
  semester?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  token?: string;
}

/**
 * Enterprise Sliding Window: Short-lived Access Token (15 minutes)
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      mentor_id: user.mentor_id || null,
      roll_no: user.roll_no || null,
      semester: user.semester || null,
      token_type: 'access',
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Enterprise Sliding Window: Long-lived Refresh Token (7 days)
 */
export function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      token_type: 'refresh',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Checks if a JWT token has been explicitly blacklisted (revoked on logout)
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const row = await queryOne<{ token: string }>(
      'SELECT token FROM token_blacklist WHERE token = ? LIMIT 1',
      [token]
    );
    return !!row;
  } catch {
    return false;
  }
}

/**
 * Blacklists a JWT token on logout to prevent replay attacks
 */
export async function blacklistToken(token: string, expiresAt?: string): Promise<void> {
  try {
    const exp = expiresAt || new Date(Date.now() + 7 * 86400000).toISOString();
    await executeRun(
      'INSERT OR IGNORE INTO token_blacklist (token, revoked_at, expires_at) VALUES (?, ?, ?)',
      [token, new Date().toISOString(), exp]
    );
  } catch (err) {
    console.error('Failed to blacklist token:', err);
  }
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authorization header missing or invalid format' });
    return;
  }

  // 1. Check if token is blacklisted (revoked on logout)
  if (await isTokenBlacklisted(token)) {
    res.status(401).json({ error: 'Session has been terminated / token revoked. Please log in again.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    req.token = token;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

export function requireRole(allowedRoles: Array<'hod' | 'mentor' | 'student' | 'dean'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    // Dean possesses super-administrative privileges over HOD routes
    const hasRole = allowedRoles.includes(req.user.role) || (req.user.role === 'dean' && allowedRoles.includes('hod'));

    if (!hasRole) {
      res.status(403).json({
        error: `Forbidden: Requires role in [${allowedRoles.join(', ')}], current role is '${req.user.role}'`,
      });
      return;
    }

    next();
  };
}
