import ProductService from '../services/ProductService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';
import { normalizeBDResponse } from '../utils/normalizeResponse.js';

export class ProductController {
  // GET /api/products - Obtener listado de productos con paginación y filtros
  static getProducts = asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 50, categoryId, unitId, searchTerm } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

     const result = await ProductService.getProducts(
      skip,
      take,
      categoryId ? parseInt(categoryId) : null,
      unitId ? parseInt(unitId) : null,
      searchTerm
    );

    res.status(200).json({
      success: true,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      count: result.length,
      data: normalizeBDResponse(result)
    });
  });

  // GET /api/products/:id - Obtener un producto por ID
  static getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await ProductService.getProductById(parseInt(id));

    res.status(200).json({
      success: true,
      data: normalizeBDResponse(result)
    });
  });

  // POST /api/products - Crear nuevo producto
  static createProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
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
    } = req.body;

    const result = await ProductService.createProduct({
      barcode,
      productName,
      categoryId: parseInt(categoryId),
      unitId: unitId ? parseInt(unitId) : 1,
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      stockActual: stockActual ? parseInt(stockActual) : 0,
      stockMinimo: stockMinimo ? parseInt(stockMinimo) : 5,
      stockMaximo: stockMaximo ? parseInt(stockMaximo) : 999,
      quantityPerUnit: quantityPerUnit ? parseInt(quantityPerUnit) : 1
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: result
    });
  });

  // PUT /api/products/:id - Actualizar producto completo
  static updateProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const {
      productName,
      categoryId,
      unitId,
      costPrice,
      sellingPrice,
      stockMinimo,
      stockMaximo,
      quantityPerUnit
    } = req.body;

    const updateData = {};

    if (productName) updateData.productName = productName;
    if (categoryId) updateData.categoryId = parseInt(categoryId);
    if (unitId) updateData.unitId = parseInt(unitId);
    if (costPrice !== undefined) updateData.costPrice = parseFloat(costPrice);
    if (sellingPrice !== undefined) updateData.sellingPrice = parseFloat(sellingPrice);
    if (stockMinimo !== undefined) updateData.stockMinimo = parseInt(stockMinimo);
    if (stockMaximo !== undefined) updateData.stockMaximo = parseInt(stockMaximo);
    if (quantityPerUnit !== undefined) updateData.quantityPerUnit = parseInt(quantityPerUnit);

     const result = await ProductService.updateProduct(parseInt(id), updateData);

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: normalizeBDResponse(result)
    });
  });

  // PATCH /api/products/:id/prices - Actualizar solo los precios
  static updateProductPrices = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { costPrice, sellingPrice } = req.body;

    const result = await ProductService.updateProductPrices(
      parseInt(id),
      parseFloat(costPrice),
      parseFloat(sellingPrice)
     );

    res.status(200).json({
      success: true,
      message: 'Precios actualizados exitosamente',
      data: normalizeBDResponse(result)
    });
  });

  // PATCH /api/products/:id/stock - Actualizar stock
  static updateProductStock = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { stock } = req.body;

    const result = await ProductService.updateProductStock(parseInt(id), parseInt(stock));

    res.status(200).json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: normalizeBDResponse(result)
    });
  });

  // DELETE /api/products/:id - Eliminar producto (soft delete)
  static deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await ProductService.deleteProduct(parseInt(id));

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  });

  // GET /api/products/low-stock - Obtener productos con stock bajo
  static getLowStockProducts = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const result = await ProductService.getLowStockProducts(parseInt(limit));

    res.status(200).json({
      success: true,
      count: result.length,
      data: normalizeBDResponse(result)
    });
  });

  // POST /api/products/:id/image - Subir imagen del producto
  static uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen' });
    }
    const BASE = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      message: 'Imagen actualizada correctamente',
      data: { url: `${BASE}/uploads/products/${req.params.id}.png` }
    });
  });
}

export default ProductController;
