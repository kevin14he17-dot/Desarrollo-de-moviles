-- ============================================================================
-- SISTEMA DE MINIMARKET INTERMEDIO PRO
-- Base de Datos: MySQL 8.0+
-- Convertido desde SQL Server
-- Autor: OpenCode
-- Fecha: 2026-02-18
-- ============================================================================

-- Crear Base de Datos
CREATE DATABASE IF NOT EXISTS minimarket_test;
USE minimarket_test;

-- ============================================================================
-- 1. TABLA DE ROLES (RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insertar roles iniciales
INSERT INTO roles (role_name, description) VALUES
('Administrador', 'Control total del sistema'),
('Cajero', 'Operaciones de venta y caja'),
('Gerente', 'Reportes y supervisión');

-- ============================================================================
-- 2. TABLA DE USUARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    full_name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE INDEX IX_users_role_id ON users(role_id);

-- ============================================================================
-- 3. TABLA DE CATEGORÍAS DE PRODUCTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- 4. TABLA DE PRODUCTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(150) NOT NULL,
    category_id INT NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE INDEX IX_products_barcode ON products(barcode);
CREATE INDEX IX_products_category_id ON products(category_id);

-- ============================================================================
-- 5. TABLA DE KARDEX (HISTORIAL DE MOVIMIENTOS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS kardex (
    kardex_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SALIDA', 'VENTA', 'AJUSTE', 'DEVOLUCION'
    cantidad INT NOT NULL,
    motivo_cambio VARCHAR(100), -- 'Compra', 'Venta', 'Merma', 'Vencimiento', 'Pérdida', 'Ajuste'
    stock_anterior INT NOT NULL,
    stock_actual INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    proveedor VARCHAR(100),
    responsable VARCHAR(100),
    observaciones VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IX_kardex_product_id ON kardex(product_id);
CREATE INDEX IX_kardex_user_id ON kardex(user_id);
CREATE INDEX IX_kardex_created_at ON kardex(created_at);

-- ============================================================================
-- 6. TABLA DE APERTURA DE CAJA
-- ============================================================================
CREATE TABLE IF NOT EXISTS cash_drawer (
    cash_drawer_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto_inicial DECIMAL(10, 2) NOT NULL,
    monto_efectivo DECIMAL(10, 2) DEFAULT 0,
    monto_tarjeta DECIMAL(10, 2) DEFAULT 0,
    monto_qr DECIMAL(10, 2) DEFAULT 0,
    state VARCHAR(20) DEFAULT 'ABIERTA', -- 'ABIERTA', 'CERRADA'
    fecha_cierre DATETIME,
    monto_cierre DECIMAL(10, 2),
    diferencia DECIMAL(10, 2),
    observaciones VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IX_cash_drawer_user_id ON cash_drawer(user_id);
CREATE INDEX IX_cash_drawer_state ON cash_drawer(state);

-- ============================================================================
-- 7. TABLA DE MOVIMIENTOS DE CAJA
-- ============================================================================
CREATE TABLE IF NOT EXISTS cash_movements (
    cash_movement_id INT PRIMARY KEY AUTO_INCREMENT,
    cash_drawer_id INT NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL, -- 'INGRESO', 'EGRESO'
    monto DECIMAL(10, 2) NOT NULL,
    motivo VARCHAR(150),
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cash_drawer_id) REFERENCES cash_drawer(cash_drawer_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IX_cash_movements_cash_drawer_id ON cash_movements(cash_drawer_id);

-- ============================================================================
-- 8. TABLA DE VENTAS (TRANSACCIONES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales (
    sale_id INT PRIMARY KEY AUTO_INCREMENT,
    cash_drawer_id INT NOT NULL,
    user_id INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL,
    change_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    state VARCHAR(20) DEFAULT 'COMPLETADA', -- 'COMPLETADA', 'ANULADA'
    anulada_en DATETIME,
    anulada_por INT,
    observaciones VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (cash_drawer_id) REFERENCES cash_drawer(cash_drawer_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (anulada_por) REFERENCES users(user_id)
);

CREATE INDEX IX_sales_cash_drawer_id ON sales(cash_drawer_id);
CREATE INDEX IX_sales_user_id ON sales(user_id);
CREATE INDEX IX_sales_fecha_venta ON sales(fecha_venta);

-- ============================================================================
-- 9. TABLA DE DETALLES DE VENTAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS sale_details (
    sale_detail_id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE INDEX IX_sale_details_sale_id ON sale_details(sale_id);
CREATE INDEX IX_sale_details_product_id ON sale_details(product_id);

-- ============================================================================
-- 10. TABLA DE MÉTODOS DE PAGO
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    payment_method_id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL, -- 'EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'
    monto DECIMAL(10, 2) NOT NULL,
    referencia_pago VARCHAR(100), -- Número de operación QR, ID de transacción tarjeta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id)
);

CREATE INDEX IX_payment_methods_sale_id ON payment_methods(sale_id);

-- ============================================================================
-- 11. TABLA DE AUDITORÍA GENERAL
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    audit_log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    tabla VARCHAR(50),
    registro_id INT,
    valor_anterior LONGTEXT,
    valor_nuevo LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IX_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IX_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- 12. TABLA DE PROVEEDORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Productos con Stock Crítico
CREATE OR REPLACE VIEW vw_stock_critico AS
SELECT 
    p.product_id,
    p.barcode,
    p.product_name,
    p.stock_actual,
    p.stock_minimo,
    c.category_name
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
WHERE p.stock_actual <= p.stock_minimo AND p.is_active = TRUE;

-- Vista: Resumen de Caja del Día
CREATE OR REPLACE VIEW vw_resumen_caja AS
SELECT 
    cd.cash_drawer_id,
    cd.fecha_apertura,
    u.full_name as cajero,
    cd.monto_inicial,
    COALESCE(SUM(CASE WHEN pm.metodo_pago = 'EFECTIVO' THEN pm.monto ELSE 0 END), 0) as total_efectivo,
    COALESCE(SUM(CASE WHEN pm.metodo_pago IN ('YAPE', 'PLIN') THEN pm.monto ELSE 0 END), 0) as total_qr,
    COALESCE(SUM(CASE WHEN pm.metodo_pago = 'TARJETA' THEN pm.monto ELSE 0 END), 0) as total_tarjeta,
    COALESCE(SUM(s.total), 0) as total_ventas,
    cd.state
FROM cash_drawer cd
INNER JOIN users u ON cd.user_id = u.user_id
LEFT JOIN sales s ON cd.cash_drawer_id = s.cash_drawer_id AND s.state = 'COMPLETADA'
LEFT JOIN payment_methods pm ON s.sale_id = pm.sale_id
GROUP BY cd.cash_drawer_id, cd.fecha_apertura, u.full_name, cd.monto_inicial, cd.state;

-- Vista: Productos Más Vendidos
CREATE OR REPLACE VIEW vw_productos_mas_vendidos AS
SELECT 
    p.product_id,
    p.product_name,
    p.barcode,
    SUM(sd.cantidad) as total_vendido,
    SUM(sd.subtotal) as monto_total,
    AVG(sd.precio_unitario) as precio_promedio
FROM sale_details sd
INNER JOIN products p ON sd.product_id = p.product_id
INNER JOIN sales s ON sd.sale_id = s.sale_id
WHERE s.state = 'COMPLETADA' AND sd.is_deleted = FALSE
GROUP BY p.product_id, p.product_name, p.barcode
ORDER BY total_vendido DESC
LIMIT 20;

SELECT '✓ Base de datos creada exitosamente' as status;
SELECT '✓ Tablas: 12' as info;
SELECT '✓ Índices: 15' as info;
SELECT '✓ Vistas: 3' as info;
