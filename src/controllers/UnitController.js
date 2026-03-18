import UnitService from '../services/UnitService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class UnitController {
  // GET /api/units - Obtener todas las unidades de medida
  static getUnits = asyncHandler(async (req, res) => {
    const result = await UnitService.getUnits();

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  });

  // GET /api/units/:id - Obtener una unidad por ID
  static getUnitById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await UnitService.getUnitById(parseInt(id));

    res.status(200).json({
      success: true,
      data: result
    });
  });

  // GET /api/units/type/:unitType - Obtener unidades por tipo (QUANTITY, WEIGHT, VOLUME)
  static getUnitsByType = asyncHandler(async (req, res) => {
    const { unitType } = req.params;

    const result = await UnitService.getUnitsByType(unitType);

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  });
}

export default UnitController;
