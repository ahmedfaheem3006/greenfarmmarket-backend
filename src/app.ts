import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { PrismaClient } from '@prisma/client';

import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import diagnosisRoutes from './routes/diagnosis.routes';
import productRoutes from './routes/product.routes';
import transportRoutes from './routes/transport.routes';
import jobRoutes from './routes/job.routes';
import newsRoutes from './routes/news.routes';
import contactRoutes from './routes/contact.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const prisma = new PrismaClient();

// Security Headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Production-ready CORS Configuration
const allowedOrigins = [
  'https://greenfarmmarket.com',
  'https://www.greenfarmmarket.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

if (env.FRONTEND_URL && !allowedOrigins.includes(env.FRONTEND_URL)) {
  allowedOrigins.push(env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, health checks, curl, Postman, or requests without Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS Policy: Origin ${origin} is not allowed.`));
    },
    credentials: true,
  })
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'تم تجاوز حد الطلبات المسموح به. يرجى المحاولة لاحقاً.' },
});
app.use('/api', limiter);

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Media (Multer local directory)
app.use('/uploads', express.static(path.resolve(__dirname, '../', env.UPLOAD_DIR)));

// Production Health Check Endpoint with Database Connectivity Check
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'DISCONNECTED';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'CONNECTED';
  } catch {
    dbStatus = 'DISCONNECTED';
  }

  const isHealthy = dbStatus === 'CONNECTED';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    app: 'Green Farm Market API',
    environment: env.NODE_ENV,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
