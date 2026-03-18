import express from 'express';
import InventoryController from '../controllers/InventoryController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { entradaValidator, salidaValidator } from '../validators/inventoryValidator.js';

const router = express.Router();

// Aplicar autenticación en todas las rutas
router.use(authMiddleware);

// GET - Obtener inventario actual (stock)
router.get('/stock', InventoryController.getInventory);

// GET - Obtener historial de movimientos (Kardex)
router.get('/kardex', InventoryController.getKardexHistory);

// GET - Obtener productos con stock crítico
router.get('/critico', InventoryController.getStockCritico);

// GET - Obtener valor total del inventario
router.get('/valor', InventoryController.getInventoryValue);

// POST - Registrar entrada de mercadería (Admin, Gerente)
router.post('/entrada', requireRole('Administrador', 'Gerente'), entradaValidator, InventoryController.registerEntrada);

// POST - Registrar salida de mercadería (Admin, Gerente)
router.post('/salida', requireRole('Administrador', 'Gerente'), salidaValidator, InventoryController.registerSalida);

export default router;
