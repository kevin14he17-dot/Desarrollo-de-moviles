#!/bin/bash

# ============================================================================
# TESTING VERIFICATION SCRIPT
# Este script verifica que la estructura de testing está completa
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✓ TESTING STRUCTURE VERIFICATION                         ║"
echo "║  Verificando que todos los tests estén configurados       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

TOTAL_FILES=0
FOUND_FILES=0

# ============================================================================
# VERIFICAR ARCHIVOS DE TEST
# ============================================================================

echo "📁 Verificando archivos de test..."
echo ""

# Backend smoke tests
echo -n "  [1/8] tests/backend/smoke.test.js ... "
if [ -f "tests/backend/smoke.test.js" ]; then
  LINES=$(wc -l < tests/backend/smoke.test.js)
  echo "✅ $LINES líneas"
  ((FOUND_FILES++))
else
  echo "❌ NO ENCONTRADO"
fi
((TOTAL_FILES++))

# Backend journey tests
echo -n "  [2/8] tests/backend/journey.test.js ... "
if [ -f "tests/backend/journey.test.js" ]; then
  LINES=$(wc -l < tests/backend/journey.test.js)
  echo "✅ $LINES líneas"
  ((FOUND_FILES++))
else
  echo "❌ NO ENCONTRADO"
fi
((TOTAL_FILES++))

# Frontend smoke tests
echo -n "  [3/8] frontend/tests/components.smoke.test.js ... "
if [ -f "frontend/tests/components.smoke.test.js" ]; then
  LINES=$(wc -l < frontend/tests/components.smoke.test.js)
  echo "✅ $LINES líneas"
  ((FOUND_FILES++))
else
  echo "❌ NO ENCONTRADO"
fi
((TOTAL_FILES++))

# Frontend journey tests
echo -n "  [4/8] frontend/tests/journey.test.js ... "
if [ -f "frontend/tests/journey.test.js" ]; then
  LINES=$(wc -l < frontend/tests/journey.test.js)
  echo "✅ $LINES líneas"
  ((FOUND_FILES++))
else
  echo "❌ NO ENCONTRADO"
fi
((TOTAL_FILES++))

# Jest config
echo -n "  [5/8] jest.config.js ... "
if [ -f "jest.config.js" ]; then
  echo "✅"
  ((FOUND_FILES++))
else
  echo "❌ NO ENCONTRADO"
fi
((TOTAL_FILES++))

# Vitest config
echo -n "  [6/8] frontend/vitest.config.js ... "
if [ -f "frontend/vitest.config.js" ]; then
  echo "✅"
  ((FOUND_FILES++))
else
  echo "❌ NO ENCONTRADO"
fi
((TOTAL_FILES++))

# Setup file
echo -n "  [7/8] frontend/tests/setup.js ... "
if [ -f "frontend/tests/setup.js" ]; then
  echo "✅"
  ((FOUND_FILES++))
else
  echo "❌ NO ENCONTRADO"
fi
((TOTAL_FILES++))

# Run scripts
echo -n "  [8/8] run-all-tests.sh ... "
if [ -f "run-all-tests.sh" ]; then
  echo "✅"
  ((FOUND_FILES++))
else
  echo "❌ NO ENCONTRADO"
fi
((TOTAL_FILES++))

echo ""

# ============================================================================
# VERIFICAR DEPENDENCIAS
# ============================================================================

echo "📦 Verificando dependencias instaladas..."
echo ""

# Backend dependencies
echo "  Backend:"
echo -n "    - jest ... "
if npm list jest 2>/dev/null | grep -q jest; then
  echo "✅"
else
  echo "❌ FALTA INSTALAR: npm install --save-dev jest"
fi

echo -n "    - supertest ... "
if npm list supertest 2>/dev/null | grep -q supertest; then
  echo "✅"
else
  echo "❌ FALTA INSTALAR"
fi

# Frontend dependencies
echo ""
echo "  Frontend:"
echo -n "    - vitest ... "
if (cd frontend && npm list vitest 2>/dev/null | grep -q vitest); then
  echo "✅"
else
  echo "❌ FALTA INSTALAR: cd frontend && npm install --save-dev vitest"
fi

echo -n "    - @testing-library/react ... "
if (cd frontend && npm list @testing-library/react 2>/dev/null | grep -q @testing-library/react); then
  echo "✅"
else
  echo "❌ FALTA INSTALAR"
fi

echo ""

# ============================================================================
# VERIFICAR SCRIPTS EN PACKAGE.JSON
# ============================================================================

echo "📝 Verificando scripts en package.json..."
echo ""

echo "  Backend scripts:"
echo -n "    - npm run test:smoke ... "
if grep -q "test:smoke" package.json; then
  echo "✅"
else
  echo "❌"
fi

echo -n "    - npm run test:journey ... "
if grep -q "test:journey" package.json; then
  echo "✅"
else
  echo "❌"
fi

echo -n "    - npm run test:coverage ... "
if grep -q "test:coverage" package.json; then
  echo "✅"
else
  echo "❌"
fi

echo ""
echo "  Frontend scripts:"
cd frontend
echo -n "    - npm run test:smoke ... "
if grep -q "test:smoke" package.json; then
  echo "✅"
else
  echo "❌"
fi

echo -n "    - npm run test:journey ... "
if grep -q "test:journey" package.json; then
  echo "✅"
else
  echo "❌"
fi

cd ..

echo ""

# ============================================================================
# VERIFICAR CONTENIDO DE TESTS
# ============================================================================

echo "📋 Verificando contenido de los tests..."
echo ""

echo "  Backend smoke tests:"
echo -n "    - Health check test ... "
grep -q "Health Check" tests/backend/smoke.test.js && echo "✅" || echo "❌"

echo -n "    - Auth tests (5) ... "
grep -q "Auth Module" tests/backend/smoke.test.js && echo "✅" || echo "❌"

echo -n "    - Product tests (4) ... "
grep -q "Product Module" tests/backend/smoke.test.js && echo "✅" || echo "❌"

echo -n "    - Inventory tests (6) ... "
grep -q "Inventory Module" tests/backend/smoke.test.js && echo "✅" || echo "❌"

echo -n "    - Cash Drawer tests (6) ... "
grep -q "Cash Drawer Module" tests/backend/smoke.test.js && echo "✅" || echo "❌"

echo -n "    - Sales tests (4) ... "
grep -q "Sales Module" tests/backend/smoke.test.js && echo "✅" || echo "❌"

echo -n "    - Reports tests (6) ... "
grep -q "Reports Module" tests/backend/smoke.test.js && echo "✅" || echo "❌"

echo ""

echo "  Backend journey tests:"
echo -n "    - Login flow (5 pasos) ... "
grep -q "JOURNEY 1" tests/backend/journey.test.js && echo "✅" || echo "❌"

echo -n "    - POS flow (5 pasos) ... "
grep -q "JOURNEY 2" tests/backend/journey.test.js && echo "✅" || echo "❌"

echo -n "    - Cash Drawer flow (7 pasos) ... "
grep -q "JOURNEY 3" tests/backend/journey.test.js && echo "✅" || echo "❌"

echo -n "    - Inventory flow (8 pasos) ... "
grep -q "JOURNEY 4" tests/backend/journey.test.js && echo "✅" || echo "❌"

echo -n "    - Reports flow (6 pasos) ... "
grep -q "JOURNEY 5" tests/backend/journey.test.js && echo "✅" || echo "❌"

echo ""

echo "  Frontend journey tests:"
echo -n "    - 8 journeys totales ... "
grep -q "JOURNEY 8" frontend/tests/journey.test.js && echo "✅" || echo "❌"

echo -n "    - 48 test cases aprox ... "
TEST_COUNT=$(grep -c "test('✓" frontend/tests/journey.test.js)
echo "✅ ($TEST_COUNT encontrados)"

echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  📊 RESUMEN DE VERIFICACIÓN                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Archivos encontrados: $FOUND_FILES/$TOTAL_FILES"
echo ""

if [ $FOUND_FILES -eq $TOTAL_FILES ]; then
  echo "✅ ESTRUCTURA DE TESTING COMPLETAMENTE CONFIGURADA"
  echo ""
  echo "Para ejecutar los tests:"
  echo "  • Todos: bash run-all-tests.sh"
  echo "  • Backend Smoke: npm run test:smoke"
  echo "  • Backend Journey: npm run test:journey"
  echo "  • Frontend Smoke: cd frontend && npm run test:smoke"
  echo "  • Frontend Journey: cd frontend && npm run test:journey"
else
  echo "⚠️  ALGUNOS ARCHIVOS FALTAN"
  echo "Por favor, instala los archivos faltantes y reintenta"
fi

echo ""
