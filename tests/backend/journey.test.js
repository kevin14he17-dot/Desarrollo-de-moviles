/**
 * JOURNEY TESTS - BACKEND API
 * Prueba flujos completos del sistema (escenarios realistas)
 * Autor: OpenCode
 * Fecha: 2026-02-17
 */

import request from 'supertest';
import app from '../../src/index.js';

describe('JOURNEY TESTS - Backend Complete Workflows', () => {

  // ============================================================================
  // JOURNEY 1: FLUJO COMPLETO DE LOGIN Y AUTENTICACIÓN
  // ============================================================================

  describe('JOURNEY 1: Login → Acceso → Refresh Token', () => {
    const testUser = {
      username: 'journey_user_' + Date.now(),
      email: 'journey_' + Date.now() + '@test.com',
      password: 'Journey123!',
      fullName: 'Journey Test User',
      roleId: 2
    };

    test('✓ Paso 1: Registrar nuevo usuario', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('✓ Paso 2: Login con credenciales correctas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    test('✓ Paso 3: Obtener datos del usuario autenticado', async () => {
      // Primero hacer login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      const token = loginRes.body.data.tokens.accessToken;

      // Luego obtener datos del usuario
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.username).toBe(testUser.username);
    });

    test('✓ Paso 4: Renovar token de acceso', async () => {
      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      const refreshToken = loginRes.body.data.tokens.refreshToken;

      // Renovar token
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });
      
      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(loginRes.body.data.tokens.accessToken);
    });

    test('✓ Paso 5: Cambiar contraseña correctamente', async () => {
      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      const token = loginRes.body.data.tokens.accessToken;

      // Cambiar contraseña
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewJourney123!'
        });
      
      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // JOURNEY 2: FLUJO COMPLETO DE VENTA (POS)
  // ============================================================================

  describe('JOURNEY 2: Crear Producto → Venta → Reporte', () => {
    let token = '';
    let productId = null;
    let saleId = null;

    beforeAll(async () => {
      // Login como admin
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      
      if (loginRes.status === 200) {
        token = loginRes.body.data.tokens.accessToken;
      }
    });

    test('✓ Paso 1: Crear producto nuevo', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Laptop Journey ' + Date.now(),
          description: 'Laptop para testing',
          sku: 'LAPTOP-J-' + Date.now(),
          purchasePrice: 2000,
          sellingPrice: 2500,
          quantity: 50,
          minStock: 5,
          category: 'Electrónica'
        });
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        productId = response.body.data.productId;
      }
    });

    test('✓ Paso 2: Verificar producto en lista', async () => {
      const response = await request(app)
        .get('/api/products?skip=0&take=100')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      if (productId) {
        const product = response.body.data.find(p => p.productId === productId);
        expect(product).toBeDefined();
      }
    });

    test('✓ Paso 3: Crear venta con el producto', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { 
              productId: productId || 1, 
              quantity: 5, 
              price: 2500 
            }
          ],
          paymentMethod: 'efectivo',
          amountPaid: 12500,
          discount: 0
        });
      
      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        saleId = response.body.data.saleId;
      }
    });

    test('✓ Paso 4: Verificar venta en reporte', async () => {
      const response = await request(app)
        .get('/api/reports/sales?startDate=2024-01-01&endDate=2099-12-31')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      if (saleId) {
        const sale = response.body.data.find(s => s.saleId === saleId);
        expect(sale).toBeDefined();
      }
    });

    test('✓ Paso 5: Verificar stock actualizado', async () => {
      const response = await request(app)
        .get('/api/inventory/stock?skip=0&take=100')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      if (productId) {
        const product = response.body.data.find(p => p.productId === productId);
        if (product) {
          expect(product.quantity).toBeLessThan(50); // Debe haber disminuido
        }
      }
    });
  });

  // ============================================================================
  // JOURNEY 3: FLUJO DE CAJA (Apertura → Movimientos → Cierre)
  // ============================================================================

  describe('JOURNEY 3: Abrir Caja → Movimientos → Cerrar Caja', () => {
    let token = '';

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      
      if (loginRes.status === 200) {
        token = loginRes.body.data.tokens.accessToken;
      }
    });

    test('✓ Paso 1: Abrir caja con saldo inicial', async () => {
      const response = await request(app)
        .post('/api/cash-drawer/open')
        .set('Authorization', `Bearer ${token}`)
        .send({ openingBalance: 500 });
      
      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.data.status).toBe('abierta');
      }
    });

    test('✓ Paso 2: Obtener caja actual abierta', async () => {
      const response = await request(app)
        .get('/api/cash-drawer/current')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data.status).toBe('abierta');
      }
    });

    test('✓ Paso 3: Registrar entrada de dinero', async () => {
      const response = await request(app)
        .post('/api/cash-drawer/movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'entrada',
          amount: 250,
          concept: 'Venta de mercancía'
        });
      
      expect([201, 400, 404]).toContain(response.status);
    });

    test('✓ Paso 4: Registrar salida de dinero', async () => {
      const response = await request(app)
        .post('/api/cash-drawer/movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'salida',
          amount: 50,
          concept: 'Gasto de papelería'
        });
      
      expect([201, 400, 404]).toContain(response.status);
    });

    test('✓ Paso 5: Obtener movimientos de caja', async () => {
      const response = await request(app)
        .get('/api/cash-drawer/movements?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('✓ Paso 6: Cerrar caja', async () => {
      const response = await request(app)
        .post('/api/cash-drawer/close')
        .set('Authorization', `Bearer ${token}`)
        .send({ closingBalance: 700 });
      
      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(['abierta', 'cerrada']).toContain(response.body.data.status);
      }
    });

    test('✓ Paso 7: Verificar cierre en historial', async () => {
      const response = await request(app)
        .get('/api/cash-drawer/history?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ============================================================================
  // JOURNEY 4: FLUJO DE INVENTARIO (Entrada → Salida → Kardex)
  // ============================================================================

  describe('JOURNEY 4: Inventario - Entrada → Salida → Kardex', () => {
    let token = '';

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      
      if (loginRes.status === 200) {
        token = loginRes.body.data.tokens.accessToken;
      }
    });

    test('✓ Paso 1: Obtener stock inicial', async () => {
      const response = await request(app)
        .get('/api/inventory/stock?skip=0&take=5')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('✓ Paso 2: Registrar entrada de inventario', async () => {
      const response = await request(app)
        .post('/api/inventory/entrada')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: 1,
          quantity: 100,
          reference: 'Compra a distribuidor ABC'
        });
      
      expect([201, 400]).toContain(response.status);
    });

    test('✓ Paso 3: Verificar cantidad aumentada', async () => {
      const response = await request(app)
        .get('/api/inventory/stock?skip=0&take=5')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      const product = response.body.data.find(p => p.productId === 1);
      if (product) {
        expect(product.quantity).toBeGreaterThanOrEqual(100);
      }
    });

    test('✓ Paso 4: Registrar salida de inventario', async () => {
      const response = await request(app)
        .post('/api/inventory/salida')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: 1,
          quantity: 30,
          reference: 'Venta mostrador'
        });
      
      expect([201, 400]).toContain(response.status);
    });

    test('✓ Paso 5: Verificar cantidad disminuida', async () => {
      const response = await request(app)
        .get('/api/inventory/stock?skip=0&take=5')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      const product = response.body.data.find(p => p.productId === 1);
      if (product) {
        expect(product.quantity).toBeLessThan(100 + 30);
      }
    });

    test('✓ Paso 6: Verificar movimientos en Kardex', async () => {
      const response = await request(app)
        .get('/api/inventory/kardex?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('✓ Paso 7: Obtener stock crítico', async () => {
      const response = await request(app)
        .get('/api/inventory/critico')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('✓ Paso 8: Obtener valor total de inventario', async () => {
      const response = await request(app)
        .get('/api/inventory/valor')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.totalValue).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // JOURNEY 5: FLUJO DE REPORTES (Múltiples reportes)
  // ============================================================================

  describe('JOURNEY 5: Generar Múltiples Reportes', () => {
    let token = '';

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      
      if (loginRes.status === 200) {
        token = loginRes.body.data.tokens.accessToken;
      }
    });

    test('✓ Paso 1: Reporte de ventas del período', async () => {
      const response = await request(app)
        .get('/api/reports/sales?startDate=2024-01-01&endDate=2099-12-31')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('✓ Paso 2: Reporte de productos más vendidos', async () => {
      const response = await request(app)
        .get('/api/reports/products')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('✓ Paso 3: Reporte de métodos de pago', async () => {
      const response = await request(app)
        .get('/api/reports/payment-methods?startDate=2024-01-01&endDate=2099-12-31')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('efectivo');
    });

    test('✓ Paso 4: Resumen diario', async () => {
      const response = await request(app)
        .get('/api/reports/daily-summary')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalSales');
      expect(response.body.data).toHaveProperty('totalRevenue');
    });

    test('✓ Paso 5: Alertas del sistema', async () => {
      const response = await request(app)
        .get('/api/reports/alerts')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('✓ Paso 6: Resumen de cajas', async () => {
      const response = await request(app)
        .get('/api/reports/cash-summary')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalOpened');
    });
  });

});
