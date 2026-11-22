import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
}

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
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
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
