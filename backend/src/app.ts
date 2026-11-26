import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import chainRoutes from './routes/chain.routes';
import dashboardRoutes from './routes/dashboard.routes';
import deliveryRoutes from './routes/delivery.routes';
import employeeRoutes from './routes/employee.routes';
import factoryRoutes from './routes/factory.routes';
import farmRoutes from './routes/farm.routes';
import financeRoutes from './routes/finance.routes';
import gameEngineRoutes from './routes/gameEngine.routes';
import healthRoutes from './routes/health.routes';
import inventoryRoutes from './routes/inventory.routes';
import mallRoutes from './routes/mall.routes';
import productionRoutes from './routes/production.routes';
import progressionRoutes from './routes/progression.routes';
import restaurantRoutes from './routes/restaurant.routes';
import supermarketRoutes from './routes/supermarket.routes';
import upgradeRoutes from './routes/upgrade.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: env.security.rateLimitWindowMs,
    max: env.security.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestLogger);

app.use('/api/v1', healthRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chain', chainRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/factories', factoryRoutes);
app.use('/api/v1/farm', farmRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/game', gameEngineRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/malls', mallRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/progression', progressionRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/supermarkets', supermarketRoutes);
app.use('/api/v1/upgrades', upgradeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
