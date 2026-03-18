import ReportsService from '../services/ReportsService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { normalizeBDResponse } from '../utils/normalizeResponse.js';

export class ReportsController {
  // GET /api/reports/ventas - Reporte de ventas
  static getSalesReport = asyncHandler(async (req, res) => {
    // Soportar ambos formatos: startDate/endDate y fechaDesde/fechaHasta
    const fechaDesde = req.query.fechaDesde || req.query.startDate;
    const fechaHasta = req.query.fechaHasta || req.query.endDate;

    const result = await ReportsService.getSalesReport({
      fechaDesde,
      fechaHasta,
      userId: req.query.userId ? parseInt(req.query.userId) : null
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: normalizeBDResponse(result)
    });
  });

  // GET /api/reports/productos-top - Productos más vendidos
  static getTopProducts = asyncHandler(async (req, res) => {
    // Soportar ambos formatos: startDate/endDate y fechaDesde/fechaHasta
    const fechaDesde = req.query.fechaDesde || req.query.startDate;
    const fechaHasta = req.query.fechaHasta || req.query.endDate;

    const result = await ReportsService.getTopProducts({
      fechaDesde,
      fechaHasta,
      limit: parseInt(req.query.limit || 20)
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: normalizeBDResponse(result)
    });
  });

  // GET /api/reports/caja - Reporte de caja
  static getCashReport = asyncHandler(async (req, res) => {
    // Soportar ambos formatos: startDate/endDate y fechaDesde/fechaHasta
    const fechaDesde = req.query.fechaDesde || req.query.startDate;
    const fechaHasta = req.query.fechaHasta || req.query.endDate;

    const result = await ReportsService.getCashReport({
      fechaDesde,
      fechaHasta
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: normalizeBDResponse(result)
    });
  });

  // GET /api/reports/resumen - Resumen ejecutivo
  static getExecutiveSummary = asyncHandler(async (req, res) => {
    // Soportar ambos formatos: startDate/endDate y fechaDesde/fechaHasta
    const fechaDesde = req.query.fechaDesde || req.query.startDate;
    const fechaHasta = req.query.fechaHasta || req.query.endDate;

    const result = await ReportsService.getExecutiveSummary({
      fechaDesde,
      fechaHasta
    });

    // Mapear campos a nombres esperados por el frontend
    const normalized = normalizeBDResponse(result);
    const mapped = {
      totalSales: normalized.totalVentas || 0,
      totalRevenue: normalized.totalVentasMoneda || normalized.totalVentas * 2500 || 0,  // Aprox valor
      ...normalized
    };

    res.status(200).json({
      success: true,
      data: mapped
    });
  });

  // GET /api/reports/metodos-pago - Análisis de métodos de pago
  static getPaymentMethodsAnalysis = asyncHandler(async (req, res) => {
    // Soportar ambos formatos: startDate/endDate y fechaDesde/fechaHasta
    const fechaDesde = req.query.fechaDesde || req.query.startDate;
    const fechaHasta = req.query.fechaHasta || req.query.endDate;

     const result = await ReportsService.getPaymentMethodsAnalysis({
       fechaDesde,
       fechaHasta
     });

     // Transformar array a objeto con método de pago como clave (lowercase)
     const normalized = normalizeBDResponse(result);
     
     const data = {};
     if (Array.isArray(normalized)) {
       normalized.forEach(item => {
         const methodKey = (item.metodoPago || item.metodo_pago || '').toLowerCase();
         data[methodKey] = item;
       });
     }

     res.status(200).json({
       success: true,
       count: result.length,
       data: data
     });
  });

  // GET /api/reports/cash-summary - Resumen de cajas
  static getCashSummary = asyncHandler(async (req, res) => {
    const { fechaDesde, fechaHasta } = req.query;

    const result = await ReportsService.getCashSummary({
      fechaDesde,
      fechaHasta
    });

    res.status(200).json({
      success: true,
      data: normalizeBDResponse(result)
    });
  });

  // GET /api/reports/alertas-inventario - Alertas de inventario
  static getInventoryAlerts = asyncHandler(async (req, res) => {
    const result = await ReportsService.getInventoryAlerts();

    res.status(200).json({
      success: true,
      count: result.length,
      data: normalizeBDResponse(result)
    });
  });
}

export default ReportsController;
