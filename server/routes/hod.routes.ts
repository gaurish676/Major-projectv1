import { Router, Response } from 'express';
import { queryAll, queryOne, executeRun } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// 1. HOD Department Command Center Overview
router.get('/dashboard', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hod = await queryOne(`
      SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [req.user!.id]);

    // Student aggregate metrics
    const studentStats = await queryAll(`
      SELECT 
        u.id,
        u.name,
        COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as approved_points
      FROM users u
      LEFT JOIN submissions s ON s.student_id = u.id
      WHERE u.role = 'student' AND u.department_id = ?
      GROUP BY u.id
    `, [req.user!.department_id]);

    const totalStudents = studentStats.length;
    const totalMentors = (await queryOne(`
      SELECT COUNT(*) as count FROM users WHERE role = 'mentor' AND department_id = ?
    `, [req.user!.department_id]))?.count || 0;

    let pointsSum = 0;
    let completedCount = 0;
    const milestoneDistribution = {
      diamond: 0, // >= 200
      gold: 0,    // 150-199
      silver: 0,  // 100-149
      bronze: 0,  // 50-99
      started: 0, // 1-49
      none: 0,    // 0
    };

    studentStats.forEach((st) => {
      const pts = Number(st.approved_points);
      pointsSum += pts;
      if (pts >= 200) {
        milestoneDistribution.diamond++;
        completedCount++;
      } else if (pts >= 150) {
        milestoneDistribution.gold++;
      } else if (pts >= 100) {
        milestoneDistribution.silver++;
      } else if (pts >= 50) {
        milestoneDistribution.bronze++;
      } else if (pts > 0) {
        milestoneDistribution.started++;
      } else {
        milestoneDistribution.none++;
      }
    });

    const avgDepartmentPoints = totalStudents > 0 ? Math.round((pointsSum / totalStudents) * 10) / 10 : 0;
    const targetCompletionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 1000) / 10 : 0;

    // Category Distribution of Awarded Points
    const categoryDistribution = await queryAll(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color,
        COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as total_points_awarded,
        COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as submissions_count
      FROM schema_categories c
      LEFT JOIN submissions s ON s.category_id = c.id
      GROUP BY c.id
      ORDER BY total_points_awarded DESC
    `);

    // Mentor Performance & Workload Breakdown
    const mentors = await queryAll(`
      SELECT 
        m.id as mentor_id,
        m.name as mentor_name,
        m.email as mentor_email,
        COUNT(DISTINCT u.id) as mentee_count,
        COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as total_mentee_points,
        COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_reviews
      FROM users m
      LEFT JOIN users u ON u.mentor_id = m.id AND u.role = 'student'
      LEFT JOIN submissions s ON s.student_id = u.id
      WHERE m.role = 'mentor' AND m.department_id = ?
      GROUP BY m.id
      ORDER BY mentee_count DESC, m.name ASC
    `, [req.user!.department_id]);

    const formattedMentors = mentors.map((m) => {
      const cnt = Number(m.mentee_count);
      const pts = Number(m.total_mentee_points);
      return {
        ...m,
        mentee_count: cnt,
        avg_mentee_points: cnt > 0 ? Math.round((pts / cnt) * 10) / 10 : 0,
        pending_reviews: Number(m.pending_reviews),
        approved_reviews: Number(m.approved_reviews),
      };
    });

    // Pending Schema Change Requests
    const pendingSchemaRequests = await queryAll(`
      SELECT 
        r.*,
        u.name as mentor_name,
        u.email as mentor_email,
        c.name as category_name
      FROM schema_requests r
      JOIN users u ON r.mentor_id = u.id
      JOIN schema_categories c ON r.category_id = c.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);

    const totalPendingVerifications = (await queryOne(`
      SELECT COUNT(*) as count FROM submissions WHERE status = 'pending'
    `))?.count || 0;

    res.json({
      hod,
      total_students: totalStudents,
      total_mentors: totalMentors,
      avg_department_points: avgDepartmentPoints,
      target_completion_rate: targetCompletionRate,
      pending_schema_requests_count: pendingSchemaRequests.length,
      total_pending_verifications: totalPendingVerifications,
      category_distribution: categoryDistribution,
      milestone_distribution: milestoneDistribution,
      mentors_performance: formattedMentors,
      pending_schema_requests: pendingSchemaRequests,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Mentee-Mentor Allocation Roster
router.get('/allocations', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const students = await queryAll(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.roll_no, 
        u.semester, 
        u.cgpa, 
        u.mentor_id,
        m.name as mentor_name,
        m.email as mentor_email,
        COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as approved_points,
        COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_submissions
      FROM users u
      LEFT JOIN users m ON u.mentor_id = m.id
      LEFT JOIN submissions s ON s.student_id = u.id
      WHERE u.role = 'student' AND u.department_id = ?
      GROUP BY u.id
      ORDER BY u.roll_no ASC
    `, [req.user!.department_id]);

    const mentors = await queryAll(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.designation,
        u.phone,
        u.office_location,
        COUNT(DISTINCT s.id) as current_mentees_count
      FROM users u
      LEFT JOIN users s ON s.mentor_id = u.id AND s.role = 'student'
      WHERE u.role = 'mentor' AND u.department_id = ?
      GROUP BY u.id
      ORDER BY u.name ASC
    `, [req.user!.department_id]);

    res.json({ students, mentors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2b. Mentors list for HOD with full profile fields
router.get('/mentors', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mentors = await queryAll(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.designation,
        u.phone,
        u.office_location,
        COUNT(DISTINCT s.id) as current_mentees_count
      FROM users u
      LEFT JOIN users s ON s.mentor_id = u.id AND s.role = 'student'
      WHERE u.role = 'mentor' AND u.department_id = ?
      GROUP BY u.id
      ORDER BY u.name ASC
    `, [req.user!.department_id]);

    res.json(mentors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2c. Create a new Faculty Mentor
router.post('/mentors', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, designation, phone, office_location, password } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required for mentor.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if email already exists
    const existing = await queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [cleanEmail]);
    if (existing) {
      res.status(400).json({ error: `User with email ${cleanEmail} already exists.` });
      return;
    }

    const deptId = req.user!.department_id;
    const newId = `usr_mentor_${Date.now()}`;
    const defaultHash = '$2a$10$wEepR0.77XwG5cKzB0jL9uvr7fJ1pWl0gQxV4iVf6Fz6xGv.UaYcy'; // demo123

    await executeRun(`
      INSERT INTO users (id, name, email, password_hash, role, department_id, designation, phone, office_location, avatar)
      VALUES (?, ?, ?, ?, 'mentor', ?, ?, ?, ?, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80')
    `, [
      newId,
      cleanName,
      cleanEmail,
      password ? password : defaultHash,
      deptId,
      designation || 'Assistant Professor',
      phone || null,
      office_location || null,
    ]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'MENTOR_CREATED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Added new faculty mentor ${cleanName} (${cleanEmail})`,
      new Date().toISOString(),
    ]);

    const created = await queryOne('SELECT id, name, email, designation, phone, office_location FROM users WHERE id = ?', [newId]);
    res.status(201).json({ success: true, mentor: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2d. Update an existing Faculty Mentor
router.put('/mentors/:id', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, designation, phone, office_location } = req.body;

    const mentor = await queryOne('SELECT * FROM users WHERE id = ? AND role = "mentor"', [id]);
    if (!mentor) {
      res.status(404).json({ error: 'Mentor not found.' });
      return;
    }

    if (email && email.toLowerCase() !== mentor.email.toLowerCase()) {
      const emailConflict = await queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?', [email.trim().toLowerCase(), id]);
      if (emailConflict) {
        res.status(400).json({ error: 'Email is already in use by another account.' });
        return;
      }
    }

    await executeRun(`
      UPDATE users 
      SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        designation = COALESCE(?, designation),
        phone = COALESCE(?, phone),
        office_location = COALESCE(?, office_location)
      WHERE id = ?
    `, [
      name ? name.trim() : null,
      email ? email.trim().toLowerCase() : null,
      designation ? designation.trim() : null,
      phone ? phone.trim() : null,
      office_location ? office_location.trim() : null,
      id,
    ]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'MENTOR_UPDATED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Updated faculty mentor details for ${name || mentor.name}`,
      new Date().toISOString(),
    ]);

    const updated = await queryOne('SELECT id, name, email, designation, phone, office_location FROM users WHERE id = ?', [id]);
    res.json({ success: true, mentor: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2e. Delete a Faculty Mentor
router.delete('/mentors/:id', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const mentor = await queryOne('SELECT * FROM users WHERE id = ? AND role = "mentor"', [id]);
    if (!mentor) {
      res.status(404).json({ error: 'Mentor not found.' });
      return;
    }

    // Unassign mentees assigned to this mentor
    await executeRun('UPDATE users SET mentor_id = NULL WHERE mentor_id = ?', [id]);

    // Delete mentor user record
    await executeRun('DELETE FROM users WHERE id = ?', [id]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'MENTOR_DELETED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Removed faculty mentor ${mentor.name} (${mentor.email}) and unassigned their mentees.`,
      new Date().toISOString(),
    ]);

    res.json({ success: true, message: `Mentor ${mentor.name} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2f. Create a new Student (Mentee)
router.post('/students', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, roll_no, semester, cgpa, phone, mentor_id } = req.body;
    if (!name || !roll_no || !email) {
      res.status(400).json({ error: 'Name, Roll Number, and Email are required.' });
      return;
    }

    const cleanRoll = roll_no.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check unique roll_no or email
    const existing = await queryOne(
      'SELECT id FROM users WHERE (LOWER(roll_no) = LOWER(?) OR LOWER(email) = LOWER(?))',
      [cleanRoll, cleanEmail]
    );
    if (existing) {
      res.status(400).json({ error: `Student with roll number ${cleanRoll} or email ${cleanEmail} already exists.` });
      return;
    }

    if (mentor_id) {
      const mentor = await queryOne('SELECT id FROM users WHERE id = ? AND role = "mentor"', [mentor_id]);
      if (!mentor) {
        res.status(400).json({ error: 'Selected mentor not found.' });
        return;
      }
    }

    const deptId = req.user!.department_id;
    const newId = `stu_${cleanRoll.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const defaultHash = '$2a$10$wEepR0.77XwG5cKzB0jL9uvr7fJ1pWl0gQxV4iVf6Fz6xGv.UaYcy';

    await executeRun(`
      INSERT INTO users (id, name, email, password_hash, role, department_id, roll_no, semester, cgpa, phone, mentor_id, avatar)
      VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
    `, [
      newId,
      cleanName,
      cleanEmail,
      defaultHash,
      deptId,
      cleanRoll,
      parseInt(semester, 10) || 6,
      parseFloat(cgpa) || 8.0,
      phone ? phone.trim() : null,
      mentor_id || null,
    ]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'STUDENT_CREATED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Enrolled new mentee ${cleanName} (${cleanRoll})`,
      new Date().toISOString(),
    ]);

    const created = await queryOne('SELECT id, name, email, roll_no, semester, cgpa, phone, mentor_id FROM users WHERE id = ?', [newId]);
    res.status(201).json({ success: true, student: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2g. Update an existing Student (Mentee)
router.put('/students/:id', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, roll_no, semester, cgpa, phone, mentor_id } = req.body;

    const student = await queryOne('SELECT * FROM users WHERE id = ? AND role = "student"', [id]);
    if (!student) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    if (roll_no && roll_no.toUpperCase() !== (student.roll_no || '').toUpperCase()) {
      const rollConflict = await queryOne('SELECT id FROM users WHERE LOWER(roll_no) = LOWER(?) AND id != ?', [roll_no.trim(), id]);
      if (rollConflict) {
        res.status(400).json({ error: 'Roll number is already in use by another student.' });
        return;
      }
    }

    if (email && email.toLowerCase() !== student.email.toLowerCase()) {
      const emailConflict = await queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?', [email.trim().toLowerCase(), id]);
      if (emailConflict) {
        res.status(400).json({ error: 'Email is already in use by another user.' });
        return;
      }
    }

    await executeRun(`
      UPDATE users 
      SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        roll_no = COALESCE(?, roll_no),
        semester = COALESCE(?, semester),
        cgpa = COALESCE(?, cgpa),
        phone = COALESCE(?, phone),
        mentor_id = ?
      WHERE id = ?
    `, [
      name ? name.trim() : null,
      email ? email.trim().toLowerCase() : null,
      roll_no ? roll_no.trim().toUpperCase() : null,
      semester !== undefined ? parseInt(semester, 10) : null,
      cgpa !== undefined ? parseFloat(cgpa) : null,
      phone ? phone.trim() : null,
      mentor_id === 'unassign' ? null : (mentor_id !== undefined ? mentor_id : student.mentor_id),
      id,
    ]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'STUDENT_UPDATED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Updated student record for ${name || student.name} (${roll_no || student.roll_no})`,
      new Date().toISOString(),
    ]);

    const updated = await queryOne('SELECT id, name, email, roll_no, semester, cgpa, phone, mentor_id FROM users WHERE id = ?', [id]);
    res.json({ success: true, student: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2h. Delete a Student (Mentee)
router.delete('/students/:id', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await queryOne('SELECT * FROM users WHERE id = ? AND role = "student"', [id]);
    if (!student) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    // Clean up student submissions
    await executeRun('DELETE FROM submissions WHERE student_id = ?', [id]);

    // Delete student user record
    await executeRun('DELETE FROM users WHERE id = ?', [id]);

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'STUDENT_DELETED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Deleted student account ${student.name} (${student.roll_no})`,
      new Date().toISOString(),
    ]);

    res.json({ success: true, message: `Student ${student.name} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Single Allocate endpoint
router.post('/allocate', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { student_id, student_ids, mentor_id } = req.body;
    const targetStudentIds: string[] = student_ids || (student_id ? [student_id] : []);

    if (targetStudentIds.length === 0) {
      res.status(400).json({ error: 'student_id or student_ids required' });
      return;
    }

    const mentor = mentor_id ? await queryOne('SELECT id, name FROM users WHERE id = ? AND role = "mentor"', [mentor_id]) : null;
    if (mentor_id && !mentor) {
      res.status(404).json({ error: 'Selected mentor not found' });
      return;
    }

    const now = new Date().toISOString();
    for (const sId of targetStudentIds) {
      await executeRun('UPDATE users SET mentor_id = ? WHERE id = ?', [mentor_id || null, sId]);
    }

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'MENTOR_ALLOCATION_UPDATED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Reallocated ${targetStudentIds.length} student(s) to mentor ${mentor ? mentor.name : 'Unassigned'}`,
      now,
    ]);

    res.json({ success: true, count: targetStudentIds.length, mentor_name: mentor ? mentor.name : 'Unassigned' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3b. Batch Update Mentor Assignment for Students
router.post('/allocations', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { student_ids, student_id, mentor_id } = req.body;
    const targetStudentIds: string[] = student_ids || (student_id ? [student_id] : []);

    if (targetStudentIds.length === 0) {
      res.status(400).json({ error: 'student_ids must be a non-empty array' });
      return;
    }

    const mentor = mentor_id ? await queryOne('SELECT id, name FROM users WHERE id = ? AND role = "mentor"', [mentor_id]) : null;
    if (mentor_id && !mentor) {
      res.status(404).json({ error: 'Selected mentor not found' });
      return;
    }

    const now = new Date().toISOString();
    for (const sId of targetStudentIds) {
      await executeRun('UPDATE users SET mentor_id = ? WHERE id = ?', [mentor_id || null, sId]);
    }

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'MENTOR_ALLOCATION_UPDATED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Reallocated ${targetStudentIds.length} student(s) to mentor ${mentor ? mentor.name : 'Unassigned'}`,
      now,
    ]);

    res.json({ success: true, count: targetStudentIds.length, mentor_name: mentor ? mentor.name : 'Unassigned' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3c. Batch Import Students via CSV data
router.post('/import-students', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ error: 'students array is required' });
      return;
    }

    const deptId = req.user!.department_id;
    let createdCount = 0;
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.name || (!s.roll_no && !s.email)) continue;

      const rollNo = (s.roll_no || `STU${Date.now().toString().slice(-4)}${i}`).toString().trim().toUpperCase();
      const email = (s.email || `${rollNo.toLowerCase()}@college.edu`).toString().trim().toLowerCase();
      const name = s.name.toString().trim();
      const semester = parseInt(s.semester, 10) || 6;
      const cgpa = parseFloat(s.cgpa) || 8.0;
      const phone = s.phone ? s.phone.toString().trim() : null;

      // Check if student exists by roll_no or email
      const existing = await queryOne(
        'SELECT id FROM users WHERE (roll_no = ? OR email = ?) AND role = "student"',
        [rollNo, email]
      );

      if (existing) {
        await executeRun(`
          UPDATE users 
          SET name = ?, semester = ?, cgpa = ?, phone = COALESCE(?, phone)
          WHERE id = ?
        `, [name, semester, cgpa, phone, existing.id]);
        updatedCount++;
      } else {
        const newId = `stu_${rollNo.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
        await executeRun(`
          INSERT INTO users (id, name, email, password_hash, role, department_id, roll_no, semester, cgpa, phone, avatar)
          VALUES (?, ?, ?, 'student123', 'student', ?, ?, ?, ?, ?, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80')
        `, [newId, name, email, deptId, rollNo, semester, cgpa, phone]);
        createdCount++;
      }
    }

    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'STUDENT_CSV_IMPORTED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Imported student list from CSV (${createdCount} added, ${updatedCount} updated)`,
      now,
    ]);

    res.json({
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: createdCount + updatedCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3d. Smart Auto-Allocate Students to Mentors
router.post('/auto-allocate', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { method = 'balanced', student_ids, only_unallocated = true } = req.body;
    const deptId = req.user!.department_id;

    // 1. Fetch active mentors in department with current mentee counts
    const mentors = await queryAll(`
      SELECT u.id, u.name, u.email, COUNT(DISTINCT s.id) as current_count
      FROM users u
      LEFT JOIN users s ON s.mentor_id = u.id AND s.role = 'student'
      WHERE u.role = 'mentor' AND u.department_id = ?
      GROUP BY u.id
      ORDER BY u.name ASC
    `, [deptId]);

    if (!mentors || mentors.length === 0) {
      res.status(400).json({ error: 'No faculty mentors available in this department for allocation.' });
      return;
    }

    // 2. Fetch candidate students
    let candidateStudents: any[] = [];
    if (Array.isArray(student_ids) && student_ids.length > 0) {
      const placeholders = student_ids.map(() => '?').join(',');
      candidateStudents = await queryAll(`
        SELECT id, name, roll_no, mentor_id 
        FROM users 
        WHERE role = 'student' AND department_id = ? AND id IN (${placeholders})
        ORDER BY roll_no ASC, name ASC
      `, [deptId, ...student_ids]);
    } else if (only_unallocated) {
      candidateStudents = await queryAll(`
        SELECT id, name, roll_no, mentor_id 
        FROM users 
        WHERE role = 'student' AND department_id = ? AND (mentor_id IS NULL OR mentor_id = '')
        ORDER BY roll_no ASC, name ASC
      `, [deptId]);
    } else {
      candidateStudents = await queryAll(`
        SELECT id, name, roll_no, mentor_id 
        FROM users 
        WHERE role = 'student' AND department_id = ?
        ORDER BY roll_no ASC, name ASC
      `, [deptId]);
    }

    if (candidateStudents.length === 0) {
      res.status(400).json({ error: 'No unassigned students found to allocate.' });
      return;
    }

    // Keep track of counts
    const mentorMap = mentors.map((m) => ({
      id: m.id,
      name: m.name,
      count: Number(m.current_count) || 0,
      assignedStudents: [] as string[],
    }));

    const allocationsToSave: { studentId: string; mentorId: string; studentName: string; mentorName: string }[] = [];

    if (method === 'roll_range') {
      // Sort alphabetically by roll_no, divide into equal contiguous chunks
      candidateStudents.sort((a, b) => (a.roll_no || '').localeCompare(b.roll_no || ''));
      const chunkSize = Math.ceil(candidateStudents.length / mentorMap.length);

      candidateStudents.forEach((student, idx) => {
        const mentorIndex = Math.min(Math.floor(idx / chunkSize), mentorMap.length - 1);
        const targetMentor = mentorMap[mentorIndex];
        targetMentor.count++;
        targetMentor.assignedStudents.push(student.name);
        allocationsToSave.push({
          studentId: student.id,
          mentorId: targetMentor.id,
          studentName: student.name,
          mentorName: targetMentor.name,
        });
      });
    } else {
      // Balanced / Load-Balancing: assign each student to the mentor with the fewest total mentees
      for (const student of candidateStudents) {
        // Sort mentors by lowest count
        mentorMap.sort((a, b) => a.count - b.count);
        const targetMentor = mentorMap[0];
        targetMentor.count++;
        targetMentor.assignedStudents.push(student.name);
        allocationsToSave.push({
          studentId: student.id,
          mentorId: targetMentor.id,
          studentName: student.name,
          mentorName: targetMentor.name,
        });
      }
    }

    // Save all allocations to database
    for (const alloc of allocationsToSave) {
      await executeRun('UPDATE users SET mentor_id = ? WHERE id = ?', [alloc.mentorId, alloc.studentId]);
    }

    const now = new Date().toISOString();
    await executeRun(`
      INSERT INTO activity_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'AUTO_ALLOCATION_EXECUTED', ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user!.id,
      `Auto-allocated ${allocationsToSave.length} students across ${mentors.length} faculty mentors using ${method === 'roll_range' ? 'Roll Number Range' : 'Balanced Load Balancing'} algorithm`,
      now,
    ]);

    res.json({
      success: true,
      allocatedCount: allocationsToSave.length,
      method,
      summary: mentorMap.map((m) => ({
        mentor_id: m.id,
        mentor_name: m.name,
        total_mentees: m.count,
        newly_assigned_count: m.assignedStudents.length,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Department-wide Audit & Activity Logs
router.get('/audit-logs', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await queryAll(`
      SELECT 
        l.*,
        u.name as user_name,
        u.role as user_role,
        u.email as user_email
      FROM activity_logs l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Full Department Report Export Data
router.get('/export', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reportData = await queryAll(`
      SELECT 
        u.roll_no,
        u.name as student_name,
        u.email as student_email,
        u.semester,
        u.cgpa,
        m.name as mentor_name,
        COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as total_approved_points,
        CASE 
          WHEN COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) >= 200 THEN 'Completed (Eligible for Degree)'
          ELSE 'In Progress'
        END as status_tier,
        COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_submissions,
        COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_submissions
      FROM users u
      LEFT JOIN users m ON u.mentor_id = m.id
      LEFT JOIN submissions s ON s.student_id = u.id
      WHERE u.role = 'student' AND u.department_id = ?
      GROUP BY u.id
      ORDER BY u.roll_no ASC
    `, [req.user!.department_id]);

    res.json(reportData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Complete Department Compliance & Accreditation Report Dossier
router.get('/reports', authenticate, requireRole(['hod']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const students = await queryAll(`
      SELECT 
        u.id,
        u.roll_no,
        u.name,
        u.email,
        u.semester,
        u.cgpa,
        m.name as mentor_name,
        COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as approved_points
      FROM users u
      LEFT JOIN users m ON u.mentor_id = m.id
      LEFT JOIN submissions s ON s.student_id = u.id
      WHERE u.role = 'student' AND u.department_id = ?
      GROUP BY u.id
      ORDER BY u.roll_no ASC
    `, [req.user!.department_id]);

    const submissions = await queryAll(`
      SELECT 
        s.*,
        u.name as student_name,
        u.roll_no as student_roll_no,
        c.name as category_name,
        c.color as category_color,
        m.name as mentor_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      LEFT JOIN users m ON u.mentor_id = m.id
      LEFT JOIN schema_categories c ON s.category_id = c.id
      WHERE u.department_id = ?
      ORDER BY s.submitted_at DESC
    `, [req.user!.department_id]);

    const clearanceSummary = {
      cleared: 0,
      near_completion: 0,
      in_progress: 0,
      at_risk: 0,
    };

    students.forEach((st) => {
      const pts = Number(st.approved_points || 0);
      if (pts >= 200) {
        clearanceSummary.cleared++;
      } else if (pts >= 150) {
        clearanceSummary.near_completion++;
      } else if (pts >= 50) {
        clearanceSummary.in_progress++;
      } else {
        clearanceSummary.at_risk++;
      }
    });

    res.json({
      students,
      submissions,
      clearance_summary: clearanceSummary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
