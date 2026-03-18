import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class UnitService {
  /**
   * Obtener todas las unidades de medida
   */
  async getUnits() {
    try {
      const query = `
        SELECT 
          unit_id,
          unit_code,
          unit_name,
          unit_type,
          conversion_factor,
          created_at
        FROM units
        ORDER BY unit_code ASC
      `;

      const result = await executeQuery(query, []);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener una unidad por ID
   */
  async getUnitById(unitId) {
    try {
      const query = `
        SELECT 
          unit_id,
          unit_code,
          unit_name,
          unit_type,
          conversion_factor,
          created_at
        FROM units
        WHERE unit_id = ?
      `;

      const result = await executeQuery(query, [unitId]);

      if (result.recordset.length === 0) {
        throw new AppError('Unidad de medida no encontrada', 404);
      }

      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener unidades por tipo (QUANTITY, WEIGHT, VOLUME)
   */
  async getUnitsByType(unitType) {
    try {
      const query = `
        SELECT 
          unit_id,
          unit_code,
          unit_name,
          unit_type,
          conversion_factor,
          created_at
        FROM units
        WHERE unit_type = ?
        ORDER BY unit_code ASC
      `;

      const result = await executeQuery(query, [unitType]);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }
}

export default new UnitService();
