import express from 'express';
import CashDrawerController from '../controllers/CashDrawerController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { 
  openCashDrawerValidator, 
  addMovementValidator, 
  closeCashDrawerValidator 
} from '../validators/cashDrawerValidator.js';

const router = express.Router();

// Aplicar autenticación en todas las rutas
router.use(authMiddleware);

// POST - Abrir caja (Cajero, Admin, Gerente)
router.post('/open', requireRole('Cajero', 'Administrador', 'Gerente'), openCashDrawerValidator, CashDrawerController.openCashDrawer);

// GET - Obtener caja actual abierta
router.get('/current', CashDrawerController.getCurrentCashDrawer);

// POST - Agregar movimiento de caja
router.post('/movements', addMovementValidator, CashDrawerController.addMovement);

// GET - Obtener movimientos de caja
router.get('/movements', CashDrawerController.getCashDrawerHistory);

// POST - Cerrar caja (Cajero, Admin, Gerente)
router.post('/close', closeCashDrawerValidator, CashDrawerController.closeCashDrawer);

// GET - Obtener historial de cajas (Admin, Gerente)
router.get('/history', requireRole('Administrador', 'Gerente'), CashDrawerController.getCashDrawerHistory);

// GET - Obtener resumen de caja específica
router.get('/:cashDrawerId/summary', CashDrawerController.getCashSummary);

export default router;
