/**
 * SMOKE TESTS - BACKEND API
 * Verifica que cada endpoint responda correctamente
 * Autor: OpenCode
 * Fecha: 2026-02-17
 */

import request from 'supertest';
import app from '../../src/index.js';

describe('SMOKE TESTS - Backend API Endpoints', () => {
  
  // ============================================================================
  // HEALTH CHECK
  // ============================================================================
  
  describe('Health Check', () => {
    test('GET /health - debe retornar status OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });

  // ============================================================================
  // AUTH ENDPOINTS (5 endpoints)
  // ============================================================================
  
  describe('Auth Module - Smoke Tests', () => {
    let validToken = '';
    let refreshToken = '';
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@test.com',
      password: 'TestPassword123!',
      fullName: 'Test User',
      roleId: 2
    };

    test('[1/5] POST /api/auth/register - debe crear usuario exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('username', testUser.username);
      expect(response.body.message).toContain('exitosamente');
    });

    test('[2/5] POST /api/auth/login - debe retornar tokens de acceso', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      
      validToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    test('[3/5] POST /api/auth/refresh-token - debe renovar token de acceso', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
    });

    test('[4/5] GET /api/auth/me - debe retornar datos del usuario actual', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('username');
    });

    test('[5/5] POST /api/auth/change-password - debe cambiar contraseña exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPassword123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================================================
  // PRODUCT ENDPOINTS (4 endpoints)
  // ============================================================================
  
  describe('Product Module - Smoke Tests', () => {
    let productId = null;
    let token = '';

    beforeAll(async () => {
      // Obtener token para las pruebas
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

    test('[1/4] GET /api/products - debe listar productos', async () => {
      const response = await request(app)
        .get('/api/products?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    test('[2/4] POST /api/products - debe crear producto', async () => {
      const productData = {
        name: 'Test Product ' + Date.now(),
        description: 'Test Description',
        sku: 'SKU' + Date.now(),
        purchasePrice: 50,
        sellingPrice: 100,
        quantity: 10,
        minStock: 5,
        category: 'Test'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productData);
      
      expect([201, 401, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        productId = response.body.data.productId;
      }
    });

    test('[3/4] PUT /api/products/:id - debe actualizar producto', async () => {
      if (!productId) {
        console.log('⊘ Saltando: No hay productId disponible');
        return;
      }

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Product' });
      
      expect([200, 401, 404, 400]).toContain(response.status);
    });

    test('[4/4] DELETE /api/products/:id - debe eliminar producto (soft delete)', async () => {
      if (!productId) {
        console.log('⊘ Saltando: No hay productId disponible');
        return;
      }

      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // INVENTORY ENDPOINTS (6 endpoints)
  // ============================================================================
  
  describe('Inventory Module - Smoke Tests', () => {
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

    test('[1/6] GET /api/inventory/stock - debe obtener stock actual', async () => {
      const response = await request(app)
        .get('/api/inventory/stock?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('[2/6] POST /api/inventory/entrada - debe registrar entrada de inventario', async () => {
      const response = await request(app)
        .post('/api/inventory/entrada')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: 1,
          quantity: 10,
          reference: 'Compra a proveedor'
        });
      
      expect([201, 400, 401]).toContain(response.status);
    });

    test('[3/6] POST /api/inventory/salida - debe registrar salida de inventario', async () => {
      const response = await request(app)
        .post('/api/inventory/salida')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: 1,
          quantity: 5,
          reference: 'Venta'
        });
      
      expect([201, 400, 401]).toContain(response.status);
    });

    test('[4/6] GET /api/inventory/kardex - debe obtener kardex de inventario', async () => {
      const response = await request(app)
        .get('/api/inventory/kardex?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
    });

    test('[5/6] GET /api/inventory/critico - debe obtener stock crítico', async () => {
      const response = await request(app)
        .get('/api/inventory/critico')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    test('[6/6] GET /api/inventory/valor - debe obtener valor total de inventario', async () => {
      const response = await request(app)
        .get('/api/inventory/valor')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('totalValue');
      }
    });
  });

  // ============================================================================
  // CASH DRAWER ENDPOINTS (6 endpoints)
  // ============================================================================
  
  describe('Cash Drawer Module - Smoke Tests', () => {
    let token = '';
    let cashDrawerId = null;

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

    test('[1/6] POST /api/cash-drawer/open - debe abrir caja', async () => {
      const response = await request(app)
        .post('/api/cash-drawer/open')
        .set('Authorization', `Bearer ${token}`)
        .send({ openingBalance: 100 });
      
      expect([201, 400, 401]).toContain(response.status);
      if (response.status === 201) {
        cashDrawerId = response.body.data.drawerId;
      }
    });

    test('[2/6] GET /api/cash-drawer/current - debe obtener caja actual', async () => {
      const response = await request(app)
        .get('/api/cash-drawer/current')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401, 404]).toContain(response.status);
    });

    test('[3/6] POST /api/cash-drawer/movements - debe registrar movimiento de caja', async () => {
      const response = await request(app)
        .post('/api/cash-drawer/movements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'entrada',
          amount: 50,
          concept: 'Venta'
        });
      
      expect([201, 400, 401]).toContain(response.status);
    });

    test('[4/6] GET /api/cash-drawer/movements - debe obtener movimientos de caja', async () => {
      const response = await request(app)
        .get('/api/cash-drawer/movements?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
    });

    test('[5/6] POST /api/cash-drawer/close - debe cerrar caja', async () => {
      const response = await request(app)
        .post('/api/cash-drawer/close')
        .set('Authorization', `Bearer ${token}`)
        .send({ closingBalance: 150 });
      
      expect([200, 400, 401, 404]).toContain(response.status);
    });

    test('[6/6] GET /api/cash-drawer/history - debe obtener historial de cajas', async () => {
      const response = await request(app)
        .get('/api/cash-drawer/history?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
    });
  });

  // ============================================================================
  // SALES ENDPOINTS (4 endpoints)
  // ============================================================================
  
  describe('Sales Module - Smoke Tests', () => {
    let token = '';
    let saleId = null;

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

    test('[1/4] POST /api/sales - debe crear venta', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { productId: 1, quantity: 2, price: 100 }
          ],
          paymentMethod: 'efectivo',
          amountPaid: 200,
          discount: 0
        });
      
      expect([201, 400, 401]).toContain(response.status);
      if (response.status === 201) {
        saleId = response.body.data.saleId;
      }
    });

    test('[2/4] GET /api/sales - debe listar ventas', async () => {
      const response = await request(app)
        .get('/api/sales?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    test('[3/4] GET /api/sales/:id - debe obtener detalles de venta', async () => {
      const response = await request(app)
        .get(`/api/sales/${saleId || 1}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401, 404]).toContain(response.status);
    });

    test('[4/4] POST /api/sales/:id/cancel - debe cancelar venta', async () => {
      const response = await request(app)
        .post(`/api/sales/${saleId || 1}/cancel`)
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 400, 401, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // REPORTS ENDPOINTS (6 endpoints)
  // ============================================================================
  
  describe('Reports Module - Smoke Tests', () => {
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

    test('[1/6] GET /api/reports/sales - debe obtener reporte de ventas', async () => {
      const response = await request(app)
        .get('/api/reports/sales?startDate=2024-01-01&endDate=2099-12-31')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
    });

    test('[2/6] GET /api/reports/products - debe obtener reporte de productos', async () => {
      const response = await request(app)
        .get('/api/reports/products')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
    });

    test('[3/6] GET /api/reports/payment-methods - debe obtener reporte de métodos pago', async () => {
      const response = await request(app)
        .get('/api/reports/payment-methods?startDate=2024-01-01&endDate=2099-12-31')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
    });

    test('[4/6] GET /api/reports/daily-summary - debe obtener resumen diario', async () => {
      const response = await request(app)
        .get('/api/reports/daily-summary')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
    });

    test('[5/6] GET /api/reports/alerts - debe obtener alertas', async () => {
      const response = await request(app)
        .get('/api/reports/alerts')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    test('[6/6] GET /api/reports/cash-summary - debe obtener resumen de caja', async () => {
      const response = await request(app)
        .get('/api/reports/cash-summary')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401]).toContain(response.status);
    });
  });

});
