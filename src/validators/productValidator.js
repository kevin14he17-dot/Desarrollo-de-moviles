import { body } from 'express-validator';

export const productValidator = [
  body('barcode')
    .notEmpty()
    .withMessage('Código de barras requerido')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Código de barras debe tener al menos 3 caracteres'),
  
  body('productName')
    .notEmpty()
    .withMessage('Nombre del producto requerido')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Nombre del producto debe tener al menos 3 caracteres'),
  
  body('categoryId')
    .notEmpty()
    .withMessage('Categoría requerida')
    .isInt({ min: 1 })
    .withMessage('Categoría debe ser un número válido'),
  
  body('unitId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Unidad debe ser un número válido'),
  
  body('costPrice')
    .notEmpty()
    .withMessage('Precio de costo requerido')
    .isFloat({ min: 0 })
    .withMessage('Precio de costo debe ser un número válido'),
  
  body('sellingPrice')
    .notEmpty()
    .withMessage('Precio de venta requerido')
    .isFloat({ min: 0 })
    .withMessage('Precio de venta debe ser un número válido'),
  
  body('stockActual')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock actual debe ser un número no negativo'),
  
  body('stockMinimo')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock mínimo debe ser un número no negativo'),
  
  body('stockMaximo')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock máximo debe ser un número no negativo'),
  
  body('quantityPerUnit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cantidad por unidad debe ser un número positivo')
];

export const productPriceValidator = [
  body('costPrice')
    .notEmpty()
    .withMessage('Precio de costo requerido')
    .isFloat({ min: 0 })
    .withMessage('Precio de costo debe ser un número válido'),
  
  body('sellingPrice')
    .notEmpty()
    .withMessage('Precio de venta requerido')
    .isFloat({ min: 0 })
    .withMessage('Precio de venta debe ser un número válido')
];

export const productStockValidator = [
  body('stock')
    .notEmpty()
    .withMessage('Stock requerido')
    .isInt({ min: 0 })
    .withMessage('Stock debe ser un número no negativo')
];
