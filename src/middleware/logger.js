export const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  // Logs al finalizar la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    const statusEmoji = statusCode >= 500 ? '🔴' : statusCode >= 400 ? '🟡' : '🟢';
    
    console.log(
      `${statusEmoji} [${new Date().toISOString()}] ${method.padEnd(6)} ${originalUrl.padEnd(40)} ${statusCode} (+${duration}ms) ${ip}`
    );
  });

  next();
};
