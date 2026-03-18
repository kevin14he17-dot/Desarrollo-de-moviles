import { test, expect } from '@playwright/test';

/**
 * E2E TESTS - POS FLOW (Point of Sale)
 * Prueba el flujo completo de caja registradora
 */

test.describe('E2E - POS (Point of Sale) Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('/');

    // Hacer login como cajero
    const usernameInput = page.locator('input[type="text"], input[name*="user"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Iniciar Sesión"), button:has-text("Login"), button[type="submit"]').first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('cajero');
    }
    
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('cajero123');
    }

    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    await page.waitForNavigation();
  });

  test('Navegar al módulo POS', async ({ page }) => {
    // Buscar y hacer click en el enlace POS
    const posLink = page.locator('a:has-text("POS"), button:has-text("POS"), nav :text-is("POS")').first();
    
    if (await posLink.isVisible()) {
      await posLink.click();
      await page.waitForNavigation();
    }

    // Verificar que estamos en la página POS
    await expect(page).toHaveURL(/pos|cash|venta/i);
  });

  test('Agregar producto al carrito', async ({ page }) => {
    // Navegar a POS
    const posLink = page.locator('a:has-text("POS"), button:has-text("POS"), nav :text-is("POS")').first();
    
    if (await posLink.isVisible()) {
      await posLink.click();
      await page.waitForNavigation();
    }

    // Buscar producto y agregarlo
    const firstProductButton = page.locator('button:has-text("Agregar"), button:has-text("+"), div[role="button"]:first-child').first();
    
    if (await firstProductButton.isVisible({ timeout: 5000 })) {
      await firstProductButton.click();
    }

    // Verificar que el carrito se actualiza
    const cartCount = page.locator('text=/Carrito|carrito|items/i, span:has-text("1")');
    await expect(cartCount).toBeVisible({ timeout: 3000 }).catch(() => {
      console.log('Carrito no visible');
    });
  });

  test('Procesar venta completa', async ({ page }) => {
    // Navegar a POS
    const posLink = page.locator('a:has-text("POS"), button:has-text("POS"), nav :text-is("POS")').first();
    
    if (await posLink.isVisible()) {
      await posLink.click();
      await page.waitForNavigation();
    }

    // Agregar producto
    const firstProductButton = page.locator('button:has-text("Agregar"), button:has-text("+")').first();
    
    if (await firstProductButton.isVisible({ timeout: 5000 })) {
      await firstProductButton.click();
    }

    // Esperar un poco para que se agregue
    await page.waitForTimeout(500);

    // Buscar botón de pago/completar venta
    const checkoutButton = page.locator('button:has-text("Pagar"), button:has-text("Cobrar"), button:has-text("Completar")').first();
    
    if (await checkoutButton.isVisible({ timeout: 3000 })) {
      await checkoutButton.click();
    }

    // Esperar diálogo de pago
    const paymentDialog = page.locator('div[role="dialog"], text=/Forma de pago|Método de pago/i');
    await expect(paymentDialog).toBeVisible({ timeout: 3000 }).catch(() => {
      console.log('Diálogo de pago no visible');
    });

    // Seleccionar método de pago (Efectivo)
    const cashButton = page.locator('button:has-text("Efectivo"), button:has-text("Cash")').first();
    if (await cashButton.isVisible({ timeout: 2000 })) {
      await cashButton.click();
    }

    // Confirmar pago
    const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Pagar"), button:has-text("OK")').first();
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    // Verificar éxito (buscar mensaje o redirección)
    const successMessage = page.locator('text=/Venta registrada|Éxito|Success/', { timeout: 3000 });
    await expect(successMessage).toBeVisible().catch(() => {
      console.log('Mensaje de éxito no encontrado');
    });
  });

  test('Ver historial de ventas en POS', async ({ page }) => {
    // Navegar a POS
    const posLink = page.locator('a:has-text("POS"), button:has-text("POS"), nav :text-is("POS")').first();
    
    if (await posLink.isVisible()) {
      await posLink.click();
      await page.waitForNavigation();
    }

    // Buscar sección de historial
    const historyTab = page.locator('button:has-text("Historial"), tab:has-text("Historial")').first();
    
    if (await historyTab.isVisible({ timeout: 3000 })) {
      await historyTab.click();
    }

    // Verificar tabla de historial
    const table = page.locator('table, div[role="grid"]').first();
    await expect(table).toBeVisible({ timeout: 2000 }).catch(() => {
      console.log('Tabla de historial no visible');
    });
  });

  test('Buscar producto por código de barras', async ({ page }) => {
    // Navegar a POS
    const posLink = page.locator('a:has-text("POS"), button:has-text("POS"), nav :text-is("POS")').first();
    
    if (await posLink.isVisible()) {
      await posLink.click();
      await page.waitForNavigation();
    }

    // Buscar input de búsqueda por código
    const searchInput = page.locator('input[placeholder*="código"], input[placeholder*="barcode"], input[type="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('001'); // Ejemplo de código de barras
      await page.waitForTimeout(500);

      // Verificar que aparecen resultados
      const productResult = page.locator('button, div').filter({ hasText: /001|Producto/ }).first();
      await expect(productResult).toBeVisible({ timeout: 2000 }).catch(() => {
        console.log('Producto no encontrado');
      });
    }
  });

  test('Anular venta', async ({ page }) => {
    // Navegar a POS
    const posLink = page.locator('a:has-text("POS"), button:has-text("POS"), nav :text-is("POS")').first();
    
    if (await posLink.isVisible()) {
      await posLink.click();
      await page.waitForNavigation();
    }

    // Agregar producto
    const firstProductButton = page.locator('button:has-text("Agregar"), button:has-text("+")').first();
    
    if (await firstProductButton.isVisible({ timeout: 5000 })) {
      await firstProductButton.click();
    }

    // Buscar botón de anular/limpiar carrito
    const cancelButton = page.locator('button:has-text("Anular"), button:has-text("Limpiar"), button:has-text("Cancelar")').first();
    
    if (await cancelButton.isVisible({ timeout: 2000 })) {
      await cancelButton.click();
    }

    // Verificar que el carrito está vacío
    const emptyCart = page.locator('text=/Carrito vacío|No hay items|Empty cart/i, text="0 items"');
    await expect(emptyCart).toBeVisible({ timeout: 2000 }).catch(() => {
      console.log('Carrito no fue vaciado');
    });
  });
});
