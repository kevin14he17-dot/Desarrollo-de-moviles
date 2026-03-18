import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';
import { 
  registerValidator, 
  loginValidator, 
  refreshTokenValidator,
  changePasswordValidator 
} from '../validators/authValidator.js';

const router = express.Router();

// Rutas públicas
router.post('/register', registerValidator, AuthController.register);
router.post('/login', loginValidator, AuthController.login);
router.post('/refresh-token', refreshTokenValidator, AuthController.refreshToken);

// Rutas protegidas (requieren autenticación)
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/change-password', authMiddleware, changePasswordValidator, AuthController.changePassword);

export default router;
