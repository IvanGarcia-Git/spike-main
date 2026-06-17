// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * PRES-018 — Pruebas E2E del flujo visual de comparativas.
 *
 * Valida el cambio de icono en el asistente de "Nueva Comparativa": una vez subida
 * y analizada la factura, el indicador de la caja de autorrelleno debe pasar a estado
 * "Factura analizada" (icono fact_check) y mantenerse visible en los demás pasos del
 * stepper, tal y como solicitó el cliente.
 *
 * La llamada a la IA (POST /comparativas/extract-invoice) se MOCKEA con page.route para
 * no consumir la API de OpenAI ni depender de su latencia/coste durante el test.
 *
 * NOTA: requiere la app y el backend levantados, y un usuario admin de prueba en la BD
 * (mismas credenciales que el resto de tests E2E del proyecto).
 */

const TEST_ADMIN = {
  username: 'admin',
  password: 'admin123',
};

// Respuesta simulada del extractor de facturas (factura de luz 2.0TD).
const MOCK_EXTRACTION = {
  comparisonType: 'luz',
  customerType: 'particular',
  clientName: 'Juan Pérez',
  companyName: 'Iberdrola',
  tariffType: '2.0TD',
  cups: 'ES0021000000000000XY',
  potencias: [4.6, 4.6],
  energias: [120, 90, 60],
  consumo: null,
  numDias: 30,
  currentBillAmount: 78.5,
  lowConfidenceFields: [],
};

async function login(page) {
  await page.goto('/');
  await page.fill('input[name="username"]', TEST_ADMIN.username);
  await page.fill('input[name="password"]', TEST_ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/contratos', { timeout: 10000 });
}

/**
 * Intercepta la llamada de extracción de factura y devuelve datos simulados,
 * evitando llamar a la IA real.
 */
async function mockInvoiceExtraction(page, body = MOCK_EXTRACTION) {
  await page.route('**/comparativas/extract-invoice', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/**
 * Abre el modal de "Nueva Comparativa" desde la página de comparativas.
 */
async function openNuevaComparativa(page) {
  await page.goto('/comparativas');
  await page.getByRole('button', { name: 'Nueva Comparativa' }).click();
  await expect(page.getByRole('heading', { name: 'Nueva Comparativa' })).toBeVisible();
}

/**
 * Sube una factura simulada al input de fichero del modal.
 */
async function uploadFakeInvoice(page) {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'factura.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fake-invoice-bytes'),
  });
}

test.describe('Comparativas - Cambio de icono "Factura analizada" (PRES-018)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await mockInvoiceExtraction(page);
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Antes de subir factura muestra el estado de autorrelleno por defecto', async ({ page }) => {
    await openNuevaComparativa(page);

    await expect(page.getByText('Rellenar automáticamente desde una factura')).toBeVisible();
    await expect(page.getByText('Factura analizada')).toHaveCount(0);
  });

  test('Tras analizar la factura el icono cambia a "Factura analizada"', async ({ page }) => {
    await openNuevaComparativa(page);

    await uploadFakeInvoice(page);

    // El indicador pasa al estado analizado (icono fact_check + texto).
    await expect(page.getByText('Factura analizada')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Cambiar factura')).toBeVisible();
    await expect(page.locator('.material-icons-outlined', { hasText: 'fact_check' }).first()).toBeVisible();

    // El autorrelleno avanzó al paso 2 con los datos extraídos.
    await expect(page.locator('input[value="Juan Pérez"]')).toBeVisible();
  });

  test('El icono "Factura analizada" persiste en los demás pasos del stepper', async ({ page }) => {
    await openNuevaComparativa(page);

    await uploadFakeInvoice(page);
    await expect(page.getByText('Factura analizada')).toBeVisible({ timeout: 15000 });

    // Avanza al paso de consumos y verifica que el indicador sigue presente.
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.getByText('Factura analizada')).toBeVisible();

    // Avanza al resumen y comprueba que se mantiene.
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.getByText('Factura analizada')).toBeVisible();
  });
});
