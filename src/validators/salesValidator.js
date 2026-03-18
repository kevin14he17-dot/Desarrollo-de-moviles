import { body } from 'express-validator';

export const createSaleValidator = [
  // CashDrawerID es opcional (se puede crear automáticamente)
  body('cashDrawerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('CashDrawerID debe ser un número válido'),
  
  body('items')
    .notEmpty()
    .withMessage('Items requeridos')
    .isArray({ min: 1 })
    .withMessage('Items debe ser un array con al menos 1 elemento'),
  
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('ProductID debe ser un número válido'),
  
  // Aceptar tanto "cantidad" como "quantity"
  body('items.*.cantidad')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número positivo'),
  
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número positivo'),
  
  // Aceptar tanto "precioUnitario" como "price"
  body('items.*.precioUnitario')
    .optional()
    .isDecimal()
    .withMessage('Precio unitario debe ser un número válido')
    .custom(value => !value || parseFloat(value) > 0)
    .withMessage('Precio unitario debe ser mayor a 0'),
  
  body('items.*.price')
    .optional()
    .isDecimal()
    .withMessage('Precio debe ser un número válido')
    .custom(value => !value || parseFloat(value) > 0)
    .withMessage('Precio debe ser mayor a 0'),
  
  // Todos estos son opcionales - el controlador los calcula si falta
  body('subtotal')
    .optional()
    .isDecimal()
    .withMessage('Subtotal debe ser un número válido'),
  
  body('tax')
    .optional()
    .isDecimal()
    .withMessage('Tax debe ser un número válido'),
  
  body('total')
    .optional()
    .isDecimal()
    .withMessage('Total debe ser un número válido'),
  
  // Aceptar tanto "paidAmount" como "amountPaid"
  body('paidAmount')
    .optional()
    .isDecimal()
    .withMessage('Monto pagado debe ser un número válido'),
  
  body('amountPaid')
    .optional()
    .isDecimal()
    .withMessage('Monto pagado debe ser un número válido'),
  
  body('change')
    .optional()
    .isDecimal()
    .withMessage('Vuelto debe ser un número válido'),
  
  // Aceptar tanto "paymentMethods" (array) como "paymentMethod" (string)
  body('paymentMethods')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Métodos de pago debe ser un array con al menos 1 elemento'),
  
  body('paymentMethods.*.metodo')
    .optional()
    .isIn(['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN'])
    .withMessage('Método de pago inválido'),
  
  body('paymentMethods.*.monto')
    .optional()
    .isDecimal()
    .withMessage('Monto debe ser un número válido'),
  
  body('paymentMethod')
    .optional()
    .trim()
    .custom(value => !value || ['efectivo', 'tarjeta', 'yape', 'plin'].includes(value.toLowerCase()))
    .withMessage('Método de pago inválido'),
  
  // Otros campos opcionales
  body('discount')
    .optional()
    .isDecimal()
    .withMessage('Descuento debe ser un número válido')
];

