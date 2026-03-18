import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class InventoryService {
  // Obtener inventario actual
  async getCurrentInventory(filters = {}, page = 1, pageSize = 50) {
    let whereClause = 'WHERE p.is_active = 1';
    const params = [];

    if (filters.categoryId) {
      whereClause += ' AND p.category_id = ?';
      params.push(filters.categoryId);
    }

    if (filters.searchTerm) {
      whereClause += ' AND (p.product_name LIKE ? OR p.barcode LIKE ?)';
      const searchTerm = `%${filters.searchTerm}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.stockCritico) {
      whereClause += ' AND p.stock_actual <= p.stock_minimo';
    }

    // Obtener total de registros
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );
    const total = countResult.recordset[0].total;

    // Obtener datos paginados
    const pageParams = [...params, pageSize, (page - 1) * pageSize];
    const result = await executeQuery(
      `SELECT 
        p.product_id,
        p.barcode,
        p.product_name,
        c.category_name,
        p.cost_price,
        p.selling_price,
        p.stock_actual,
        p.stock_minimo,
        CASE 
          WHEN p.stock_actual <= p.stock_minimo THEN 'CRÍTICO'
          WHEN p.stock_actual <= (p.stock_minimo * 1.5) THEN 'BAJO'
          ELSE 'NORMAL'
        END AS stock_status,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      ${whereClause}
      ORDER BY p.product_name ASC
      LIMIT ? OFFSET ?`,
      pageParams
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

  // Registrar entrada de mercadería
  async registerEntrada(entradaData) {
    const { productId, cantidad, proveedor, userId, observaciones } = entradaData;

    // Validar que el producto exista
    const product = await executeQuery(
      'SELECT * FROM products WHERE product_id = ?',
      [productId]
    );

    if (product.recordset.length === 0) {
      throw new AppError('Producto no encontrado', 404);
    }

    const prod = product.recordset[0];
    const stockAnterior = prod.stock_actual;
    const stockActual = stockAnterior + cantidad;

    try {
      // Actualizar stock del producto
      await executeQuery(
        `UPDATE products 
         SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = ?`,
        [stockActual, productId]
      );

      // Registrar en kardex - Nota: Ajusta según el esquema real de la tabla kardex
      const result = await executeQuery(
        `INSERT INTO kardex 
         (product_id, tipo_movimiento, cantidad, motivo_cambio, stock_anterior, stock_actual, user_id, proveedor, observaciones)
         VALUES (?, 'ENTRADA', ?, 'Compra', ?, ?, ?, ?, ?)`,
        [productId, cantidad, stockAnterior, stockActual, userId, proveedor, observaciones]
      );

      // Obtener ID insertado
      const idResult = await executeQuery('SELECT LAST_INSERT_ID() as kardex_id');
      const kardexId = idResult.recordset[0].kardex_id;

      return {
        kardexId,
        productId,
        mensaje: 'Entrada registrada exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  // Registrar salida de mercadería
  async registerSalida(salidaData) {
    const { productId, cantidad, motivo, responsable, userId, observaciones } = salidaData;

    // Validar que el producto exista
    const product = await executeQuery(
      'SELECT * FROM products WHERE product_id = ?',
      [productId]
    );

    if (product.recordset.length === 0) {
      throw new AppError('Producto no encontrado', 404);
    }

    const prod = product.recordset[0];
    const stockAnterior = prod.stock_actual;

    if (stockAnterior < cantidad) {
      throw new AppError(`Stock insuficiente. Disponible: ${stockAnterior}`, 400);
    }

    const stockActual = stockAnterior - cantidad;

    try {
      // Actualizar stock del producto
      await executeQuery(
        `UPDATE products 
         SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = ?`,
        [stockActual, productId]
      );

      // Registrar en kardex
      const result = await executeQuery(
        `INSERT INTO kardex 
         (product_id, tipo_movimiento, cantidad, motivo_cambio, stock_anterior, stock_actual, user_id, responsable, observaciones)
         VALUES (?, 'SALIDA', ?, ?, ?, ?, ?, ?, ?)`,
        [productId, cantidad, motivo, stockAnterior, stockActual, userId, responsable, observaciones]
      );

      // Obtener ID insertado
      const idResult = await executeQuery('SELECT LAST_INSERT_ID() as kardex_id');
      const kardexId = idResult.recordset[0].kardex_id;

      return {
        kardexId,
        productId,
        mensaje: 'Salida registrada exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener historial de movimientos (kardex)
  async getKardexHistory(filters = {}, page = 1, pageSize = 50) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.productId) {
      whereClause += ' AND k.product_id = ?';
      params.push(filters.productId);
    }

    if (filters.tipoMovimiento) {
      whereClause += ' AND k.tipo_movimiento = ?';
      params.push(filters.tipoMovimiento);
    }

    if (filters.fechaDesde) {
      whereClause += ' AND k.created_at >= ?';
      params.push(filters.fechaDesde);
    }

    if (filters.fechaHasta) {
      whereClause += ' AND k.created_at <= ?';
      params.push(filters.fechaHasta);
    }

    // Obtener total
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM kardex k ${whereClause}`,
      params
    );
    const total = countResult.recordset[0].total;

    // Obtener datos
    const dataParams = [...params, pageSize, (page - 1) * pageSize];
    const result = await executeQuery(
      `SELECT 
        k.kardex_id,
        k.product_id,
        p.product_name,
        p.barcode,
        k.tipo_movimiento,
        k.cantidad,
        k.motivo_cambio,
        k.stock_anterior,
        k.stock_actual,
        u.full_name as usuario,
        k.proveedor,
        k.responsable,
        k.created_at,
        k.observaciones
      FROM kardex k
      INNER JOIN products p ON k.product_id = p.product_id
      INNER JOIN users u ON k.user_id = u.user_id
      ${whereClause}
      ORDER BY k.created_at DESC
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

  // Obtener productos con stock crítico
  async getStockCritico() {
    const result = await executeQuery(
      `SELECT 
        p.product_id,
        p.barcode,
        p.product_name,
        c.category_name,
        p.stock_actual,
        p.stock_minimo,
        (p.stock_minimo - p.stock_actual) as faltan_unidades
      FROM products p
      INNER JOIN categories c ON p.category_id = c.category_id
      WHERE p.stock_actual <= p.stock_minimo AND p.is_active = 1
      ORDER BY (p.stock_minimo - p.stock_actual) DESC`
    );

    return result.recordset;
  }

  // Obtener valor total de inventario (FIFO)
  async getInventoryValue() {
    const result = await executeQuery(
      `SELECT 
        SUM(p.stock_actual * p.cost_price) as costo_total,
        SUM(p.stock_actual * p.selling_price) as valor_venta,
        COUNT(*) as total_productos,
        SUM(p.stock_actual) as total_unidades
      FROM products p
      WHERE p.is_active = 1`
    );

    return result.recordset[0];
  }
}

export default new InventoryService();
