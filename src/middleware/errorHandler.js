export const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
