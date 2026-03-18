import AuthService from '../services/AuthService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { body, validationResult } from 'express-validator';
import { normalizeBDResponse } from '../utils/normalizeResponse.js';

export class AuthController {
  // POST /api/auth/register
  static register = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, fullName, roleId } = req.body;

    const user = await AuthService.registerUser({
      username,
      email,
      password,
      fullName,
      roleId
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: normalizeBDResponse(user)
    });
  });

  // POST /api/auth/login
  static login = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;

    const { user, accessToken, refreshToken } = await AuthService.loginUser(
      username,
      password
    );

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  });

  // POST /api/auth/refresh-token
  static refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token requerido', 400);
    }

    const { accessToken, user } = await AuthService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token renovado exitosamente',
      data: {
        user,
        accessToken
      }
    });
  });

  // POST /api/auth/change-password
  static changePassword = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const result = await AuthService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  // GET /api/auth/me (obtener usuario actual)
  static getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getUserById(req.user.userId);

    res.status(200).json({
      success: true,
      data: normalizeBDResponse(user)
    });
  });
}

export default AuthController;
