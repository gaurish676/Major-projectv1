import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { seedDatabase } from './server/db/seed';

import authRoutes from './server/routes/auth.routes';
import schemaRoutes from './server/routes/schema.routes';
import submissionRoutes from './server/routes/submission.routes';
import studentRoutes from './server/routes/student.routes';
import mentorRoutes from './server/routes/mentor.routes';
import hodRoutes from './server/routes/hod.routes';
import eventRoutes from './server/routes/event.routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB and Seeds
  await seedDatabase();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Static uploads serving for uploaded PDF / certificate images
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir, {
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
  app.use('/api/schema', schemaRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api/mentor', mentorRoutes);
  app.use('/api/hod', hodRoutes);
  app.use('/api/events', eventRoutes);

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
    console.log(`Student Activity Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
});
