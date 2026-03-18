import express from 'express';
import SalesController from '../controllers/SalesController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { createSaleValidator } from '../validators/salesValidator.js';

const router = express.Router();

// Aplicar autenticación en todas las rutas
router.use(authMiddleware);

// GET - Listar ventas (cualquier usuario autenticado)
router.get('/', SalesController.listSales);

// POST - Crear venta (Cajero, Admin, Gerente)
router.post('/', requireRole('Cajero', 'Administrador', 'Gerente'), createSaleValidator, SalesController.createSale);

// GET - Obtener venta específica con detalles
router.get('/:id', SalesController.getSaleById);

// DELETE - Anular venta (solo Admin)
router.delete('/:id', requireRole('Administrador'), SalesController.cancelSale);

export default router;
