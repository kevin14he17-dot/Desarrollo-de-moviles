@echo off
REM ============================================================================
REM TEST RUNNER - Ejecuta TODOS los tests (Smoke + Journey)
REM Backend: Jest
REM Frontend: Vitest
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  ^!~!~!~! TESTING SUITE - MINIMARKET SYSTEM              ║
echo ║  Smoke Tests + Journey Tests                              ║
echo ║  Backend (Jest) + Frontend (Vitest)                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set BACKEND_PASS=0
set BACKEND_FAIL=0
set FRONTEND_PASS=0
set FRONTEND_FAIL=0

REM ============================================================================
REM FASE 1: BACKEND TESTS (JEST)
REM ============================================================================

echo ═══════════════════════════════════════════════════════════════
echo FASE 1: BACKEND TESTS (Jest)
echo ═══════════════════════════════════════════════════════════════
echo.

REM Smoke Tests Backend
echo 📋 Ejecutando SMOKE TESTS del Backend...
echo    (Verificar que cada endpoint responda)
echo.

call npm run test:smoke
if !ERRORLEVEL! equ 0 (
    echo ✅ SMOKE TESTS BACKEND: PASADOS
    set /a BACKEND_PASS+=1
) else (
    echo ❌ SMOKE TESTS BACKEND: FALLARON
    set /a BACKEND_FAIL+=1
)

echo.
timeout /t 2 /nobreak
echo.

REM Journey Tests Backend
echo 📋 Ejecutando JOURNEY TESTS del Backend...
echo    (Verificar flujos completos del sistema)
echo.

call npm run test:journey
if !ERRORLEVEL! equ 0 (
    echo ✅ JOURNEY TESTS BACKEND: PASADOS
    set /a BACKEND_PASS+=1
) else (
    echo ❌ JOURNEY TESTS BACKEND: FALLARON
    set /a BACKEND_FAIL+=1
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM ============================================================================
REM FASE 2: FRONTEND TESTS (VITEST)
REM ============================================================================

echo ═══════════════════════════════════════════════════════════════
echo FASE 2: FRONTEND TESTS (Vitest)
echo ═══════════════════════════════════════════════════════════════
echo.

cd frontend || exit /b 1

REM Smoke Tests Frontend
echo 📋 Ejecutando SMOKE TESTS del Frontend...
echo    (Verificar que componentes rendericen)
echo.

call npm run test:smoke
if !ERRORLEVEL! equ 0 (
    echo ✅ SMOKE TESTS FRONTEND: PASADOS
    set /a FRONTEND_PASS+=1
) else (
    echo ❌ SMOKE TESTS FRONTEND: FALLARON
    set /a FRONTEND_FAIL+=1
)

echo.
timeout /t 2 /nobreak
echo.

REM Journey Tests Frontend
echo 📋 Ejecutando JOURNEY TESTS del Frontend...
echo    (Verificar flujos de usuario)
echo.

call npm run test:journey
if !ERRORLEVEL! equ 0 (
    echo ✅ JOURNEY TESTS FRONTEND: PASADOS
    set /a FRONTEND_PASS+=1
) else (
    echo ❌ JOURNEY TESTS FRONTEND: FALLARON
    set /a FRONTEND_FAIL+=1
)

echo.
cd ..

echo ═══════════════════════════════════════════════════════════════
echo.

REM ============================================================================
REM RESUMEN FINAL
REM ============================================================================

set /a TOTAL_PASS=%BACKEND_PASS% + %FRONTEND_PASS%
set /a TOTAL_FAIL=%BACKEND_FAIL% + %FRONTEND_FAIL%
set /a TOTAL_TESTS=%TOTAL_PASS% + %TOTAL_FAIL%

echo ╔════════════════════════════════════════════════════════════╗
echo ║  📊 RESUMEN FINAL DE TESTING                              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo BACKEND (Jest):
echo   ✅ Exitosos: %BACKEND_PASS%
echo   ❌ Fallidos:  %BACKEND_FAIL%
echo.

echo FRONTEND (Vitest):
echo   ✅ Exitosos: %FRONTEND_PASS%
echo   ❌ Fallidos:  %FRONTEND_FAIL%
echo.

echo TOTAL:
echo   ✅ Total Exitosos: %TOTAL_PASS%
echo   ❌ Total Fallidos:  %TOTAL_FAIL%

if %TOTAL_TESTS% equ 0 (
    echo   📊 Tasa de éxito: N/A
) else (
    set /a SUCCESS_RATE=(%TOTAL_PASS% * 100) / %TOTAL_TESTS%
    echo   📊 Tasa de éxito: !SUCCESS_RATE!%%
)
echo.

if %TOTAL_FAIL% equ 0 (
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║  ✅ TODOS LOS TESTS PASARON EXITOSAMENTE                  ║
    echo ║  El sistema está LISTO PARA PRODUCCIÓN                   ║
    echo ╚════════════════════════════════════════════════════════════╝
    exit /b 0
) else (
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║  ⚠️  ALGUNOS TESTS FALLARON                               ║
    echo ║  Revisa los errores arriba y corrige                     ║
    echo ╚════════════════════════════════════════════════════════════╝
    exit /b 1
)
