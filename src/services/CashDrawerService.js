import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class CashDrawerService {
  // Abrir caja
  async openCashDrawer(userId, montoInicial) {
    // Verificar si hay caja abierta del mismo usuario en el día
    const existingCash = await executeQuery(
      `SELECT cash_drawer_id FROM cash_drawer 
       WHERE user_id = ? AND state = 'ABIERTA' 
       AND DATE(fecha_apertura) = DATE(CURRENT_TIMESTAMP)`,
      [userId]
    );

    if (existingCash.recordset.length > 0) {
      throw new AppError('Ya existe una caja abierta para este usuario hoy', 400);
    }

    // Insertar nueva caja
    const result = await executeQuery(
      `INSERT INTO cash_drawer (user_id, fecha_apertura, monto_inicial, state)
       VALUES (?, CURRENT_TIMESTAMP, ?, 'ABIERTA')`,
      [userId, montoInicial]
    );

    // Obtener ID insertado
    const idResult = await executeQuery('SELECT LAST_INSERT_ID() as cash_drawer_id');
    
    return {
      cashDrawerId: idResult.recordset[0].cash_drawer_id,
      message: 'Caja abierta exitosamente'
    };
  }

  // Obtener caja actual abierta del usuario
  async getCurrentOpenCash(userId) {
    const result = await executeQuery(
      `SELECT * FROM cash_drawer 
       WHERE user_id = ? AND state = 'ABIERTA' 
       AND DATE(fecha_apertura) = DATE(CURRENT_TIMESTAMP)`,
      [userId]
    );

    if (result.recordset.length === 0) {
      throw new AppError('No hay caja abierta para este usuario', 404);
    }

    return result.recordset[0];
  }

  // Agregar movimiento a caja
  async addMovement(cashDrawerId, tipoMovimiento, monto, motivo, userId) {
    // Validar que la caja existe y está abierta
    const cash = await executeQuery(
      'SELECT * FROM cash_drawer WHERE cash_drawer_id = ? AND state = ?',
      [cashDrawerId, 'ABIERTA']
    );

    if (cash.recordset.length === 0) {
      throw new AppError('Caja no encontrada o no está abierta', 404);
    }

    if (tipoMovimiento === 'EGRESO') {
      const totalActual = (cash.recordset[0].monto_efectivo || 0) + 
                         (cash.recordset[0].monto_tarjeta || 0) + 
                         (cash.recordset[0].monto_qr || 0);
      
      if (totalActual < monto) {
        throw new AppError(`Fondos insuficientes. Disponible: ${totalActual}`, 400);
      }
    }

    // Insertar movimiento
    const result = await executeQuery(
      `INSERT INTO cash_movements (cash_drawer_id, tipo_movimiento, monto, motivo, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [cashDrawerId, tipoMovimiento, monto, motivo, userId]
    );

    // Obtener ID insertado
    const idResult = await executeQuery('SELECT LAST_INSERT_ID() as cash_movement_id');

    return {
      movementId: idResult.recordset[0].cash_movement_id,
      message: 'Movimiento registrado'
    };
  }

  // Cerrar caja (Arqueo)
  async closeCashDrawer(cashDrawerId, userData) {
    const { montoEfectivo, montoTarjeta, montoQR, observaciones } = userData;

    // Valores numéricos con fallback 0
    const montoEfectivoNum = parseFloat(montoEfectivo || 0) || 0;
    const montoTarjetaNum  = parseFloat(montoTarjeta  || 0) || 0;
    const montoQRNum       = parseFloat(montoQR       || 0) || 0;

    // Obtener datos actuales de caja
    const cash = await executeQuery(
      `SELECT cd.*, u.full_name FROM cash_drawer cd
       LEFT JOIN users u ON cd.user_id = u.user_id
       WHERE cd.cash_drawer_id = ?`,
      [cashDrawerId]
    );

    if (cash.recordset.length === 0) {
      throw new AppError('Caja no encontrada', 404);
    }

    const cajaDatos = cash.recordset[0];

    if (cajaDatos.state !== 'ABIERTA') {
      throw new AppError('La caja ya está cerrada', 400);
    }

    // Obtener total de ventas del día
    const ventas = await executeQuery(
      `SELECT 
        COALESCE(SUM(CASE WHEN pm.metodo_pago = 'EFECTIVO' THEN pm.monto ELSE 0 END), 0) as total_efectivo,
        COALESCE(SUM(CASE WHEN pm.metodo_pago IN ('YAPE', 'PLIN') THEN pm.monto ELSE 0 END), 0) as total_qr,
        COALESCE(SUM(CASE WHEN pm.metodo_pago = 'TARJETA' THEN pm.monto ELSE 0 END), 0) as total_tarjeta,
        COALESCE(SUM(s.total), 0) as total_ventas
       FROM sales s
       LEFT JOIN payment_methods pm ON s.sale_id = pm.sale_id
       WHERE s.cash_drawer_id = ? AND s.state = 'COMPLETADA'`,
      [cashDrawerId]
    );

    const ventasDatos = ventas.recordset[0];

    // Calcular totales esperados
    const montoEsperado = cajaDatos.monto_inicial + ventasDatos.total_ventas;
    const montoReal = montoEfectivoNum + montoTarjetaNum + montoQRNum;
    const diferencia = montoReal - montoEsperado;

    try {
      // Cerrar caja
      await executeQuery(
        `UPDATE cash_drawer 
         SET state = 'CERRADA',
             fecha_cierre = CURRENT_TIMESTAMP,
             monto_cierre = ?,
             monto_efectivo = ?,
             monto_tarjeta = ?,
             monto_qr = ?,
             diferencia = ?,
             observaciones = ?
         WHERE cash_drawer_id = ?`,
        [montoReal, montoEfectivoNum, montoTarjetaNum, montoQRNum, diferencia, observaciones, cashDrawerId]
      );

      return {
        cashDrawerId,
        montoInicial: cajaDatos.monto_inicial,
        totalVentas: ventasDatos.total_ventas,
        detalleVentas: {
          efectivo: ventasDatos.total_efectivo,
          qr: ventasDatos.total_qr,
          tarjeta: ventasDatos.total_tarjeta
        },
        montoEsperado,
        montoReal,
        diferencia,
        estado: diferencia === 0 ? 'CUADRADO' : (diferencia > 0 ? 'FALTANTE' : 'SOBRANTE'),
        message: 'Caja cerrada correctamente'
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener historial de cajas
  async getCashDrawerHistory(filters = {}, page = 1, pageSize = 50) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.userId) {
      whereClause += ' AND cd.user_id = ?';
      params.push(filters.userId);
    }

    if (filters.state) {
      whereClause += ' AND cd.state = ?';
      params.push(filters.state);
    }

    if (filters.fechaDesde) {
      whereClause += ' AND DATE(cd.fecha_apertura) >= ?';
      params.push(filters.fechaDesde);
    }

    // Obtener total
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM cash_drawer cd ${whereClause}`,
      params
    );
    const total = countResult.recordset[0].total;

    // Obtener datos
    const dataParams = [...params, pageSize, (page - 1) * pageSize];
    const result = await executeQuery(
      `SELECT 
        cd.cash_drawer_id,
        u.full_name as cajero,
        cd.fecha_apertura,
        cd.monto_inicial,
        cd.monto_efectivo,
        cd.monto_tarjeta,
        cd.monto_qr,
        (cd.monto_efectivo + cd.monto_tarjeta + cd.monto_qr) as monto_cierre,
        cd.state,
        cd.fecha_cierre,
        cd.diferencia,
        cd.observaciones
       FROM cash_drawer cd
       LEFT JOIN users u ON cd.user_id = u.user_id
       ${whereClause}
       ORDER BY cd.fecha_apertura DESC
       LIMIT ? OFFSET ?`,
      dataParams
    );

    return {
      data: result.recordset,
      pagination: {
        total,
        pageSize,
        pageNumber: page,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // Obtener resumen de caja actual
  async getCashSummary(cashDrawerId) {
    const result = await executeQuery(
      `SELECT 
        cd.cash_drawer_id,
        u.full_name as cajero,
        cd.fecha_apertura,
        cd.monto_inicial,
        COALESCE(SUM(CASE WHEN cm.tipo_movimiento = 'INGRESO' THEN cm.monto ELSE 0 END), 0) as total_ingresos,
        COALESCE(SUM(CASE WHEN cm.tipo_movimiento = 'EGRESO' THEN cm.monto ELSE 0 END), 0) as total_egresos,
        COALESCE(SUM(s.total), 0) as total_ventas,
        cd.state
       FROM cash_drawer cd
       LEFT JOIN users u ON cd.user_id = u.user_id
       LEFT JOIN cash_movements cm ON cd.cash_drawer_id = cm.cash_drawer_id
       LEFT JOIN sales s ON cd.cash_drawer_id = s.cash_drawer_id AND s.state = 'COMPLETADA'
       WHERE cd.cash_drawer_id = ?
       GROUP BY cd.cash_drawer_id, u.full_name, cd.fecha_apertura, cd.monto_inicial, cd.state`,
      [cashDrawerId]
    );

    if (result.recordset.length === 0) {
      throw new AppError('Caja no encontrada', 404);
    }

    return result.recordset[0];
  }
}

export default new CashDrawerService();
