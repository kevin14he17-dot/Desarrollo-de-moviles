import express from 'express';
import ReportsController from '../controllers/ReportsController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación en todas las rutas
router.use(authMiddleware);

// Reportes básicos (cualquier usuario autenticado)
router.get('/sales', ReportsController.getSalesReport);
router.get('/products', ReportsController.getTopProducts);
router.get('/cash', ReportsController.getCashReport);
router.get('/payment-methods', ReportsController.getPaymentMethodsAnalysis);
router.get('/alerts', ReportsController.getInventoryAlerts);

// Reporte ejecutivo (solo Admin y Gerente)
router.get('/daily-summary', requireRole('Administrador', 'Gerente'), ReportsController.getExecutiveSummary);

// Alias adicional para compatibilidad
router.get('/cash-summary', ReportsController.getCashSummary);

export default router;
