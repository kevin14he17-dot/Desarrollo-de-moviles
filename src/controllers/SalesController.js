import SalesService from '../services/SalesService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';
import { normalizeBDResponse } from '../utils/normalizeResponse.js';

export class SalesController {
  // POST /api/sales - Crear venta
  static createSale = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      cashDrawerId, 
      items, 
      subtotal, 
      tax, 
      total, 
      paidAmount,
      change,
      paymentMethods,
      paymentMethod,  // Soporte para formato singular (tests)
      amountPaid,     // Alias para paidAmount
      discount        // Descuento (para cálculos)
    } = req.body;

     // Normalizar items - convertir cantidad a cantidad y price a precioUnitario
     let normalizedItems = items;
     if (items && Array.isArray(items) && items.length > 0) {
       normalizedItems = items.map(item => ({
         productId: item.productId,
         cantidad: item.quantity || item.cantidad,
         precioUnitario: item.price || item.precioUnitario
       }));
     }

    // Calcular subtotal si no se proporciona
    let finalSubtotal = subtotal;
    if (!finalSubtotal && normalizedItems) {
      finalSubtotal = normalizedItems.reduce((sum, item) => 
        sum + (item.cantidad * item.precioUnitario), 0
      );
    }

    // Usar tax=0 si no se proporciona
    let finalTax = tax || 0;

    // Calcular total si no se proporciona
    let finalTotal = total;
    if (!finalTotal) {
      finalTotal = (finalSubtotal || 0) - (discount || 0) + finalTax;
    }

    // Normalizar paymentMethod a paymentMethods si es necesario
    let normalizedPaymentMethods = paymentMethods;
    if (!normalizedPaymentMethods && paymentMethod) {
      normalizedPaymentMethods = [
        {
          metodo: paymentMethod.toUpperCase(),
          monto: amountPaid || paidAmount || finalTotal
        }
      ];
    }

      // Asegurar que paymentMethods sea un array
      if (!normalizedPaymentMethods) {
        normalizedPaymentMethods = [];
      }

      const result = await SalesService.createSale({
      cashDrawerId,
      items: normalizedItems,
      subtotal: finalSubtotal,
      tax: finalTax,
      total: finalTotal,
      paidAmount: amountPaid || paidAmount || finalTotal,
      change: change || 0,
      paymentMethods: normalizedPaymentMethods,
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  });

  // GET /api/sales/:id - Obtener venta con detalles
  static getSaleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await SalesService.getSaleById(parseInt(id));

    res.status(200).json({
      success: true,
      data: normalizeBDResponse(result)
    });
  });

  // GET /api/sales - Listar ventas
  static listSales = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      pageSize = 50, 
      cashDrawerId, 
      userId, 
      state, 
      fechaDesde, 
      fechaHasta 
    } = req.query;

    const filters = {
      cashDrawerId: cashDrawerId ? parseInt(cashDrawerId) : null,
      userId: userId ? parseInt(userId) : null,
      state,
      fechaDesde,
      fechaHasta
    };

     const result = await SalesService.listSales(
      filters,
      parseInt(page),
      parseInt(pageSize)
    );

    res.status(200).json({
      success: true,
      data: normalizeBDResponse(result.data),
      pagination: result.pagination
    });
  });

  // DELETE /api/sales/:id - Anular venta (solo Admin)
  static cancelSale = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await SalesService.cancelSale(parseInt(id), req.user.userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  });
}

export default SalesController;
