import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();
const dashboardController = new DashboardController();

router.get('/', authenticateJWT, dashboardController.getDashboard);
router.post('/notifications/read-all', authenticateJWT, dashboardController.markNotificationsRead);

export default router;
