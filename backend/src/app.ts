import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';

const app: Application = express();

// Security & parsing
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving images to the frontend
  })
);
app.use(
  cors({
    origin: env.clientUrls,
    credentials: true,
  })
);
// Larger limit because images are sent/stored as base64 data URLs
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));
app.use(cookieParser());

if (!env.isProd) {
  app.use(morgan('dev'));
}

// Rate limiting (basic)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// (Image uploads are stored as base64 in the database — no static file serving needed)

// API routes
app.use(env.apiPrefix, routes);

// Root
app.get('/', (_req, res) => {
  res.json({
    name: 'Cooking Recipe Recommendation System API',
    version: '1.0.0',
    docs: `${env.apiPrefix}/health`,
  });
});

// 404 + error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
