/**
 * SMOKE TESTS - PRODUCTS MODULE
 * Tests contra BASE DE DATOS REAL en producción
 * Sin mocks, sin stubs - TODO es REAL
 * Autor: OpenCode
 * Fecha: 2026-02-18
 */

import request from 'supertest';
import app from '../../src/index.js';

describe('🔥 SMOKE TESTS - PRODUCTS MODULE (Base de Datos REAL)', () => {
  let adminToken = '';
  let gerenteToken = '';
  let cajeroToken = '';
  let createdProductId = null;
  let testBarcode = 'SMOKE_TEST_' + Date.now();

  // ============================================================================
  // SETUP: Obtener tokens de usuarios reales
  // ============================================================================

  beforeAll(async () => {
    console.log('\n📋 Setup: Obteniendo tokens de usuarios reales...');

    // Login como Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    if (adminLogin.status === 200) {
      adminToken = adminLogin.body.data.tokens.accessToken;
      console.log('✓ Token Admin obtenido');
    } else {
      console.error('✗ Error login Admin:', adminLogin.body.message);
    }

    // Login como Gerente
    const gerenteLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'gerente',
        password: 'gerente123'
      });

    if (gerenteLogin.status === 200) {
      gerenteToken = gerenteLogin.body.data.tokens.accessToken;
      console.log('✓ Token Gerente obtenido');
    }

    // Login como Cajero
    const cajeroLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'cajero',
        password: 'cajero123'
      });

    if (cajeroLogin.status === 200) {
      cajeroToken = cajeroLogin.body.data.tokens.accessToken;
      console.log('✓ Token Cajero obtenido');
    }
  });

  // ============================================================================
  // TEST 1: GET /api/products - Listar productos (cualquier usuario autenticado)
  // ============================================================================

  test('[1/13] GET /api/products - debe listar productos paginados', async () => {
    console.log('\n🧪 Test 1/13: GET /api/products');
    
    const response = await request(app)
      .get('/api/products')
      .query({ page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(Array.isArray(response.body.data)).toBe(true);
    console.log(`  ✓ Se retornaron ${response.body.data.length} productos`);
  });

  // ============================================================================
  // TEST 2: GET /api/products/low-stock - Productos con stock bajo
  // ============================================================================

  test('[2/13] GET /api/products/low-stock - debe obtener productos con stock crítico', async () => {
    console.log('\n🧪 Test 2/13: GET /api/products/low-stock');
    
    const response = await request(app)
      .get('/api/products/low-stock')
      .query({ limit: 5 })
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('count');
    expect(Array.isArray(response.body.data)).toBe(true);
    console.log(`  ✓ Se encontraron ${response.body.count} productos con stock bajo`);
  });

  // ============================================================================
  // TEST 3: POST /api/products - Crear producto (requiere Admin/Gerente)
  // ============================================================================

  test('[3/13] POST /api/products - debe crear producto como Admin', async () => {
    console.log('\n🧪 Test 3/13: POST /api/products');
    
    const productData = {
      barcode: testBarcode,
      productName: 'Producto Test Smoke ' + Date.now(),
      categoryId: 1,
      unitId: 1,
      costPrice: 50.00,
      sellingPrice: 100.00,
      stockActual: 10,
      stockMinimo: 5,
      stockMaximo: 100,
      quantityPerUnit: 1
    };

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('exitosamente');
    expect(response.body.data).toHaveProperty('product_id');
    expect(response.body.data).toHaveProperty('barcode', testBarcode);
    
    createdProductId = response.body.data.product_id;
    console.log(`  ✓ Producto creado con ID: ${createdProductId}`);
  });

  // ============================================================================
  // TEST 4: GET /api/products/:id - Obtener producto por ID
  // ============================================================================

  test('[4/13] GET /api/products/:id - debe obtener detalle del producto', async () => {
    console.log('\n🧪 Test 4/13: GET /api/products/:id');
    
    if (!createdProductId) {
      console.log('  ⊘ Saltando: No hay producto creado');
      return;
    }

    const response = await request(app)
      .get(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('product_id', createdProductId);
    expect(response.body.data).toHaveProperty('barcode', testBarcode);
    console.log(`  ✓ Producto encontrado: ${response.body.data.product_name}`);
  });

  // ============================================================================
  // TEST 5: GET /api/products?categoryId=X - Filtrar por categoría
  // ============================================================================

  test('[5/13] GET /api/products?categoryId=1 - debe filtrar productos por categoría', async () => {
    console.log('\n🧪 Test 5/13: GET /api/products?categoryId=1');
    
    const response = await request(app)
      .get('/api/products')
      .query({ categoryId: 1, page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    
    if (response.body.data.length > 0) {
      expect(response.body.data[0]).toHaveProperty('category_id', 1);
      console.log(`  ✓ Se encontraron ${response.body.data.length} productos de categoría 1`);
    } else {
      console.log(`  ℹ No hay productos en categoría 1`);
    }
  });

  // ============================================================================
  // TEST 6: GET /api/products?searchTerm=X - Búsqueda por nombre/barcode
  // ============================================================================

  test('[6/13] GET /api/products?searchTerm=X - debe buscar productos por nombre', async () => {
    console.log('\n🧪 Test 6/13: GET /api/products?searchTerm=X');
    
    const response = await request(app)
      .get('/api/products')
      .query({ searchTerm: 'Coca', page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    console.log(`  ✓ Búsqueda completada: ${response.body.data.length} resultados`);
  });

  // ============================================================================
  // TEST 7: PUT /api/products/:id - Actualizar producto completo
  // ============================================================================

  test('[7/13] PUT /api/products/:id - debe actualizar producto completo', async () => {
    console.log('\n🧪 Test 7/13: PUT /api/products/:id');
    
    if (!createdProductId) {
      console.log('  ⊘ Saltando: No hay producto creado');
      return;
    }

    const updateData = {
      barcode: testBarcode,  // Usar el mismo barcode
      productName: 'Producto Actualizado ' + Date.now(),
      categoryId: 1,
      unitId: 1,
      costPrice: 55.00,
      sellingPrice: 110.00,
      stockMinimo: 3,
      stockMaximo: 150,
      quantityPerUnit: 2
    };

    const response = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${gerenteToken}`)
      .send(updateData);

    console.log(`  Status: ${response.status}`);
    if (response.status !== 200) {
      console.log(`  Error: ${response.body.message}`);
      console.log(`  Full response:`, JSON.stringify(response.body, null, 2));
    }
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.product_name).toBe(updateData.productName);
    expect(response.body.data.cost_price).toBe(updateData.costPrice);
    console.log(`  ✓ Producto actualizado correctamente`);
  });

  // ============================================================================
  // TEST 8: PATCH /api/products/:id/prices - Actualizar solo precios
  // ============================================================================

  test('[8/13] PATCH /api/products/:id/prices - debe actualizar precios', async () => {
    console.log('\n🧪 Test 8/13: PATCH /api/products/:id/prices');
    
    if (!createdProductId) {
      console.log('  ⊘ Saltando: No hay producto creado');
      return;
    }

    const priceUpdate = {
      costPrice: 60.00,
      sellingPrice: 120.00
    };

    const response = await request(app)
      .patch(`/api/products/${createdProductId}/prices`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(priceUpdate);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.cost_price).toBe(priceUpdate.costPrice);
    expect(response.body.data.selling_price).toBe(priceUpdate.sellingPrice);
    console.log(`  ✓ Precios actualizados: $${priceUpdate.costPrice} → $${priceUpdate.sellingPrice}`);
  });

  // ============================================================================
  // TEST 9: PATCH /api/products/:id/stock - Actualizar stock
  // ============================================================================

  test('[9/13] PATCH /api/products/:id/stock - debe actualizar stock del producto', async () => {
    console.log('\n🧪 Test 9/13: PATCH /api/products/:id/stock');
    
    if (!createdProductId) {
      console.log('  ⊘ Saltando: No hay producto creado');
      return;
    }

    const stockUpdate = {
      stock: 50
    };

    const response = await request(app)
      .patch(`/api/products/${createdProductId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(stockUpdate);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.stock_actual).toBe(stockUpdate.stock);
    console.log(`  ✓ Stock actualizado a ${stockUpdate.stock} unidades`);
  });

  // ============================================================================
  // TEST 10: Validación - POST sin permisos (Cajero) debe fallar
  // ============================================================================

  test('[10/13] POST /api/products (Cajero) - debe rechazar sin permiso Admin/Gerente', async () => {
    console.log('\n🧪 Test 10/13: POST /api/products (Cajero)');
    
    const productData = {
      barcode: 'TEST_' + Date.now(),
      productName: 'Test Cajero',
      categoryId: 1,
      unitId: 1,
      costPrice: 10.00,
      sellingPrice: 20.00
    };

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send(productData);

    console.log(`  Status: ${response.status}`);
    expect([403, 401]).toContain(response.status);
    console.log(`  ✓ Acceso denegado correctamente (${response.status})`);
  });

  // ============================================================================
  // TEST 11: Validación - Precios inválidos deben fallar
  // ============================================================================

  test('[11/13] POST /api/products - debe rechazar si precio_venta < precio_costo', async () => {
    console.log('\n🧪 Test 11/13: POST /api/products - Validación de precios');
    
    const productData = {
      barcode: 'INVALID_' + Date.now(),
      productName: 'Producto Inválido',
      categoryId: 1,
      unitId: 1,
      costPrice: 100.00,
      sellingPrice: 50.00  // ✗ Precio venta < precio costo
    };

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    console.log(`  ✓ Validación correcta: ${response.body.message}`);
  });

  // ============================================================================
  // TEST 12: Validación - Barcode duplicado debe fallar
  // ============================================================================

  test('[12/13] POST /api/products - debe rechazar barcode duplicado', async () => {
    console.log('\n🧪 Test 12/13: POST /api/products - Barcode duplicado');
    
    if (!testBarcode) {
      console.log('  ⊘ Saltando: No hay barcode para probar');
      return;
    }

    const productData = {
      barcode: testBarcode,  // ✗ Ya existe
      productName: 'Producto Duplicado',
      categoryId: 1,
      unitId: 1,
      costPrice: 30.00,
      sellingPrice: 60.00
    };

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);

    console.log(`  Status: ${response.status}`);
    if (response.status !== 400) {
      console.log(`  Error Response:`, response.body);
    }
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    if (response.body.message) {
      expect(response.body.message.toLowerCase()).toMatch(/(barr|código|duplicad)/i);
    }
    console.log(`  ✓ Validación correcta: ${response.body.message || 'Barcode duplicado rechazado'}`);
  });

  // ============================================================================
  // TEST 13: DELETE /api/products/:id - Eliminar producto (soft delete)
  // ============================================================================

  test('[13/13] DELETE /api/products/:id - debe eliminar producto (soft delete)', async () => {
    console.log('\n🧪 Test 13/13: DELETE /api/products/:id');
    
    if (!createdProductId) {
      console.log('  ⊘ Saltando: No hay producto creado');
      return;
    }

    const response = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('eliminado');

    // Verificar que el producto está marcado como inactivo
    const getResponse = await request(app)
      .get(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getResponse.status).toBe(404);
    console.log(`  ✓ Producto eliminado correctamente (soft delete)`);
  });
});
