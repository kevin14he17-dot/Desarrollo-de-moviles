-- ============================================================================
-- SISTEMA DE MINIMARKET INTERMEDIO PRO
-- Base de Datos: SQL Server
-- Autor: OpenCode
-- Fecha: 2026-02-17
-- ============================================================================

-- Crear Base de Datos
CREATE DATABASE MinimarketDB;
GO

USE MinimarketDB;
GO

-- ============================================================================
-- 1. TABLA DE ROLES (RBAC)
-- ============================================================================
CREATE TABLE Roles (
    RoleID INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);
GO

-- Insertar roles iniciales
INSERT INTO Roles (RoleName, Description) VALUES
('Administrador', 'Control total del sistema'),
('Cajero', 'Operaciones de venta y caja'),
('Gerente', 'Reportes y supervisión');
GO

-- ============================================================================
-- 2. TABLA DE USUARIOS
-- ============================================================================
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    RoleID INT NOT NULL FOREIGN KEY REFERENCES Roles(RoleID),
    FullName NVARCHAR(150),
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME,
    IsActive BIT DEFAULT 1
);
GO

CREATE INDEX IX_Users_RoleID ON Users(RoleID);
GO

-- ============================================================================
-- 3. TABLA DE CATEGORÍAS DE PRODUCTOS
-- ============================================================================
CREATE TABLE Categories (
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);
GO

-- ============================================================================
-- 4. TABLA DE PRODUCTOS
-- ============================================================================
CREATE TABLE Products (
    ProductID INT PRIMARY KEY IDENTITY(1,1),
    Barcode NVARCHAR(50) NOT NULL UNIQUE,
    ProductName NVARCHAR(150) NOT NULL,
    CategoryID INT NOT NULL FOREIGN KEY REFERENCES Categories(CategoryID),
    CostPrice DECIMAL(10, 2) NOT NULL,
    SellingPrice DECIMAL(10, 2) NOT NULL,
    StockActual INT NOT NULL DEFAULT 0,
    StockMinimo INT NOT NULL DEFAULT 5,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);
GO

CREATE INDEX IX_Products_Barcode ON Products(Barcode);
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
GO

-- ============================================================================
-- 5. TABLA DE KARDEX (HISTORIAL DE MOVIMIENTOS)
-- ============================================================================
CREATE TABLE Kardex (
    KardexID INT PRIMARY KEY IDENTITY(1,1),
    ProductID INT NOT NULL FOREIGN KEY REFERENCES Products(ProductID),
    TipoMovimiento NVARCHAR(20) NOT NULL, -- 'ENTRADA', 'SALIDA', 'VENTA', 'AJUSTE', 'DEVOLUCION'
    Cantidad INT NOT NULL,
    MotivoCambio NVARCHAR(100), -- 'Compra', 'Venta', 'Merma', 'Vencimiento', 'Pérdida', 'Ajuste'
    StockAnterior INT NOT NULL,
    StockActual INT NOT NULL,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    Proveedor NVARCHAR(100),
    Responsable NVARCHAR(100),
    Observaciones NVARCHAR(255)
);
GO

CREATE INDEX IX_Kardex_ProductID ON Kardex(ProductID);
CREATE INDEX IX_Kardex_UserID ON Kardex(UserID);
CREATE INDEX IX_Kardex_CreatedAt ON Kardex(CreatedAt);
GO

-- ============================================================================
-- 6. TABLA DE APERTURA DE CAJA
-- ============================================================================
CREATE TABLE CashDrawer (
    CashDrawerID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    FechaApertura DATETIME DEFAULT GETDATE(),
    MontoInicial DECIMAL(10, 2) NOT NULL,
    MontoEfectivo DECIMAL(10, 2) DEFAULT 0,
    MontoTarjeta DECIMAL(10, 2) DEFAULT 0,
    MontoQR DECIMAL(10, 2) DEFAULT 0,
    State NVARCHAR(20) DEFAULT 'ABIERTA', -- 'ABIERTA', 'CERRADA'
    FechaCierre DATETIME,
    MontoCierre DECIMAL(10, 2),
    Diferencia DECIMAL(10, 2),
    Observaciones NVARCHAR(255)
);
GO

CREATE INDEX IX_CashDrawer_UserID ON CashDrawer(UserID);
CREATE INDEX IX_CashDrawer_State ON CashDrawer(State);
GO

-- ============================================================================
-- 7. TABLA DE MOVIMIENTOS DE CAJA
-- ============================================================================
CREATE TABLE CashMovements (
    CashMovementID INT PRIMARY KEY IDENTITY(1,1),
    CashDrawerID INT NOT NULL FOREIGN KEY REFERENCES CashDrawer(CashDrawerID),
    TipoMovimiento NVARCHAR(20) NOT NULL, -- 'INGRESO', 'EGRESO'
    Monto DECIMAL(10, 2) NOT NULL,
    Motivo NVARCHAR(150),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_CashMovements_CashDrawerID ON CashMovements(CashDrawerID);
GO

-- ============================================================================
-- 8. TABLA DE VENTAS (TRANSACCIONES)
-- ============================================================================
CREATE TABLE Sales (
    SaleID INT PRIMARY KEY IDENTITY(1,1),
    CashDrawerID INT NOT NULL FOREIGN KEY REFERENCES CashDrawer(CashDrawerID),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    FechaVenta DATETIME DEFAULT GETDATE(),
    Subtotal DECIMAL(10, 2) NOT NULL,
    Tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    Total DECIMAL(10, 2) NOT NULL,
    PaidAmount DECIMAL(10, 2) NOT NULL,
    Change DECIMAL(10, 2) NOT NULL DEFAULT 0,
    State NVARCHAR(20) DEFAULT 'COMPLETADA', -- 'COMPLETADA', 'ANULADA'
    AnuladaEn DATETIME,
    AnuladaPor INT FOREIGN KEY REFERENCES Users(UserID),
    Observaciones NVARCHAR(255),
    IsDeleted BIT DEFAULT 0
);
GO

CREATE INDEX IX_Sales_CashDrawerID ON Sales(CashDrawerID);
CREATE INDEX IX_Sales_UserID ON Sales(UserID);
CREATE INDEX IX_Sales_FechaVenta ON Sales(FechaVenta);
GO

-- ============================================================================
-- 9. TABLA DE DETALLES DE VENTAS
-- ============================================================================
CREATE TABLE SaleDetails (
    SaleDetailID INT PRIMARY KEY IDENTITY(1,1),
    SaleID INT NOT NULL FOREIGN KEY REFERENCES Sales(SaleID),
    ProductID INT NOT NULL FOREIGN KEY REFERENCES Products(ProductID),
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10, 2) NOT NULL,
    Subtotal DECIMAL(10, 2) NOT NULL,
    IsDeleted BIT DEFAULT 0
);
GO

CREATE INDEX IX_SaleDetails_SaleID ON SaleDetails(SaleID);
CREATE INDEX IX_SaleDetails_ProductID ON SaleDetails(ProductID);
GO

-- ============================================================================
-- 10. TABLA DE MÉTODOS DE PAGO
-- ============================================================================
CREATE TABLE PaymentMethods (
    PaymentMethodID INT PRIMARY KEY IDENTITY(1,1),
    SaleID INT NOT NULL FOREIGN KEY REFERENCES Sales(SaleID),
    MetodoPago NVARCHAR(50) NOT NULL, -- 'EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'
    Monto DECIMAL(10, 2) NOT NULL,
    ReferenciaPago NVARCHAR(100), -- Número de operación QR, ID de transacción tarjeta
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE INDEX IX_PaymentMethods_SaleID ON PaymentMethods(SaleID);
GO

-- ============================================================================
-- 11. TABLA DE AUDITORÍA GENERAL
-- ============================================================================
CREATE TABLE AuditLog (
    AuditLogID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Accion NVARCHAR(100) NOT NULL,
    Tabla NVARCHAR(50),
    RegistroID INT,
    ValorAnterior NVARCHAR(MAX),
    ValorNuevo NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    IPAddress NVARCHAR(50)
);
GO

CREATE INDEX IX_AuditLog_UserID ON AuditLog(UserID);
CREATE INDEX IX_AuditLog_CreatedAt ON AuditLog(CreatedAt);
GO

-- ============================================================================
-- 12. TABLA DE PROVEEDORES
-- ============================================================================
CREATE TABLE Suppliers (
    SupplierID INT PRIMARY KEY IDENTITY(1,1),
    SupplierName NVARCHAR(150) NOT NULL,
    ContactPerson NVARCHAR(100),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);
GO

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Productos con Stock Crítico
CREATE VIEW vw_StockCritico AS
SELECT 
    p.ProductID,
    p.Barcode,
    p.ProductName,
    p.StockActual,
    p.StockMinimo,
    c.CategoryName
FROM Products p
INNER JOIN Categories c ON p.CategoryID = c.CategoryID
WHERE p.StockActual <= p.StockMinimo AND p.IsActive = 1;
GO

-- Vista: Resumen de Caja del Día
CREATE VIEW vw_ResumenCaja AS
SELECT 
    cd.CashDrawerID,
    cd.FechaApertura,
    u.FullName as Cajero,
    cd.MontoInicial,
    COALESCE(SUM(CASE WHEN pm.MetodoPago = 'EFECTIVO' THEN pm.Monto ELSE 0 END), 0) as TotalEfectivo,
    COALESCE(SUM(CASE WHEN pm.MetodoPago IN ('YAPE', 'PLIN') THEN pm.Monto ELSE 0 END), 0) as TotalQR,
    COALESCE(SUM(CASE WHEN pm.MetodoPago = 'TARJETA' THEN pm.Monto ELSE 0 END), 0) as TotalTarjeta,
    COALESCE(SUM(s.Total), 0) as TotalVentas,
    cd.State
FROM CashDrawer cd
INNER JOIN Users u ON cd.UserID = u.UserID
LEFT JOIN Sales s ON cd.CashDrawerID = s.CashDrawerID AND s.State = 'COMPLETADA'
LEFT JOIN PaymentMethods pm ON s.SaleID = pm.SaleID
GROUP BY cd.CashDrawerID, cd.FechaApertura, u.FullName, cd.MontoInicial, cd.State;
GO

-- Vista: Productos Más Vendidos
CREATE VIEW vw_ProductosMasVendidos AS
SELECT TOP 20
    p.ProductID,
    p.ProductName,
    p.Barcode,
    SUM(sd.Cantidad) as TotalVendido,
    SUM(sd.Subtotal) as MontoTotal,
    AVG(sd.PrecioUnitario) as PrecioPromedio
FROM SaleDetails sd
INNER JOIN Products p ON sd.ProductID = p.ProductID
INNER JOIN Sales s ON sd.SaleID = s.SaleID
WHERE s.State = 'COMPLETADA' AND sd.IsDeleted = 0
GROUP BY p.ProductID, p.ProductName, p.Barcode
ORDER BY TotalVendido DESC;
GO

PRINT '✓ Base de datos creada exitosamente';
PRINT '✓ Tablas: 12';
PRINT '✓ Índices: 15';
PRINT '✓ Vistas: 3';
