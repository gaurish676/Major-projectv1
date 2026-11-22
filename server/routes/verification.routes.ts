import { Router, Response, Request } from 'express';
import QRCode from 'qrcode';
import { queryOne } from '../db/database';
import { publicVerifyLimiter } from '../middleware/rateLimiter';

const router = Router();

// 1. Public Credential Verification Endpoint (Scanned from QR Code) with rate limiting
router.get('/:credentialId', publicVerifyLimiter, async (req: Request, res: Response) => {
  try {
    const { credentialId } = req.params;
    const cleanId = credentialId.trim();

    // Search by credential_hash, submission id, or wildcard
    const submission = await queryOne(`
      SELECT 
        s.*,
        u.name as student_name,
        u.roll_no as student_roll_no,
        u.semester as student_semester,
        d.name as department_name,
        d.code as department_code,
        sch.activity_name as schema_activity_name,
        sch.base_points,
        c.name as category_name,
        c.color as category_color,
        m.name as reviewer_name,
        m.designation as reviewer_designation
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN departments d ON u.department_id = d.id
      JOIN activity_schema sch ON s.schema_id = sch.id
      JOIN schema_categories c ON s.category_id = c.id
      LEFT JOIN users m ON s.reviewed_by = m.id
      WHERE s.credential_hash = ? OR s.id = ?
    `, [cleanId, cleanId]);

    if (!submission) {
      res.status(404).json({
        valid: false,
        error: 'Credential Record Not Found in University Ledger',
        searched_id: cleanId,
        verification_status: 'UNVERIFIED',
      });
      return;
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const verificationUrl = `${baseUrl}/verify/${submission.credential_hash || submission.id}`;
    const qrSvg = await QRCode.toString(verificationUrl, {
      type: 'svg',
      width: 200,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    });

    res.json({
      valid: submission.status === 'approved',
      credential_id: submission.credential_hash || `CRD-${submission.id}`,
      verification_status: submission.status === 'approved' ? 'OFFICIALLY VERIFIED ✓' : 'PENDING APPROVAL',
      student: {
        name: submission.student_name,
        roll_no: submission.student_roll_no,
        department: submission.department_name,
        semester: submission.semester || submission.student_semester,
      },
      activity: {
        title: submission.activity_title,
        category: submission.category_name,
        points_awarded: submission.points_awarded,
        hours_spent: submission.hours_spent || 40,
        completion_date: submission.completion_date,
        has_verified_proof: Boolean(submission.file_url),
      },
      audit: {
        reviewed_by: submission.reviewer_name || 'Department Faculty Mentor',
        reviewer_designation: submission.reviewer_designation || 'Faculty Mentor',
        reviewed_at: submission.reviewed_at || submission.submitted_at,
        mentor_feedback: submission.mentor_feedback,
        institutional_seal: 'Autonomous University Examination & Accreditation Authority',
      },
      verification_url: verificationUrl,
      qr_svg: qrSvg,
      server_timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Direct QR Code SVG stream for any submission or text with rate limiting
router.get('/:credentialId/qr.svg', publicVerifyLimiter, async (req: Request, res: Response) => {
  try {
    const { credentialId } = req.params;
    const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const url = `${baseUrl}/verify/${credentialId}`;
    const qrSvg = await QRCode.toString(url, {
      type: 'svg',
      width: 256,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(qrSvg);
  } catch (err: any) {
    res.status(500).send('Failed to generate QR code');
  }
});

export default router;
