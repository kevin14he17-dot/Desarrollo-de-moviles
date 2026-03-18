import CashDrawerService from '../services/CashDrawerService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';
import { normalizeBDResponse } from '../utils/normalizeResponse.js';

export class CashDrawerController {
  // POST /api/cash-drawer/open - Abrir caja
  static openCashDrawer = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { montoInicial } = req.body;

    const result = await CashDrawerService.openCashDrawer(req.user.userId, montoInicial);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  });

  // GET /api/cash-drawer/current - Obtener caja actual abierta
  static getCurrentCashDrawer = asyncHandler(async (req, res) => {
    const result = await CashDrawerService.getCurrentOpenCash(req.user.userId);

    const summary = await CashDrawerService.getCashSummary(result.cash_drawer_id);

    res.status(200).json({
      success: true,
      data: {
        ...normalizeBDResponse(result),
        summary: normalizeBDResponse(summary)
      }
    });
  });

  // POST /api/cash-drawer/movement - Agregar movimiento de caja
  static addMovement = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { cashDrawerId, tipoMovimiento, monto, motivo } = req.body;

    const result = await CashDrawerService.addMovement(
      cashDrawerId,
      tipoMovimiento,
      monto,
      motivo,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  });

  // POST /api/cash-drawer/close - Cerrar caja
  static closeCashDrawer = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { cashDrawerId, montoEfectivo, montoTarjeta, montoQR, observaciones } = req.body;

    const result = await CashDrawerService.closeCashDrawer(cashDrawerId, {
      montoEfectivo,
      montoTarjeta,
      montoQR,
      observaciones
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  });

  // GET /api/cash-drawer/history - Obtener historial de cajas
  static getCashDrawerHistory = asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 50, userId, state, fechaDesde } = req.query;

    const filters = {
      userId: userId ? parseInt(userId) : null,
      state,
      fechaDesde
    };

     const result = await CashDrawerService.getCashDrawerHistory(
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

  // GET /api/cash-drawer/:cashDrawerId/summary - Obtener resumen de caja específica
  static getCashSummary = asyncHandler(async (req, res) => {
    const { cashDrawerId } = req.params;

    const result = await CashDrawerService.getCashSummary(parseInt(cashDrawerId));

    res.status(200).json({
      success: true,
      data: normalizeBDResponse(result)
    });
  });
}

export default CashDrawerController;
