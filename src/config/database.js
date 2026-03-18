import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración para MySQL
const mysqlConfig = {
  host: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'minimarket_test',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX) || 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: false
};

let pool = null;

export const getPool = async () => {
  if (!pool) {
    try {
      pool = await mysql.createPool(mysqlConfig);
      console.log('✓ Conexión a MySQL establecida');
      console.log(`  Host: ${mysqlConfig.host}:${mysqlConfig.port}`);
      console.log(`  Database: ${mysqlConfig.database}`);
      return pool;
    } catch (err) {
      console.error('✗ Error conectando a MySQL:', err.message);
      pool = null;
      throw err;
    }
  }
  
  return pool;
};

export const closePool = async () => {
  if (pool) {
    try {
      await pool.end();
      console.log('✓ Conexión a MySQL cerrada');
    } catch (err) {
      console.error('Error cerrando pool:', err.message);
    }
    pool = null;
  }
};

// Ejecutar query con parámetros posicionales (?)
export const executeQuery = async (query, params = []) => {
  try {
    const connPool = await getPool();
    const connection = await connPool.getConnection();
    
    try {
      // Si params es un objeto, convertirlo a array
      const paramArray = Array.isArray(params) ? params : Object.values(params);
      
      const [rows, fields] = await connection.query(query, paramArray);
      
      // Retornar en formato compatible con tests esperados
      // Incluir insertId si está disponible (para inserts)
      return {
        recordset: rows,
        rowsAffected: [rows.length],
        insertId: rows && rows.insertId ? rows.insertId : null
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    console.error('Query:', query);
    throw error;
  }
};

export default { getPool, closePool, executeQuery };
