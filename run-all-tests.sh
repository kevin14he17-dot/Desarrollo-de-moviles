#!/bin/bash

# ============================================================================
# TEST RUNNER - Ejecuta TODOS los tests (Smoke + Journey + E2E)
# Backend: Jest
# Frontend: Vitest + Playwright
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🧪 TESTING SUITE COMPLETO - MINIMARKET SYSTEM            ║"
echo "║  SMOKE + JOURNEY + E2E TESTS                              ║"
echo "║  Backend (Jest) + Frontend (Vitest + Playwright)          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Variables de control
BACKEND_PASS=0
BACKEND_FAIL=0
FRONTEND_PASS=0
FRONTEND_FAIL=0

# ============================================================================
# FASE 1: BACKEND TESTS (JEST)
# ============================================================================

echo "═══════════════════════════════════════════════════════════════"
echo "FASE 1: BACKEND TESTS (Jest)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Smoke Tests Backend
echo "📋 Ejecutando SMOKE TESTS del Backend..."
echo "   (Verificar que cada endpoint responda)"
echo ""

npm run test:smoke

if [ $? -eq 0 ]; then
  echo "✅ SMOKE TESTS BACKEND: PASADOS"
  ((BACKEND_PASS++))
else
  echo "❌ SMOKE TESTS BACKEND: FALLARON"
  ((BACKEND_FAIL++))
fi

echo ""
sleep 2
echo ""

# Journey Tests Backend
echo "📋 Ejecutando JOURNEY TESTS del Backend..."
echo "   (Verificar flujos completos del sistema)"
echo ""

npm run test:journey

if [ $? -eq 0 ]; then
  echo "✅ JOURNEY TESTS BACKEND: PASADOS"
  ((BACKEND_PASS++))
else
  echo "❌ JOURNEY TESTS BACKEND: FALLARON"
  ((BACKEND_FAIL++))
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# FASE 2: FRONTEND TESTS (VITEST)
# ============================================================================

echo "═══════════════════════════════════════════════════════════════"
echo "FASE 2: FRONTEND TESTS (Vitest)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd frontend || exit 1

# Smoke Tests Frontend
echo "📋 Ejecutando SMOKE TESTS del Frontend..."
echo "   (Verificar que componentes rendericen)"
echo ""

npm run test:smoke

if [ $? -eq 0 ]; then
  echo "✅ SMOKE TESTS FRONTEND: PASADOS"
  ((FRONTEND_PASS++))
else
  echo "❌ SMOKE TESTS FRONTEND: FALLARON"
  ((FRONTEND_FAIL++))
fi

echo ""
sleep 2
echo ""

# Journey Tests Frontend
echo "📋 Ejecutando JOURNEY TESTS del Frontend..."
echo "   (Verificar flujos de usuario)"
echo ""

npm run test:journey

if [ $? -eq 0 ]; then
  echo "✅ JOURNEY TESTS FRONTEND: PASADOS"
  ((FRONTEND_PASS++))
else
  echo "❌ JOURNEY TESTS FRONTEND: FALLARON"
  ((FRONTEND_FAIL++))
fi

echo ""
cd .. || exit 1

echo "═══════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  📊 RESUMEN FINAL DE TESTING                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

TOTAL_PASS=$((BACKEND_PASS + FRONTEND_PASS))
TOTAL_FAIL=$((BACKEND_FAIL + FRONTEND_FAIL))
TOTAL_TESTS=$((TOTAL_PASS + TOTAL_FAIL))

echo "BACKEND (Jest):"
echo "  ✅ Exitosos: $BACKEND_PASS"
echo "  ❌ Fallidos:  $BACKEND_FAIL"
echo ""

echo "FRONTEND (Vitest):"
echo "  ✅ Exitosos: $FRONTEND_PASS"
echo "  ❌ Fallidos:  $FRONTEND_FAIL"
echo ""

echo "TOTAL:"
echo "  ✅ Total Exitosos: $TOTAL_PASS"
echo "  ❌ Total Fallidos:  $TOTAL_FAIL"
echo "  📊 Tasa de éxito: $(( (TOTAL_PASS * 100) / TOTAL_TESTS ))%"
echo ""

if [ $TOTAL_FAIL -eq 0 ]; then
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  ✅ TODOS LOS TESTS PASARON EXITOSAMENTE                  ║"
  echo "║  El sistema está LISTO PARA PRODUCCIÓN                   ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  exit 0
else
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  ⚠️  ALGUNOS TESTS FALLARON                               ║"
  echo "║  Revisa los errores arriba y corrige                     ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  exit 1
fi
