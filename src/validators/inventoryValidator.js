import { body } from 'express-validator';

export const entradaValidator = [
  body('productId')
    .notEmpty()
    .withMessage('ProductID requerido')
    .isInt({ min: 1 })
    .withMessage('ProductID debe ser un número válido'),
  
  body('cantidad')
    .notEmpty()
    .withMessage('Cantidad requerida')
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número positivo'),
  
  body('proveedor')
    .notEmpty()
    .withMessage('Proveedor requerido')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Proveedor debe tener al menos 3 caracteres'),
  
  body('observaciones')
    .optional()
    .trim()
];

export const salidaValidator = [
  body('productId')
    .notEmpty()
    .withMessage('ProductID requerido')
    .isInt({ min: 1 })
    .withMessage('ProductID debe ser un número válido'),
  
  body('cantidad')
    .notEmpty()
    .withMessage('Cantidad requerida')
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número positivo'),
  
  body('motivo')
    .notEmpty()
    .withMessage('Motivo requerido')
    .isIn(['Merma', 'Vencimiento', 'Pérdida', 'Ajuste', 'Devolución'])
    .withMessage('Motivo inválido'),
  
  body('responsable')
    .notEmpty()
    .withMessage('Responsable requerido')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Responsable debe tener al menos 3 caracteres'),
  
  body('observaciones')
    .optional()
    .trim()
];
