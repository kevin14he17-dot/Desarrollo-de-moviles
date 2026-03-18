import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de conexión sin base de datos (para crear la BD)
const adminConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root'
};

// Configuración con base de datos
const dbConfig = {
  ...adminConfig,
  database: 'minimarket_test'
};

async function initializeDatabase() {
  let connection = null;
  
  try {
    console.log('🔄 Inicializando base de datos MySQL...\n');
    
    // Conectar sin base de datos para crear la BD
    console.log('📌 Paso 1: Creando base de datos...');
    connection = await mysql.createConnection(adminConfig);
    
    // Crear base de datos si no existe
    await connection.query('CREATE DATABASE IF NOT EXISTS minimarket_test');
    console.log('✓ Base de datos creada o ya existe\n');
    await connection.end();
    
    // Conectar a la base de datos y ejecutar schema
    console.log('📌 Paso 2: Creando tablas y esquema...');
    connection = await mysql.createConnection(dbConfig);
    
     // Leer archivo SQL
      const sqlFilePath = path.join(__dirname, '..', 'database-mysql.sql');
     let sqlScript = fs.readFileSync(sqlFilePath, 'utf-8');
     
     // Remover comentarios de una sola línea (--) y multibloque (/* */)
     sqlScript = sqlScript
       .replace(/--[^\n]*\n/g, '\n') // Remover comentarios con --
       .replace(/\/\*[\s\S]*?\*\//g, ''); // Remover comentarios con /* */
     
     // Dividir por puntos y coma y ejecutar cada sentencia
     const statements = sqlScript
       .split(';')
       .map(stmt => stmt.trim())
       .filter(stmt => {
         // Filtrar líneas vacías, USE statements, CREATE DATABASE y SELECT
         if (!stmt) return false;
         if (stmt.toUpperCase().startsWith('USE ')) return false;
         if (stmt.toUpperCase().startsWith('CREATE DATABASE')) return false;
         if (stmt.toUpperCase().startsWith('SELECT')) return false;
         return true;
       });
     
     console.log(`📊 Total de statements a ejecutar: ${statements.length}\n`);
    
    for (const statement of statements) {
      if (statement) {
        try {
          await connection.query(statement);
        } catch (err) {
          // Ignorar errores de "ya existe"
          if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DB_CREATE_EXISTS') {
            console.error('Error en statement:', statement.substring(0, 50) + '...');
            console.error('Error:', err.message);
          }
        }
      }
    }
    console.log('✓ Tablas y vistas creadas\n');
    
    // Insertar datos de prueba
    console.log('📌 Paso 3: Insertando datos de prueba...');
    
    // Insertar usuarios de prueba
    const users = [
      {
        username: 'admin',
        email: 'admin@minimarket.test',
        password_hash: '$2a$10$5iZAVZkL5f/3oiHN7HZuceJyl4Kq7PT4qWM8ZfbphwWJWoOlsfXaG', // admin123 bcryptado
        role_id: 1,
        full_name: 'Administrador Sistema'
      },
      {
        username: 'gerente',
        email: 'gerente@minimarket.test',
        password_hash: '$2a$10$MaSCJ7gblPTtvFWv4cem5.euhlazSkTpW.vpLabV0IcRlonH1H4bK', // gerente123
        role_id: 3,
        full_name: 'Gerente Tienda'
      },
      {
        username: 'cajero',
        email: 'cajero@minimarket.test',
        password_hash: '$2a$10$iLo2IxlxtLjR4nbgeo7Y2eoHgBi/pm.VgJu2oeCYS0Uc52NyI7VTi', // cajero123
        role_id: 2,
        full_name: 'Cajero Principal'
      }
    ];
    
    for (const user of users) {
      try {
        await connection.query(
          'INSERT INTO users (username, email, password_hash, role_id, full_name) VALUES (?, ?, ?, ?, ?)',
          [user.username, user.email, user.password_hash, user.role_id, user.full_name]
        );
        console.log(`  ✓ Usuario ${user.username} creado`);
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error(`  ✗ Error creando usuario ${user.username}:`, err.message);
        }
      }
    }
    
    // Insertar categorías de productos
    const categories = [
      { category_name: 'Bebidas', description: 'Bebidas frías y calientes' },
      { category_name: 'Alimentos', description: 'Productos alimenticios' },
      { category_name: 'Panadería', description: 'Pan y productos de panadería' },
      { category_name: 'Lácteos', description: 'Productos lácteos' },
      { category_name: 'Snacks', description: 'Snacks y frituras' }
    ];
    
    for (const category of categories) {
      try {
        await connection.query(
          'INSERT INTO categories (category_name, description) VALUES (?, ?)',
          [category.category_name, category.description]
        );
        console.log(`  ✓ Categoría ${category.category_name} creada`);
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error(`  ✗ Error creando categoría:`, err.message);
        }
      }
    }
    
    // Insertar productos de prueba
    const products = [
      { barcode: '001', product_name: 'Coca Cola 2L', category_id: 1, cost_price: 15000, selling_price: 25000, stock_actual: 100 },
      { barcode: '002', product_name: 'Fanta Naranja 2L', category_id: 1, cost_price: 12000, selling_price: 20000, stock_actual: 80 },
      { barcode: '003', product_name: 'Sprite 2L', category_id: 1, cost_price: 12000, selling_price: 20000, stock_actual: 75 },
      { barcode: '004', product_name: 'Leche Gloria 1L', category_id: 4, cost_price: 3000, selling_price: 6000, stock_actual: 200 },
      { barcode: '005', product_name: 'Pan Blanco', category_id: 3, cost_price: 2000, selling_price: 4000, stock_actual: 500 },
      { barcode: '006', product_name: 'Pan Francés', category_id: 3, cost_price: 1000, selling_price: 2500, stock_actual: 600 },
      { barcode: '007', product_name: 'Yogur Gloria', category_id: 4, cost_price: 2000, selling_price: 4500, stock_actual: 150 },
      { barcode: '008', product_name: 'Queso Andino', category_id: 4, cost_price: 8000, selling_price: 15000, stock_actual: 50 },
      { barcode: '009', product_name: 'Papas Lay\'s Clásicas', category_id: 5, cost_price: 1500, selling_price: 3500, stock_actual: 300 },
      { barcode: '010', product_name: 'Doritos Queso', category_id: 5, cost_price: 1800, selling_price: 4000, stock_actual: 250 },
      { barcode: '011', product_name: 'Galletas Oreo', category_id: 2, cost_price: 2500, selling_price: 5500, stock_actual: 180 },
      { barcode: '012', product_name: 'Chocolate Arcor', category_id: 2, cost_price: 1200, selling_price: 3000, stock_actual: 400 }
    ];
    
    for (const product of products) {
      try {
        await connection.query(
          'INSERT INTO products (barcode, product_name, category_id, cost_price, selling_price, stock_actual) VALUES (?, ?, ?, ?, ?, ?)',
          [product.barcode, product.product_name, product.category_id, product.cost_price, product.selling_price, product.stock_actual]
        );
        console.log(`  ✓ Producto ${product.product_name} creado`);
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error(`  ✗ Error creando producto:`, err.message);
        }
      }
    }
    
    console.log('\n✅ Base de datos inicializada correctamente!\n');
    console.log('📊 Resumen:');
    console.log('  • Base de datos: minimarket_test');
    console.log('  • Usuarios: 3 (admin, gerente, cajero)');
    console.log('  • Categorías: 5');
    console.log('  • Productos: 12');
    console.log('  • Tablas: 12');
    console.log('  • Vistas: 3\n');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar inicialización
initializeDatabase().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
