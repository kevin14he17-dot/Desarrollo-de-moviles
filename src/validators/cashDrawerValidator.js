import { body } from 'express-validator';

export const openCashDrawerValidator = [
  body('montoInicial')
    .notEmpty()
    .withMessage('Monto inicial requerido')
    .custom(value => !isNaN(parseFloat(value)) && parseFloat(value) >= 0)
    .withMessage('Monto inicial debe ser un número válido y no negativo')
];

export const addMovementValidator = [
  body('cashDrawerId')
    .notEmpty()
    .withMessage('CashDrawerID requerido')
    .isInt({ min: 1 })
    .withMessage('CashDrawerID debe ser un número válido'),
  
  body('tipoMovimiento')
    .notEmpty()
    .withMessage('Tipo de movimiento requerido')
    .isIn(['INGRESO', 'EGRESO'])
    .withMessage('Tipo de movimiento debe ser INGRESO o EGRESO'),
  
  body('monto')
    .notEmpty()
    .withMessage('Monto requerido')
    .isDecimal()
    .withMessage('Monto debe ser un número válido')
    .custom(value => parseFloat(value) > 0)
    .withMessage('Monto debe ser mayor a 0'),
  
  body('motivo')
    .notEmpty()
    .withMessage('Motivo requerido')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Motivo debe tener al menos 5 caracteres')
];

export const closeCashDrawerValidator = [
  body('cashDrawerId')
    .notEmpty()
    .withMessage('CashDrawerID requerido')
    .isInt({ min: 1 })
    .withMessage('CashDrawerID debe ser un número válido'),
  
  body('montoEfectivo')
    .optional({ nullable: true })
    .custom(value => value === undefined || value === null || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0))
    .withMessage('Monto en efectivo debe ser un número válido no negativo'),
  
  body('montoTarjeta')
    .optional({ nullable: true })
    .custom(value => value === undefined || value === null || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0))
    .withMessage('Monto en tarjeta debe ser un número válido no negativo'),
  
  body('montoQR')
    .optional({ nullable: true })
    .custom(value => value === undefined || value === null || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0))
    .withMessage('Monto en QR debe ser un número válido no negativo'),
  
  body('observaciones')
    .optional()
    .trim()
];
