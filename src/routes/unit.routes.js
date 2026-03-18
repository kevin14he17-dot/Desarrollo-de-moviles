import express from 'express';
import UnitController from '../controllers/UnitController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación en todas las rutas
router.use(authMiddleware);

// GET - Obtener todas las unidades de medida
router.get('/', UnitController.getUnits);

// GET - Obtener unidades por tipo (QUANTITY, WEIGHT, VOLUME)
router.get('/type/:unitType', UnitController.getUnitsByType);

// GET - Obtener una unidad por ID
router.get('/:id', UnitController.getUnitById);

export default router;
