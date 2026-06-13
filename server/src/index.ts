import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorMiddleware } from './shared/middlewares/error.middleware.js';
import { requestLogger } from './shared/middlewares/request-logger.middleware.js';
import authRoutes from './modules/auth/routes/auth.routes.js';
import clientRoutes from './modules/clients/routes/client.routes.js';
import creditRoutes from './modules/credits/routes/credit.routes.js';
import paymentRoutes from './modules/payments/routes/payment.routes.js';
import dashboardRoutes from './modules/dashboard/routes/dashboard.routes.js';
import activityRoutes from './modules/activity/routes/activity.routes.js';

const app = express();

const corsOptions = {
  origin: [env.corsOrigin, 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser(env.jwtSecret));
app.use(requestLogger);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', activityRoutes);

app.use(errorMiddleware);

app.listen(env.port, () => {
  console.log(`[SERVER] Kredio API running on port ${env.port} (${env.nodeEnv})`);
});

export default app;
