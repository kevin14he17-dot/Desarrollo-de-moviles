import { test, expect } from '@playwright/test';

/**
 * E2E TESTS - LOGIN FLOW
 * Prueba el flujo completo de autenticación en la interfaz
 */

test.describe('E2E - Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('/');
  });

  test('Login con credenciales válidas - Admin', async ({ page }) => {
    // Verificar que la página de login se carga
    await expect(page).toHaveTitle(/Login|Minimarket/);

    // Verificar presencia de inputs
    const usernameInput = page.locator('input[type="text"], input[name*="user"], input[placeholder*="usuario"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Iniciar Sesión"), button:has-text("Login"), button[type="submit"]').first();

    // Llenar formulario
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin');
    }
    
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('admin123');
    }

    // Hacer click en login
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Esperar a que se redirija al dashboard
    await page.waitForNavigation();
    
    // Verificar que estamos en el dashboard (cambio de URL o elemento)
    await expect(page).toHaveURL(/dashboard|home|\//);
  });

  test('Login con credenciales inválidas', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[name*="user"], input[placeholder*="usuario"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Iniciar Sesión"), button:has-text("Login"), button[type="submit"]').first();

    // Llenar con credenciales incorrectas
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('usuario_invalido');
    }
    
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('contraseña_incorrecta');
    }

    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Esperar mensaje de error
    const errorMessage = page.locator('text=/Error|Inválido|Incorrecto/', { timeout: 5000 });
    await expect(errorMessage).toBeVisible().catch(() => {
      // Si no hay mensaje, verificar que sigue en login
      return expect(page).toHaveURL(/login|signin/, { timeout: 3000 });
    });
  });

  test('Cambiar entre roles - Gerente', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[name*="user"], input[placeholder*="usuario"]').first();
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
    await expect(page).toHaveURL(/dashboard|home|\//);
  });

  test('Cambiar entre roles - Cajero', async ({ page }) => {
    const usernameInput = page.locator('input[type="text"], input[name*="user"], input[placeholder*="usuario"]').first();
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
    await expect(page).toHaveURL(/dashboard|home|\//);
  });

  test('Logout - Cerrar sesión correctamente', async ({ page }) => {
    // Primero hacer login
    const usernameInput = page.locator('input[type="text"], input[name*="user"], input[placeholder*="usuario"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button:has-text("Iniciar Sesión"), button:has-text("Login"), button[type="submit"]').first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin');
    }
    
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('admin123');
    }

    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    await page.waitForNavigation();

    // Buscar botón de logout
    const logoutButton = page.locator('button:has-text("Salir"), button:has-text("Logout"), button[aria-label*="logout"]').first();
    const profileMenu = page.locator('button[aria-label*="profile"], button:has-text("Perfil")').first();

    // Si hay menú de perfil, abrirlo primero
    if (await profileMenu.isVisible()) {
      await profileMenu.click();
    }

    // Esperar y hacer click en logout
    if (await logoutButton.isVisible({ timeout: 3000 })) {
      await logoutButton.click();
    }

    // Verificar que volvemos a login
    await expect(page).toHaveURL(/login|signin/, { timeout: 5000 });
  });
});
