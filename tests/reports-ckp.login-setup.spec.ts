import { test, expect } from '@playwright/test';
test.use({
  locale: 'pt-BR', // Força o navegador para português brasileiro
  storageState: './auth.json'
});

let sharedPage;
test.beforeEach(async ({ page }) => {
  sharedPage = page
  const site = process.env.SAP_BTP_WZ_SITE || ''
  await sharedPage.goto(site, { waitUntil: 'networkidle' });
  await sharedPage.waitForURL(/launchpad/);

  await sharedPage.context().storageState({ path: 'auth.json' });

  await sharedPage.getByRole('link', { name: 'Cockpit de Relatórios Impress' }).click();

  sharedPage.on('console', msg => {
    console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
})


test('Fluxo Tabs - Cockpit de Relatórios', async ({ page }) => {
  // 9. Interação com iframe da aplicação
  const appFrame = sharedPage.frameLocator('iframe[title="Aplicação"]');

  // Espera os elementos estarem disponíveis
  await appFrame.getByText('Etiqueta de Solicitação').waitFor();

  // Interações com os relatórios
  const reports = [
    'Etiqueta de Solicitação',
    'Relatório TZ',
    'Consulta de Dados',
    'Relatório de Serviços de'
  ];

  for (const report of reports) {
    try {
      await appFrame.getByText(report).click({ timeout: 8000 });
      await page.waitForTimeout(2000); // Pequena pausa entre ações
    } catch (error) {
      console.log(`Relatório ${report} não clicável:`, error);
    }
  }
});

test('Console Log - ERRORS', async ({ page }) => {
  sharedPage.on('console', (msg) => {
    if (msg.type() === 'error') {
      const loc = msg.location();
      console.error(
        `[Console Error] ${msg.text()} (${loc.url}:${loc.lineNumber})`
      );
    }
  });
  const appFrame = sharedPage.frameLocator('iframe[title="Aplicação"]');

  await appFrame.getByText('Etiqueta de Solicitação').waitFor();
})

test('REQUESTS FAILED', async ({ page }) => {
  sharedPage.on('requestfailed', request => {
    console.error(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`);
  });
})