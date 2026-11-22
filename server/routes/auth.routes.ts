import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne, executeRun } from '../db/database';
import {
  generateToken,
  generateRefreshToken,
  blacklistToken,
  JWT_SECRET,
  authenticate,
  AuthenticatedRequest,
} from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Enterprise Session Generator:
 * Issues 15-minute Access Token + 7-day Refresh Token, persisted in user_sessions
 */
async function createEnterpriseSession(user: any) {
  const accessToken = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.department_id,
    mentor_id: user.mentor_id,
    roll_no: user.roll_no,
    semester: user.semester,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.department_id,
  });

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const createdAt = new Date().toISOString();

  await executeRun(
    `INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, created_at, is_revoked)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [sessionId, user.id, refreshToken, expiresAt, createdAt]
  );

  return { token: accessToken, refreshToken };
}

// List all Demo Personas for instant 1-click role switching in the UI
router.get('/personas', async (req, res) => {
  try {
    const personas = await queryAll(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.cgpa, 
        u.semester, 
        u.roll_no, 
        u.avatar, 
        u.phone,
        u.bio,
        u.designation,
        u.office_location,
        u.mentor_id,
        u.tenth_percentage,
        u.tenth_board,
        u.tenth_year,
        u.twelfth_percentage,
        u.twelfth_board,
        u.twelfth_year,
        u.diploma_or_pu,
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      ORDER BY 
        CASE u.role 
          WHEN 'dean' THEN 1
          WHEN 'hod' THEN 2 
          WHEN 'mentor' THEN 3 
          WHEN 'student' THEN 4 
        END,
        u.name ASC
    `);

    res.json(personas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Quick Switch Persona Token Generator
router.post('/switch-persona', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    let user = await queryOne(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.cgpa, 
        u.semester, 
        u.roll_no, 
        u.avatar,
        u.mentor_id,
        u.tenth_percentage,
        u.tenth_board,
        u.tenth_year,
        u.twelfth_percentage,
        u.twelfth_board,
        u.twelfth_year,
        u.diploma_or_pu,
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [userId]);

    

    if (!user) {
      res.status(404).json({ error: 'Persona not found' });
      return;
    }

    const session = await createEnterpriseSession(user);
    res.json({ token: session.token, refreshToken: session.refreshToken, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Standard Login with rate limiting
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const cleanInput = email.trim().toLowerCase();

    // Map common demo aliases to seeded accounts
    let lookupEmail = cleanInput;
    if (cleanInput === 'dean' || cleanInput === 'dean@university.edu' || cleanInput === 'pawan@university.edu' || cleanInput.includes('pawan')) {
      lookupEmail = 'dean@university.edu';
    } else if (cleanInput.includes('joylin') || cleanInput === 'coordinator') {
      lookupEmail = 'joylin@university.edu';
    } else if (cleanInput.includes('rahul') || cleanInput === 'student') {
      lookupEmail = 'rahul@university.edu';
    } else if (cleanInput.includes('savitha')) {
      lookupEmail = 'savitha@university.edu';
    } else if (cleanInput.includes('ashwath')) {
      lookupEmail = 'sowmya.ashwath@university.edu';
    } else if (cleanInput === 'sowmya p' || cleanInput === 'sowmya.p' || cleanInput.includes('sowmya.p')) {
      lookupEmail = 'sowmya.p@university.edu';
    } else if (cleanInput === 'sowmya s' || cleanInput === 'sowmya.s' || cleanInput.includes('sowmya.s')) {
      lookupEmail = 'sowmya.s@university.edu';
    } else if (cleanInput.includes('pradeep') || cleanInput.includes('kanchan')) {
      lookupEmail = 'pradeep.kanchan@university.edu';
    } else if (cleanInput.includes('sunil') || cleanInput.includes('aithal')) {
      lookupEmail = 'sunil.aithal@university.edu';
    } else if (cleanInput.includes('guru')) {
      lookupEmail = 'guruprasad@university.edu';
    } else if (cleanInput.includes('aishwarya')) {
      lookupEmail = 'aishwarya@university.edu';
    } else if (cleanInput.includes('ramesh') || cleanInput.includes('ravi') || cleanInput === 'mentor') {
      lookupEmail = 'savitha@university.edu';
    } else if (cleanInput.includes('sharma') || cleanInput.includes('hod')) {
      lookupEmail = 'hod@university.edu';
    }

    let user = await queryOne(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.password_hash,
        u.department_id, 
        u.cgpa, 
        u.semester, 
        u.roll_no, 
        u.avatar,
        u.mentor_id,
        u.tenth_percentage,
        u.tenth_board,
        u.tenth_year,
        u.twelfth_percentage,
        u.twelfth_board,
        u.twelfth_year,
        u.diploma_or_pu,
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE LOWER(u.email) = LOWER(?) OR LOWER(u.email) = LOWER(?) OR LOWER(u.roll_no) = LOWER(?)
    `, [cleanInput, lookupEmail, cleanInput]);

    // Fallback to first matching role if demo alias
    if (!user) {
      if (cleanInput.includes('dean') || cleanInput.includes('pawan')) {
        user = await queryOne(`SELECT u.*, d.name as department_name, d.code as department_code FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = 'dean' LIMIT 1`);
      } else if (cleanInput.includes('student')) {
        user = await queryOne(`SELECT u.*, d.name as department_name, d.code as department_code FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = 'student' LIMIT 1`);
      } else if (cleanInput.includes('mentor')) {
        user = await queryOne(`SELECT u.*, d.name as department_name, d.code as department_code FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = 'mentor' LIMIT 1`);
      } else if (cleanInput.includes('hod')) {
        user = await queryOne(`SELECT u.*, d.name as department_name, d.code as department_code FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = 'hod' LIMIT 1`);
      }
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials or account not found' });
      return;
    }

    if (password && user.password_hash) {
      let isMatch = false;
      if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
        try {
          isMatch = bcrypt.compareSync(password, user.password_hash);
        } catch {}
      } else {
        isMatch = user.password_hash === password;
      }
      // Demo password allowances in development / evaluation environments
      if (!isMatch && (password === 'password123' || password === 'demo123' || user.password_hash === 'password123')) {
        isMatch = true;
      }
      if (!isMatch) {
        res.status(401).json({ error: 'Incorrect password entered' });
        return;
      }

      // Progressive Enterprise Password Upgrade: Auto-rehash to 12-round bcrypt standard
      if (!user.password_hash.startsWith('$2a$12$') && !user.password_hash.startsWith('$2b$12$')) {
        try {
          const upgradedHash = bcrypt.hashSync(password, 12);
          await executeRun('UPDATE users SET password_hash = ? WHERE id = ?', [upgradedHash, user.id]);
        } catch {}
      }
    }

    const session = await createEnterpriseSession(user);
    const { password_hash, ...userProfile } = user;
    res.json({ token: session.token, refreshToken: session.refreshToken, user: userProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Current Authenticated User profile
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const user = await queryOne(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.cgpa, 
        u.semester, 
        u.roll_no, 
        u.avatar,
        u.phone,
        u.bio,
        u.designation,
        u.office_location,
        u.mentor_id,
        u.tenth_percentage,
        u.tenth_board,
        u.tenth_year,
        u.twelfth_percentage,
        u.twelfth_board,
        u.twelfth_year,
        u.diploma_or_pu,
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [req.user.id]);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile endpoint for any entity
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const { name, phone, bio, designation, office_location, avatar } = req.body;
    const { executeRun } = await import('../db/database');

    await executeRun(`
      UPDATE users 
      SET 
        name = COALESCE(?, name),
        phone = ?,
        bio = ?,
        designation = ?,
        office_location = ?,
        avatar = COALESCE(?, avatar)
      WHERE id = ?
    `, [
      name ? name.trim() : null,
      phone !== undefined ? (phone ? phone.trim() : '') : null,
      bio !== undefined ? (bio ? bio.trim() : '') : null,
      designation !== undefined ? (designation ? designation.trim() : '') : null,
      office_location !== undefined ? (office_location ? office_location.trim() : '') : null,
      avatar || null,
      req.user.id
    ]);

    const updatedUser = await queryOne(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.cgpa, 
        u.semester, 
        u.roll_no, 
        u.avatar,
        u.phone,
        u.bio,
        u.designation,
        u.office_location,
        u.mentor_id,
        u.tenth_percentage,
        u.tenth_board,
        u.tenth_year,
        u.twelfth_percentage,
        u.twelfth_board,
        u.twelfth_year,
        u.diploma_or_pu,
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [req.user.id]);

    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Simple Registration for three entities: student, mentor, hod
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, roll_no, semester } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    if (!role || !['student', 'mentor', 'hod'].includes(role)) {
      res.status(400).json({ error: 'Role must be student, mentor, or hod' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await queryOne(`SELECT id FROM users WHERE LOWER(email) = ?`, [cleanEmail]);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists. Please log in or use another email.' });
      return;
    }

    // Default department
    const dept = await queryOne(`SELECT id FROM departments LIMIT 1`);
    const deptId = dept?.id || 'dept_cse';

    // Assign a mentor if student
    let assignedMentorId = null;
    if (role === 'student') {
      const defaultMentor = await queryOne(`SELECT id FROM users WHERE role = 'mentor' LIMIT 1`);
      assignedMentorId = defaultMentor?.id || null;
    }

    const userId = `usr_${role}_${Date.now()}`;
    const avatar = `https://images.unsplash.com/photo-${role === 'student' ? '1534528741775-53994a69daeb' : role === 'mentor' ? '1472099645785-5658abf4ff4e' : '1580489944761-15a19d654956'}?w=150&auto=format&fit=crop&q=80`;
    const defaultRoll = roll_no?.trim() || (role === 'student' ? `RVU23CSE${Math.floor(100 + Math.random() * 900)}` : null);
    const defaultSem = semester ? Number(semester) : (role === 'student' ? 6 : null);
    const rawPassword = (password && password.trim()) ? password.trim() : 'password123';
    // Enterprise 12-round salted bcrypt hash
    const passwordHash = bcrypt.hashSync(rawPassword, 12);

    const { executeRun } = await import('../db/database');
    await executeRun(`
      INSERT INTO users (id, name, email, password_hash, role, department_id, mentor_id, cgpa, semester, roll_no, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      name.trim(),
      cleanEmail,
      passwordHash,
      role,
      deptId,
      assignedMentorId,
      role === 'student' ? 8.5 : null,
      defaultSem,
      defaultRoll,
      avatar
    ]);

    const newUser = await queryOne(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department_id, 
        u.cgpa, 
        u.semester, 
        u.roll_no, 
        u.avatar,
        u.mentor_id,
        u.tenth_percentage,
        u.tenth_board,
        u.tenth_year,
        u.twelfth_percentage,
        u.twelfth_board,
        u.twelfth_year,
        u.diploma_or_pu,
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [userId]);

    const session = await createEnterpriseSession(newUser);
    res.status(201).json({ token: session.token, refreshToken: session.refreshToken, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Enterprise Silent Refresh Endpoint:
 * Validates Refresh Token against user_sessions, extends sliding window, issues new 15-min Access Token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    // 1. Verify Refresh Token Cryptographic Signature
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err: any) {
      res.status(401).json({ error: 'Invalid or expired refresh token', code: 'REFRESH_EXPIRED' });
      return;
    }

    if (decoded.token_type !== 'refresh') {
      res.status(401).json({ error: 'Invalid token type provided' });
      return;
    }

    // 2. Check Database Session (Sliding Window & Revocation Check)
    const session = await queryOne<{ id: string; user_id: string; is_revoked: number; expires_at: string }>(
      'SELECT id, user_id, is_revoked, expires_at FROM user_sessions WHERE refresh_token = ? LIMIT 1',
      [refreshToken]
    );

    if (!session || session.is_revoked === 1) {
      res.status(401).json({ error: 'Session has been revoked. Please log in again.', code: 'SESSION_REVOKED' });
      return;
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      res.status(401).json({ error: 'Refresh session expired. Please log in again.', code: 'SESSION_EXPIRED' });
      return;
    }

    // 3. Fetch latest live user profile (propagates live role/mentor updates!)
    const user = await queryOne(`
      SELECT 
        u.id, u.name, u.email, u.role, u.department_id, u.cgpa, u.semester, 
        u.roll_no, u.avatar, u.phone, u.bio, u.designation, u.office_location, u.mentor_id,
        u.tenth_percentage, u.tenth_board, u.tenth_year, u.twelfth_percentage, u.twelfth_board,
        u.twelfth_year, u.diploma_or_pu,
        d.name as department_name, d.code as department_code, m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [session.user_id]);

    if (!user) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }

    // 4. Generate fresh 15-minute Access Token & extend sliding window refresh token
    const newAccessToken = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      mentor_id: user.mentor_id,
      roll_no: user.roll_no,
      semester: user.semester,
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    });

    // Update session table with rotated refresh token and renewed 7-day expiration
    const extendedExpiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    await executeRun(
      'UPDATE user_sessions SET refresh_token = ?, expires_at = ? WHERE id = ?',
      [newRefreshToken, extendedExpiresAt, session.id]
    );

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Enterprise Logout Endpoint:
 * Blacklists Access Token & Revokes Refresh Token Session
 */
router.post('/logout', async (req: AuthenticatedRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    let accessToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    }
    const { refreshToken } = req.body;

    // 1. Blacklist access token
    if (accessToken) {
      await blacklistToken(accessToken);
    }

    // 2. Revoke refresh session
    if (refreshToken) {
      await executeRun('UPDATE user_sessions SET is_revoked = 1 WHERE refresh_token = ?', [refreshToken]);
    }

    res.json({ success: true, message: 'Logged out successfully. Tokens revoked.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
