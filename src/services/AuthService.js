import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { executeQuery } from '../config/database.js';

export class AuthService {
  async registerUser(userData) {
    const { username, email, password, fullName, roleId } = userData;

    // Validar que no exista usuario
    const existingUser = await executeQuery(
      'SELECT user_id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.recordset.length > 0) {
      throw new AppError('El usuario o correo ya existe', 400);
    }

    // Hashear contraseña
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insertar usuario
    const result = await executeQuery(
      `INSERT INTO users (username, email, password_hash, role_id, full_name, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [username, email, hashedPassword, roleId || 2, fullName]
    );

    // Obtener el ID insertado
    const idResult = await executeQuery('SELECT LAST_INSERT_ID() as user_id');
    const userId = idResult.recordset[0].user_id;

    // Obtener datos completos del usuario
    const user = await this.getUserById(userId);
    
    return user;
  }

  async loginUser(username, password) {
    // Buscar usuario
    const result = await executeQuery(
      `SELECT u.*, r.role_name FROM users u
       INNER JOIN roles r ON u.role_id = r.role_id
       WHERE u.username = ? AND u.is_active = 1`,
      [username]
    );

    if (result.recordset.length === 0) {
      throw new AppError('Usuario o contraseña incorrectos', 401);
    }

    const user = result.recordset[0];

    // Validar contraseña
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Usuario o contraseña incorrectos', 401);
    }

    // Actualizar último login
    await executeQuery(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
      [user.user_id]
    );

    // Generar tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Preparar respuesta (sin contraseña)
    delete user.password_hash;

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async getUserById(userId) {
    const result = await executeQuery(
      `SELECT u.*, r.role_name FROM users u
       INNER JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (result.recordset.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const user = result.recordset[0];
    delete user.password_hash;
    return user;
  }

  async refreshAccessToken(refreshToken) {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET + '_refresh');
      
      // Obtener usuario
      const user = await this.getUserById(decoded.userId);
      
      // Generar nuevo access token
      const newAccessToken = generateToken(user);
      
      return {
        accessToken: newAccessToken,
        user
      };
    } catch (error) {
      throw new AppError('Refresh token inválido', 401);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    const result = await executeQuery(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [userId]
    );

    if (result.recordset.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const user = result.recordset[0];

    // Validar contraseña actual
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Actualizar contraseña
    await executeQuery(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [hashedPassword, userId]
    );

    return { message: 'Contraseña actualizada correctamente' };
  }
}

export default new AuthService();
