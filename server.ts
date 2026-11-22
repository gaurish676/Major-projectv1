import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { seedDatabase } from './server/db/seed';
import { queryOne } from './server/db/database';
import { aiAuditQueue } from './server/workers/aiAuditWorker';

import authRoutes from './server/routes/auth.routes';
import schemaRoutes from './server/routes/schema.routes';
import submissionRoutes from './server/routes/submission.routes';
import studentRoutes from './server/routes/student.routes';
import mentorRoutes from './server/routes/mentor.routes';
import hodRoutes from './server/routes/hod.routes';
import eventRoutes from './server/routes/event.routes';
import notificationRoutes from './server/routes/notification.routes';
import logisysRoutes from './server/routes/logisys.routes';
import joylinRoutes from './server/routes/joylin.routes';
import placementRoutes from './server/routes/placement.routes';
import counselingRoutes from './server/routes/counseling.routes';
import deanRoutes from './server/routes/dean.routes';
import verificationRoutes from './server/routes/verification.routes';
import rulebookRoutes from './server/routes/rulebook.routes';
import evidenceRoutes from './server/routes/evidence.routes';
import taskRoutes from './server/routes/task.routes';
import academicMessagesRoutes from './server/routes/academic_messages.routes';
import { initTaskTable } from './server/db/taskDb';
import { authenticate } from './server/middleware/auth';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize DB and Seeds
  await seedDatabase();
  await aiAuditQueue.recoverPendingJobs();
  initTaskTable();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Protected static uploads serving: requires valid JWT token via Authorization header or ?token= query parameter
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', authenticate, express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      }
    }
  }));

  // Health API check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/evidence', evidenceRoutes);
  app.use('/api/schema', schemaRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api/mentor', mentorRoutes);
  app.use('/api/hod', hodRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/logisys', logisysRoutes);
  app.use('/api/joylin', joylinRoutes);
  app.use('/api/placement', placementRoutes);
  app.use('/api/counseling', counselingRoutes);
  app.use('/api/dean', deanRoutes);
  app.use('/api/verify', verificationRoutes);
  app.use('/api/rulebook', rulebookRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/academic-messages', academicMessagesRoutes);
  
  // Development: Vite Middleware / Production: Static Files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Creditz Prototype v2 (Student Activity & Mentorship Portal) running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
});
