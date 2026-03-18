import { executeQuery } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class ProductService {
  /**
   * Obtener todos los productos con paginación y filtros
   */
  async getProducts(skip = 0, take = 10, categoryId = null, unitId = null, searchTerm = null) {
    try {
      let query = `
        SELECT 
          p.product_id,
          p.barcode,
          p.product_name,
          p.category_id,
          c.category_name,
          p.unit_id,
          u.unit_code,
          u.unit_name,
          p.cost_price,
          p.selling_price,
          p.stock_actual,
          p.stock_minimo,
          p.stock_maximo,
          p.quantity_per_unit,
          p.created_at,
          p.updated_at,
          p.is_active
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN units u ON p.unit_id = u.unit_id
        WHERE p.is_active = TRUE
      `;

      const params = [];

      if (categoryId) {
        query += ` AND p.category_id = ?`;
        params.push(categoryId);
      }

      if (unitId) {
        query += ` AND p.unit_id = ?`;
        params.push(unitId);
      }

      if (searchTerm) {
        query += ` AND (p.product_name LIKE ? OR p.barcode LIKE ?)`;
        params.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      query += ` ORDER BY p.product_name ASC LIMIT ? OFFSET ?`;
      params.push(take, skip);

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener un producto por ID
   */
  async getProductById(productId) {
    try {
      const query = `
        SELECT 
          p.product_id,
          p.barcode,
          p.product_name,
          p.category_id,
          c.category_name,
          p.unit_id,
          u.unit_code,
          u.unit_name,
          u.unit_type,
          u.conversion_factor,
          p.cost_price,
          p.selling_price,
          p.stock_actual,
          p.stock_minimo,
          p.stock_maximo,
          p.quantity_per_unit,
          p.created_at,
          p.updated_at,
          p.is_active
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN units u ON p.unit_id = u.unit_id
        WHERE p.product_id = ? AND p.is_active = TRUE
      `;

      const result = await executeQuery(query, [productId]);

      if (result.recordset.length === 0) {
        throw new AppError('Producto no encontrado', 404);
      }

      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener producto por barcode
   */
  async getProductByBarcode(barcode) {
    try {
      const query = `
        SELECT 
          p.product_id,
          p.barcode,
          p.product_name,
          p.category_id,
          c.category_name,
          p.unit_id,
          u.unit_code,
          u.unit_name,
          p.cost_price,
          p.selling_price,
          p.stock_actual,
          p.stock_minimo,
          p.stock_maximo,
          p.quantity_per_unit,
          p.is_active
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN units u ON p.unit_id = u.unit_id
        WHERE p.barcode = ? AND p.is_active = TRUE
      `;

      const result = await executeQuery(query, [barcode]);
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear nuevo producto
   */
  async createProduct(productData) {
    const {
      barcode,
      productName,
      categoryId,
      unitId = 1, // Default: Unidad
      costPrice,
      sellingPrice,
      stockActual = 0,
      stockMinimo = 5,
      stockMaximo = 999,
      quantityPerUnit = 1
    } = productData;

    // Validar campos requeridos
    if (!barcode || !productName || !categoryId || !costPrice || !sellingPrice) {
      throw new AppError('Faltan campos requeridos: barcode, productName, categoryId, costPrice, sellingPrice', 400);
    }

    // Validar que barcode sea único
    const existingProduct = await this.getProductByBarcode(barcode);
    if (existingProduct) {
      throw new AppError('Ya existe un producto con este código de barras', 400);
    }

    // Validar que categoria exista
    const categoryCheck = await executeQuery('SELECT category_id FROM categories WHERE category_id = ?', [categoryId]);
    if (categoryCheck.recordset.length === 0) {
      throw new AppError('Categoría no encontrada', 404);
    }

    // Validar que unidad exista
    const unitCheck = await executeQuery('SELECT unit_id FROM units WHERE unit_id = ?', [unitId]);
    if (unitCheck.recordset.length === 0) {
      throw new AppError('Unidad de medida no encontrada', 404);
    }

    // Validar lógica de precios
    if (sellingPrice < costPrice) {
      throw new AppError('El precio de venta debe ser mayor al costo', 400);
    }

    try {
      const query = `
        INSERT INTO products (
          barcode, product_name, category_id, unit_id, 
          cost_price, selling_price, stock_actual, stock_minimo, 
          stock_maximo, quantity_per_unit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        barcode,
        productName,
        categoryId,
        unitId,
        costPrice,
        sellingPrice,
        stockActual,
        stockMinimo,
        stockMaximo,
        quantityPerUnit
      ];

      await executeQuery(query, params);

      // Retornar el producto creado
      return await this.getProductByBarcode(barcode);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar producto
   */
  async updateProduct(productId, updateData) {
    const product = await this.getProductById(productId);

    const {
      productName = product.product_name,
      categoryId = product.category_id,
      unitId = product.unit_id,
      costPrice = product.cost_price,
      sellingPrice = product.selling_price,
      stockMinimo = product.stock_minimo,
      stockMaximo = product.stock_maximo,
      quantityPerUnit = product.quantity_per_unit
    } = updateData;

    // Validar lógica de precios
    if (sellingPrice < costPrice) {
      throw new AppError('El precio de venta debe ser mayor al costo', 400);
    }

    try {
      const query = `
        UPDATE products SET
          product_name = ?,
          category_id = ?,
          unit_id = ?,
          cost_price = ?,
          selling_price = ?,
          stock_minimo = ?,
          stock_maximo = ?,
          quantity_per_unit = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `;

      const params = [
        productName,
        categoryId,
        unitId,
        costPrice,
        sellingPrice,
        stockMinimo,
        stockMaximo,
        quantityPerUnit,
        productId
      ];

      await executeQuery(query, params);

      return await this.getProductById(productId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar precios de un producto
   */
  async updateProductPrices(productId, costPrice, sellingPrice) {
    const product = await this.getProductById(productId);

    if (sellingPrice < costPrice) {
      throw new AppError('El precio de venta debe ser mayor al costo', 400);
    }

    try {
      const query = `
        UPDATE products SET
          cost_price = ?,
          selling_price = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `;

      await executeQuery(query, [costPrice, sellingPrice, productId]);

      return await this.getProductById(productId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar stock de un producto
   */
  async updateProductStock(productId, newStock) {
    const product = await this.getProductById(productId);

    if (newStock < 0) {
      throw new AppError('El stock no puede ser negativo', 400);
    }

    try {
      const query = `
        UPDATE products SET
          stock_actual = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `;

      await executeQuery(query, [newStock, productId]);

      return await this.getProductById(productId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar producto (soft delete)
   */
  async deleteProduct(productId) {
    const product = await this.getProductById(productId);

    try {
      const query = `
        UPDATE products SET
          is_active = FALSE,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `;

      await executeQuery(query, [productId]);

      return { success: true, message: 'Producto eliminado correctamente' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener productos con stock crítico
   */
  async getLowStockProducts(limit = 10) {
    try {
      const query = `
        SELECT 
          p.product_id,
          p.barcode,
          p.product_name,
          c.category_name,
          u.unit_name,
          p.stock_actual,
          p.stock_minimo,
          p.stock_maximo,
          p.selling_price,
          (p.stock_minimo - p.stock_actual) as unidades_faltantes
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN units u ON p.unit_id = u.unit_id
        WHERE p.is_active = TRUE AND p.stock_actual <= p.stock_minimo
        ORDER BY unidades_faltantes DESC
        LIMIT ?
      `;

      const result = await executeQuery(query, [limit]);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener valor total del inventario
   */
  async getInventoryValue() {
    try {
      const query = `
        SELECT 
          SUM(p.stock_actual * p.cost_price) as costo_total,
          SUM(p.stock_actual * p.selling_price) as valor_venta_total,
          COUNT(p.product_id) as total_productos,
          SUM(p.stock_actual) as total_unidades
        FROM products p
        WHERE p.is_active = TRUE
      `;

      const result = await executeQuery(query, []);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }
}

export default new ProductService();
