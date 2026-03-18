@echo off
REM Setup variables de entorno y ejecutar tests
set NODE_ENV=test
call npm run test:smoke-internal %*
