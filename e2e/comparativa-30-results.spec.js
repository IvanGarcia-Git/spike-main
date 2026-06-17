// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Comparativas — Validación E2E del flujo de comparación para tarifa 3.0 (change request "Comparativas 2").
 *
 * Bug reportado por el cliente: al comparar una factura 3.0 el interfaz mostraba
 * "No se encontraron resultados" pese a existir tarifas 3.0. Causa raíz: el filtro de
 * app/comparativas/resultados/page.js exigía coincidencia de tariffType Y customerType, y
 * como lib/company-service.ts etiqueta las tarifas 3.0/6.1 siempre como "empresa", una
 * factura marcada como "particular" (valor por defecto) las descartaba.
 *
 * Este test reproduce el escenario exacto del bug (tarifa 3.0TD + customerType "particular")
 * y verifica que, tras el fix, las tarifas 3.0 SÍ se visualizan en el interfaz. Sirve de
 * guarda de regresión: antes del fix la página mostraría "No se encontraron resultados".
 *
 * Se mockean los endpoints companies/ y rates/ (origen de las tarifas en getCompanyTariffs)
 * para que el test sea determinista y no dependa de los datos de la BD.
 *
 * NOTA: requiere la app levantada (webServer de playwright.config) y un usuario admin de
 * prueba en la BD, igual que el resto de tests E2E del proyecto.
 */

const TEST_ADMIN = {
  username: 'admin',
  password: 'admin123',
};

// Una compañía energética con una única tarifa 3.0 de luz (segmento empresa por construcción).
const MOCK_COMPANIES = [
  { id: 1, name: 'Iberdrola Test', type: 'Luz' },
];

const MOCK_RATES = [
  {
    id: 10,
    companyId: 1,
    name: 'Iberdrola 3.0 Test',
    type: '3.0',
    serviceType: 'Luz',
    powerSlot1: 0.12, powerSlot2: 0.08, powerSlot3: 0.06,
    powerSlot4: 0.05, powerSlot5: 0.04, powerSlot6: 0.03,
    energySlot1: 0.16, energySlot2: 0.12, energySlot3: 0.08,
    energySlot4: 0.06, energySlot5: 0.05, energySlot6: 0.04,
    surplusSlot1: 0.06,
  },
];

// Datos de comparación que escribe el asistente para una factura 3.0 marcada como "particular".
// Este es el escenario que disparaba el bug: tariffType 3.0 + customerType "particular".
const COMPARISON_DATA_30 = {
  clientName: 'Empresa de Prueba SL',
  comparisonType: 'luz',
  customerType: 'particular',
  selectedLightTariff: '3.0TD',
  selectedGasTariff: 'RL.1',
  tariffType: '3.0TD',
  potencias: [10, 10, 8, 8, 6, 6],
  energias: [300, 250, 200, 150, 100, 80],
  energia: 0,
  numDias: 30,
  showCurrentBill: true,
  currentBillAmount: 400,
  excedentes: 0,
  solarPanelActive: false,
};

async function login(page) {
  await page.goto('/');
  await page.fill('input[name="username"]', TEST_ADMIN.username);
  await page.fill('input[name="password"]', TEST_ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/contratos', { timeout: 10000 });
}

/**
 * Intercepta companies/ y rates/ para devolver una tarifa 3.0 determinista, y la llamada de
 * guardado (POST comparativas) para que no falle al persistir el resultado.
 */
async function mockTariffEndpoints(page) {
  await page.route('**/companies/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COMPANIES) });
  });
  await page.route('**/rates/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RATES) });
  });
  await page.route('**/comparativas', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 999 }) });
    } else {
      await route.continue();
    }
  });
}

test.describe('Comparativas - Flujo de comparación para tarifa 3.0 (change request "Comparativas 2")', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await mockTariffEndpoints(page);
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Comparar una factura 3.0 (customerType "particular") muestra las tarifas, no el mensaje vacío', async ({ page }) => {
    // Sembrar los datos de comparación ANTES de cargar la página de resultados, ya que
    // ésta los lee de sessionStorage en el efecto de montaje.
    await page.addInitScript((data) => {
      window.sessionStorage.setItem('comparisonData', JSON.stringify(data));
    }, COMPARISON_DATA_30);

    await page.goto('/comparativas/resultados');

    // La tarifa 3.0 debe visualizarse pese a que la factura es "particular".
    await expect(page.getByText('Iberdrola Test')).toBeVisible({ timeout: 15000 });

    // Y NO debe aparecer el mensaje de "sin resultados" (regresión del bug original).
    await expect(page.getByText('No se encontraron resultados')).toHaveCount(0);
  });
});
