import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class SalesService {
  // Crear venta (transacción)
  async createSale(saleData) {
    const { 
      cashDrawerId, 
      items,     // Array de { productId, cantidad, precioUnitario }
      subtotal, 
      tax, 
      total,
      paidAmount,
      change,
      paymentMethods,  // Array de { metodo, monto, referencia }
      userId
    } = saleData;

    // Determinar cashDrawerId - si no se proporciona, buscar la caja abierta del usuario
    let activeCashDrawerId = cashDrawerId;
    if (!activeCashDrawerId) {
      const currentCash = await executeQuery(
        'SELECT cash_drawer_id FROM cash_drawer WHERE user_id = ? AND state = ? ORDER BY fecha_apertura DESC LIMIT 1',
        [userId, 'ABIERTA']
      );
      
      if (currentCash.recordset.length > 0) {
        activeCashDrawerId = currentCash.recordset[0].cash_drawer_id;
      } else {
        // Crear caja automáticamente si no existe
        const result = await executeQuery(
          `INSERT INTO cash_drawer (user_id, fecha_apertura, monto_inicial, state)
           VALUES (?, CURRENT_TIMESTAMP, 0, 'ABIERTA')`,
          [userId]
        );
        
        const idResult = await executeQuery('SELECT LAST_INSERT_ID() as cash_drawer_id');
        activeCashDrawerId = idResult.recordset[0].cash_drawer_id;
      }
    }

    // Validar caja
    const cash = await executeQuery(
      'SELECT * FROM cash_drawer WHERE cash_drawer_id = ? AND state = ?',
      [activeCashDrawerId, 'ABIERTA']
    );

    if (cash.recordset.length === 0) {
      throw new AppError('Caja no encontrada o no está abierta', 404);
    }

    // Validar productos y stock
    for (const item of items) {
      const product = await executeQuery(
        'SELECT stock_actual FROM products WHERE product_id = ?',
        [item.productId]
      );

      if (product.recordset.length === 0) {
        throw new AppError(`Producto ${item.productId} no encontrado`, 404);
      }

      if (product.recordset[0].stock_actual < item.cantidad) {
        throw new AppError(
          `Stock insuficiente para producto ${item.productId}. Disponible: ${product.recordset[0].stock_actual}`,
          400
        );
      }
    }

     try {
       // 1. Insertar venta
       const saleResult = await executeQuery(
         `INSERT INTO sales (cash_drawer_id, user_id, fecha_venta, subtotal, tax, total, paid_amount, change_amount, state)
          VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 'COMPLETADA')`,
         [activeCashDrawerId, saleData.userId, subtotal, tax, total, paidAmount, change]
       );

       // Obtener ID de la venta desde el resultado del INSERT
       let saleId = saleResult.insertId;
       
       // Si insertId no está disponible, intentar obtenerlo de otra forma
       // Usar una transacción simulada: buscar la venta más reciente por timestamp + params
       if (!saleId || saleId === 0) {
         const idResult = await executeQuery(
           `SELECT sale_id FROM sales 
            WHERE cash_drawer_id = ? AND user_id = ? 
            ORDER BY fecha_venta DESC, sale_id DESC LIMIT 1`,
           [activeCashDrawerId, saleData.userId]
         );
         
         if (idResult.recordset && idResult.recordset.length > 0) {
           saleId = idResult.recordset[0].sale_id;
         } else {
           throw new AppError('No se pudo obtener el ID de la venta insertada', 500);
         }
       }

      // 2. Insertar detalles de venta y actualizar stock
      for (const item of items) {
        // Insertar detalle
        await executeQuery(
          `INSERT INTO sale_details (sale_id, product_id, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, item.productId, item.cantidad, item.precioUnitario, item.cantidad * item.precioUnitario]
        );

        // Actualizar stock
        const currentProduct = await executeQuery(
          'SELECT stock_actual FROM products WHERE product_id = ?',
          [item.productId]
        );

        const newStock = currentProduct.recordset[0].stock_actual - item.cantidad;

        await executeQuery(
          `UPDATE products 
           SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = ?`,
          [newStock, item.productId]
        );

        // Registrar en kardex
        await executeQuery(
          `INSERT INTO kardex 
           (product_id, tipo_movimiento, cantidad, motivo_cambio, stock_anterior, stock_actual, user_id)
           VALUES (?, 'VENTA', ?, 'Venta', ?, ?, ?)`,
          [item.productId, item.cantidad, currentProduct.recordset[0].stock_actual, newStock, saleData.userId]
        );
      }

       // 3. Registrar métodos de pago
       if (paymentMethods && Array.isArray(paymentMethods) && paymentMethods.length > 0) {
         for (const payment of paymentMethods) {
           await executeQuery(
             `INSERT INTO payment_methods (sale_id, metodo_pago, monto, referencia_pago)
              VALUES (?, ?, ?, ?)`,
             [saleId, payment.metodo, payment.monto, payment.referencia || null]
           );
         }
       }

       // 4. Actualizar montos en la caja
       await executeQuery(
         `UPDATE cash_drawer
          SET monto_efectivo = monto_efectivo + 
                COALESCE((SELECT SUM(monto) FROM payment_methods WHERE sale_id = ? AND metodo_pago = 'EFECTIVO'), 0),
              monto_tarjeta = monto_tarjeta + 
                COALESCE((SELECT SUM(monto) FROM payment_methods WHERE sale_id = ? AND metodo_pago = 'TARJETA'), 0),
              monto_qr = monto_qr + 
                COALESCE((SELECT SUM(monto) FROM payment_methods WHERE sale_id = ? AND metodo_pago IN ('YAPE', 'PLIN')), 0)
          WHERE cash_drawer_id = ?`,
         [saleId, saleId, saleId, activeCashDrawerId]
       );

      return {
        saleId,
        message: 'Venta registrada exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener venta con detalles
  async getSaleById(saleId) {
    const result = await executeQuery(
      `SELECT 
        s.*,
        u.full_name as cajero
       FROM sales s
       INNER JOIN users u ON s.user_id = u.user_id
       WHERE s.sale_id = ?`,
      [saleId]
    );

    if (result.recordset.length === 0) {
      throw new AppError('Venta no encontrada', 404);
    }

    const sale = result.recordset[0];

    // Obtener detalles
    const details = await executeQuery(
      `SELECT sd.*, p.product_name, p.barcode
       FROM sale_details sd
       INNER JOIN products p ON sd.product_id = p.product_id
       WHERE sd.sale_id = ? AND sd.is_deleted = 0`,
      [saleId]
    );

    // Obtener métodos de pago
    const payments = await executeQuery(
      'SELECT * FROM payment_methods WHERE sale_id = ?',
      [saleId]
    );

    return {
      ...sale,
      detalles: details.recordset,
      metodosPago: payments.recordset
    };
  }

  // Listar ventas
  async listSales(filters = {}, page = 1, pageSize = 50) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.cashDrawerId) {
      whereClause += ' AND s.cash_drawer_id = ?';
      params.push(filters.cashDrawerId);
    }

    if (filters.userId) {
      whereClause += ' AND s.user_id = ?';
      params.push(filters.userId);
    }

    if (filters.state) {
      whereClause += ' AND s.state = ?';
      params.push(filters.state);
    }

    if (filters.fechaDesde) {
      whereClause += ' AND DATE(s.fecha_venta) >= ?';
      params.push(filters.fechaDesde);
    }

    if (filters.fechaHasta) {
      whereClause += ' AND DATE(s.fecha_venta) <= ?';
      params.push(filters.fechaHasta);
    }

    // Obtener total
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM sales s ${whereClause}`,
      params
    );
    const total = countResult.recordset[0].total;

    // Obtener datos
    const dataParams = [...params, pageSize, (page - 1) * pageSize];
    const result = await executeQuery(
      `SELECT 
        s.sale_id,
        s.fecha_venta,
        u.full_name as cajero,
        s.subtotal,
        s.tax,
        s.total,
        s.state,
        COUNT(sd.sale_detail_id) as total_items
       FROM sales s
       INNER JOIN users u ON s.user_id = u.user_id
       LEFT JOIN sale_details sd ON s.sale_id = sd.sale_id
       ${whereClause}
       GROUP BY s.sale_id, s.fecha_venta, u.full_name, s.subtotal, s.tax, s.total, s.state
       ORDER BY s.fecha_venta DESC
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

  // Anular venta (solo Admin)
  async cancelSale(saleId, adminId) {
    const sale = await this.getSaleById(saleId);

    if (sale.state === 'ANULADA') {
      throw new AppError('La venta ya está anulada', 400);
    }

    try {
      // 1. Actualizar estado de venta
      await executeQuery(
        `UPDATE sales
         SET state = 'ANULADA', anulada_en = CURRENT_TIMESTAMP, anulada_por = ?
         WHERE sale_id = ?`,
        [adminId, saleId]
      );

      // 2. Revertir stock
      for (const detalle of sale.detalles) {
        const currentProduct = await executeQuery(
          'SELECT stock_actual FROM products WHERE product_id = ?',
          [detalle.product_id]
        );

        const newStock = currentProduct.recordset[0].stock_actual + detalle.cantidad;

        await executeQuery(
          `UPDATE products 
           SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = ?`,
          [newStock, detalle.product_id]
        );

        // Registrar en kardex la reversión
        await executeQuery(
          `INSERT INTO kardex 
           (product_id, tipo_movimiento, cantidad, motivo_cambio, stock_anterior, stock_actual, user_id)
           VALUES (?, 'DEVOLUCION', ?, 'Anulación de venta', ?, ?, ?)`,
          [detalle.product_id, detalle.cantidad, currentProduct.recordset[0].stock_actual, newStock, adminId]
        );
      }

      return {
        saleId,
        message: 'Venta anulada exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new SalesService();
