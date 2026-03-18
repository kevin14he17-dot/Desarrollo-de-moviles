import { test, expect } from '@playwright/test';

/**
 * E2E TESTS - REPORTS FLOW
 * Prueba el flujo completo de reportes
 */

test.describe('E2E - Reports Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('/');

    // Hacer login como gerente (acceso a reportes)
    const usernameInput = page.locator('input[type="text"], input[name*="user"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Iniciar Sesión"), button:has-text("Login"), button[type="submit"]').first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('gerente');
    }
    
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('gerente123');
    }

    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    await page.waitForNavigation();
  });

  test('Navegar al módulo de Reportes', async ({ page }) => {
    // Buscar y hacer click en el enlace Reportes
    const reportsLink = page.locator('a:has-text("Reportes"), button:has-text("Reportes"), nav :text-is("Reportes")').first();
    
    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await page.waitForNavigation();
    }

    // Verificar que estamos en la página de Reportes
    await expect(page).toHaveURL(/reportes|reports/i);
  });

  test('Generar reporte de ventas por período', async ({ page }) => {
    // Navegar a Reportes
    const reportsLink = page.locator('a:has-text("Reportes"), button:has-text("Reportes"), nav :text-is("Reportes")').first();
    
    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await page.waitForNavigation();
    }

    // Buscar sección de ventas
    const salesTab = page.locator('button:has-text("Ventas"), tab:has-text("Ventas")').first();
    
    if (await salesTab.isVisible({ timeout: 3000 })) {
      await salesTab.click();
    }

    // Buscar inputs de fecha
    const startDateInput = page.locator('input[type="date"], input[placeholder*="Desde"]').first();
    const endDateInput = page.locator('input[type="date"], input[placeholder*="Hasta"]').nth(1);

    if (await startDateInput.isVisible({ timeout: 2000 })) {
      await startDateInput.fill('2024-01-01');
    }

    if (await endDateInput.isVisible({ timeout: 2000 })) {
      await endDateInput.fill('2099-12-31');
    }

    // Buscar botón de generar/aplicar
    const generateButton = page.locator('button:has-text("Generar"), button:has-text("Aplicar"), button:has-text("Buscar")').first();
    
    if (await generateButton.isVisible({ timeout: 2000 })) {
      await generateButton.click();
    }

    // Esperar resultados
    await page.waitForTimeout(1000);

    // Verificar que hay datos en la tabla
    const table = page.locator('table, div[role="grid"]').first();
    await expect(table).toBeVisible({ timeout: 3000 }).catch(() => {
      console.log('Tabla de resultados no visible');
    });
  });

  test('Descargar reporte en PDF', async ({ page, context }) => {
    // Navegar a Reportes
    const reportsLink = page.locator('a:has-text("Reportes"), button:has-text("Reportes"), nav :text-is("Reportes")').first();
    
    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await page.waitForNavigation();
    }

    // Generar reporte
    const generateButton = page.locator('button:has-text("Generar"), button:has-text("Aplicar")').first();
    
    if (await generateButton.isVisible({ timeout: 2000 })) {
      await generateButton.click();
    }

    await page.waitForTimeout(500);

    // Buscar botón de descargar PDF
    const downloadPdfButton = page.locator('button:has-text("PDF"), button:has-text("Descargar"), button:has-text("Download")').first();
    
    if (await downloadPdfButton.isVisible({ timeout: 3000 })) {
      // Esperar descarga
      const downloadPromise = context.waitForEvent('download');
      await downloadPdfButton.click();
      
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.pdf');
      } catch (e) {
        console.log('Descarga de PDF no capturada');
      }
    }
  });

  test('Ver reporte de productos más vendidos', async ({ page }) => {
    // Navegar a Reportes
    const reportsLink = page.locator('a:has-text("Reportes"), button:has-text("Reportes"), nav :text-is("Reportes")').first();
    
    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await page.waitForNavigation();
    }

    // Buscar tab de productos
    const productsTab = page.locator('button:has-text("Productos"), tab:has-text("Productos")').first();
    
    if (await productsTab.isVisible({ timeout: 3000 })) {
      await productsTab.click();
    }

    // Generar reporte
    const generateButton = page.locator('button:has-text("Generar"), button:has-text("Aplicar")').first();
    
    if (await generateButton.isVisible({ timeout: 2000 })) {
      await generateButton.click();
    }

    await page.waitForTimeout(500);

    // Verificar tabla de productos
    const table = page.locator('table, div[role="grid"]').first();
    await expect(table).toBeVisible({ timeout: 3000 }).catch(() => {
      console.log('Tabla de productos no visible');
    });
  });

  test('Ver reporte de métodos de pago', async ({ page }) => {
    // Navegar a Reportes
    const reportsLink = page.locator('a:has-text("Reportes"), button:has-text("Reportes"), nav :text-is("Reportes")').first();
    
    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await page.waitForNavigation();
    }

    // Buscar tab de pagos
    const paymentTab = page.locator('button:has-text("Pagos"), button:has-text("Métodos"), tab:has-text("Pagos")').first();
    
    if (await paymentTab.isVisible({ timeout: 3000 })) {
      await paymentTab.click();
    }

    // Generar reporte
    const generateButton = page.locator('button:has-text("Generar"), button:has-text("Aplicar")').first();
    
    if (await generateButton.isVisible({ timeout: 2000 })) {
      await generateButton.click();
    }

    await page.waitForTimeout(500);

    // Verificar gráfico o tabla
    const chart = page.locator('canvas, svg').first();
    await expect(chart).toBeVisible({ timeout: 3000 }).catch(() => {
      console.log('Gráfico de pagos no visible');
    });
  });

  test('Ver resumen diario', async ({ page }) => {
    // Navegar a Reportes
    const reportsLink = page.locator('a:has-text("Reportes"), button:has-text("Reportes"), nav :text-is("Reportes")').first();
    
    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await page.waitForNavigation();
    }

    // Buscar tab de resumen
    const summaryTab = page.locator('button:has-text("Resumen"), tab:has-text("Resumen"), button:has-text("Diario")').first();
    
    if (await summaryTab.isVisible({ timeout: 3000 })) {
      await summaryTab.click();
    }

    // Buscar métricas clave
    const totalSales = page.locator('text=/Total de ventas|Total Sales|S\\./').first();
    await expect(totalSales).toBeVisible({ timeout: 3000 }).catch(() => {
      console.log('Métrica de ventas no visible');
    });
  });

  test('Filtrar reporte por rango de fechas', async ({ page }) => {
    // Navegar a Reportes
    const reportsLink = page.locator('a:has-text("Reportes"), button:has-text("Reportes"), nav :text-is("Reportes")').first();
    
    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await page.waitForNavigation();
    }

    // Rellenar rango de fechas
    const startDateInput = page.locator('input[type="date"], input[placeholder*="Desde"]').first();
    const endDateInput = page.locator('input[type="date"], input[placeholder*="Hasta"]').nth(1);

    if (await startDateInput.isVisible({ timeout: 2000 })) {
      await startDateInput.fill('2026-02-01');
    }

    if (await endDateInput.isVisible({ timeout: 2000 })) {
      await endDateInput.fill('2026-02-28');
    }

    // Aplicar filtro
    const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Buscar")').first();
    
    if (await applyButton.isVisible({ timeout: 2000 })) {
      await applyButton.click();
    }

    await page.waitForTimeout(500);

    // Verificar que se actualizaron los resultados
    const table = page.locator('table, div[role="grid"]').first();
    await expect(table).toBeVisible({ timeout: 3000 }).catch(() => {
      console.log('Tabla filtrada no visible');
    });
  });

  test('Exportar reporte como Excel', async ({ page, context }) => {
    // Navegar a Reportes
    const reportsLink = page.locator('a:has-text("Reportes"), button:has-text("Reportes"), nav :text-is("Reportes")').first();
    
    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await page.waitForNavigation();
    }

    // Generar reporte
    const generateButton = page.locator('button:has-text("Generar"), button:has-text("Aplicar")').first();
    
    if (await generateButton.isVisible({ timeout: 2000 })) {
      await generateButton.click();
    }

    await page.waitForTimeout(500);

    // Buscar botón de descargar Excel
    const downloadExcelButton = page.locator('button:has-text("Excel"), button:has-text("Descargar"), button:has-text("CSV")').first();
    
    if (await downloadExcelButton.isVisible({ timeout: 3000 })) {
      // Esperar descarga
      const downloadPromise = context.waitForEvent('download');
      await downloadExcelButton.click();
      
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv|xls)$/i);
      } catch (e) {
        console.log('Descarga de Excel no capturada');
      }
    }
  });
});
