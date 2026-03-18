/**
 * SMOKE TESTS - UNITS MODULE
 * Tests contra BASE DE DATOS REAL en producción
 * Sin mocks, sin stubs - TODO es REAL
 * Autor: OpenCode
 * Fecha: 2026-02-18
 */

import request from 'supertest';
import app from '../../src/index.js';

describe('🔥 SMOKE TESTS - UNITS MODULE (Base de Datos REAL)', () => {
  let adminToken = '';

  // ============================================================================
  // SETUP: Obtener token de usuario real
  // ============================================================================

  beforeAll(async () => {
    console.log('\n📋 Setup: Obteniendo token de usuario real...');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    if (loginResponse.status === 200) {
      adminToken = loginResponse.body.data.tokens.accessToken;
      console.log('✓ Token Admin obtenido');
    } else {
      console.error('✗ Error login Admin:', loginResponse.body.message);
    }
  });

  // ============================================================================
  // TEST 1: GET /api/units - Listar todas las unidades
  // ============================================================================

  test('[1/3] GET /api/units - debe listar todas las unidades de medida', async () => {
    console.log('\n🧪 Test 1/3: GET /api/units');
    
    const response = await request(app)
      .get('/api/units')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('count');
    expect(Array.isArray(response.body.data)).toBe(true);
    
    // Validar que existan las unidades pre-cargadas
    expect(response.body.data.length).toBeGreaterThan(0);
    
    // Verificar estructura de cada unidad
    response.body.data.forEach(unit => {
      expect(unit).toHaveProperty('unit_id');
      expect(unit).toHaveProperty('unit_code');
      expect(unit).toHaveProperty('unit_name');
      expect(unit).toHaveProperty('unit_type');
      expect(unit).toHaveProperty('conversion_factor');
    });

    console.log(`  ✓ Se retornaron ${response.body.data.length} unidades de medida`);
    console.log(`  Unidades encontradas:`);
    response.body.data.slice(0, 5).forEach(unit => {
      console.log(`    - ${unit.unit_code}: ${unit.unit_name} (${unit.unit_type})`);
    });
  });

  // ============================================================================
  // TEST 2: GET /api/units/:id - Obtener una unidad por ID
  // ============================================================================

  test('[2/3] GET /api/units/:id - debe obtener detalle de una unidad', async () => {
    console.log('\n🧪 Test 2/3: GET /api/units/:id');
    
    // Primero obtener lista para conseguir un ID válido
    const listResponse = await request(app)
      .get('/api/units')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listResponse.status).toBe(200);
    const unitId = listResponse.body.data[0].unit_id;

    // Ahora obtener ese unitId específico
    const response = await request(app)
      .get(`/api/units/${unitId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(`  Status: ${response.status}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('unit_id', unitId);
    expect(response.body.data).toHaveProperty('unit_code');
    expect(response.body.data).toHaveProperty('unit_name');
    expect(response.body.data).toHaveProperty('unit_type');
    
    console.log(`  ✓ Unidad encontrada: ${response.body.data.unit_code} - ${response.body.data.unit_name}`);
  });

  // ============================================================================
  // TEST 3: GET /api/units/type/:unitType - Filtrar por tipo
  // ============================================================================

  test('[3/3] GET /api/units/type/:unitType - debe filtrar unidades por tipo', async () => {
    console.log('\n🧪 Test 3/3: GET /api/units/type/:unitType');
    
    const unitTypes = ['QUANTITY', 'WEIGHT', 'VOLUME'];

    for (const unitType of unitTypes) {
      const response = await request(app)
        .get(`/api/units/type/${unitType}`)
        .set('Authorization', `Bearer ${adminToken}`);

      console.log(`  Status: ${response.status} (${unitType})`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Validar que todas las unidades sean del tipo solicitado
      response.body.data.forEach(unit => {
        expect(unit.unit_type).toBe(unitType);
      });

      console.log(`  ✓ ${unitType}: ${response.body.count} unidades`);
      response.body.data.forEach(unit => {
        console.log(`    - ${unit.unit_code}: ${unit.unit_name}`);
      });
    }
  });
});
