import { body } from 'express-validator';

export const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('El usuario debe tener al menos 3 caracteres'),
  
  body('email')
    .isEmail()
    .withMessage('Correo electrónico inválido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe contener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe contener al menos un número'),
  
  body('fullName')
    .trim()
    .isLength({ min: 3 })
    .withMessage('El nombre debe tener al menos 3 caracteres'),
  
  body('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de rol inválido')
];

export const loginValidator = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Usuario requerido'),
  
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida')
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Contraseña actual requerida'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe contener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe contener al menos un número')
];

export const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requerido')
];
