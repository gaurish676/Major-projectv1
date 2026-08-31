import { Router, Response } from 'express';
import { queryAll, queryOne } from '../db/database';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

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
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      ORDER BY 
        CASE u.role 
          WHEN 'hod' THEN 1 
          WHEN 'mentor' THEN 2 
          WHEN 'student' THEN 3 
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
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [userId]);

    if (!user && (userId === 'usr_dev' || userId === 'dev')) {
      const { executeRun } = await import('../db/database');
      await executeRun(`
        INSERT OR IGNORE INTO users (id, name, email, password_hash, role, department_id, mentor_id, cgpa, semester, roll_no, avatar)
        VALUES ('usr_dev', 'System Developer Ops', 'dev@university.edu', 'password123', 'developer', 'dept_cse', NULL, NULL, NULL, 'EMP-DEV-000', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80')
      `);
      user = await queryOne(`
        SELECT u.id, u.name, u.email, u.role, u.department_id, u.cgpa, u.semester, u.roll_no, u.avatar, d.name as department_name, d.code as department_code
        FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = 'usr_dev'
      `);
    }

    if (!user) {
      res.status(404).json({ error: 'Persona not found' });
      return;
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    });

    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Standard Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const cleanInput = email.trim().toLowerCase();

    // Map common demo aliases to seeded accounts
    let lookupEmail = cleanInput;
    if (cleanInput.includes('rahul') || cleanInput === 'student') {
      lookupEmail = 'rahul@university.edu';
    } else if (cleanInput.includes('ramesh') || cleanInput.includes('ravi') || cleanInput === 'mentor') {
      lookupEmail = 'ravi@university.edu';
    } else if (cleanInput.includes('sharma') || cleanInput.includes('hod')) {
      lookupEmail = 'hod@university.edu';
    } else if (cleanInput.includes('dev') || cleanInput.includes('developer')) {
      lookupEmail = 'dev@university.edu';
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
      if (cleanInput.includes('student')) {
        user = await queryOne(`SELECT u.*, d.name as department_name, d.code as department_code FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = 'student' LIMIT 1`);
      } else if (cleanInput.includes('mentor')) {
        user = await queryOne(`SELECT u.*, d.name as department_name, d.code as department_code FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = 'mentor' LIMIT 1`);
      } else if (cleanInput.includes('hod')) {
        user = await queryOne(`SELECT u.*, d.name as department_name, d.code as department_code FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = 'hod' LIMIT 1`);
      } else if (cleanInput.includes('dev') || cleanInput.includes('developer')) {
        const { executeRun } = await import('../db/database');
        await executeRun(`
          INSERT OR IGNORE INTO users (id, name, email, password_hash, role, department_id, mentor_id, cgpa, semester, roll_no, avatar)
          VALUES ('usr_dev', 'System Developer Ops', 'dev@university.edu', 'password123', 'developer', 'dept_cse', NULL, NULL, NULL, 'EMP-DEV-000', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80')
        `);
        user = await queryOne(`SELECT u.*, d.name as department_name, d.code as department_code FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = 'developer' OR u.id = 'usr_dev' LIMIT 1`);
      }
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials or account not found' });
      return;
    }

    if (password && user.password_hash && user.password_hash !== password && user.password_hash !== 'password123' && password !== 'password123' && password !== 'demo123') {
      res.status(401).json({ error: 'Incorrect password entered' });
      return;
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    });

    const { password_hash, ...userProfile } = user;
    res.json({ token, user: userProfile });
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
    const passwordHash = (password && password.trim()) ? password.trim() : 'password123';

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
      role === 'student' ? 0 : null,
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
        d.name as department_name,
        d.code as department_code,
        m.name as mentor_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.mentor_id = m.id
      WHERE u.id = ?
    `, [userId]);

    const token = generateToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department_id: newUser.department_id,
    });

    res.status(201).json({ token, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
