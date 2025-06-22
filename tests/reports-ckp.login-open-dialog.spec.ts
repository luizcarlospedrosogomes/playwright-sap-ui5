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

test('OPEN DIALOG', async ({ page }) => {
  
  const appFrame = sharedPage.frameLocator('iframe[title="Aplicação"]');

  await appFrame.getByText('Etiqueta de Solicitação').waitFor();
  await sharedPage.locator('iframe[title="Aplicação"]').contentFrame().getByText('Etiqueta de Solicitação').click();
  await sharedPage.locator('iframe[title="Aplicação"]').contentFrame().locator('[id="__xmlview0--equiteta_solicitacao_tab_view--solicitation_id-vhi"]').click();
  await sharedPage.locator('iframe[title="Aplicação"]').contentFrame().getByRole('gridcell', { name: '900000005150' }).click();
  await sharedPage.locator('iframe[title="Aplicação"]').contentFrame().locator('[id="__dialog0-table-rowsel0"]').click();
  await sharedPage.locator('iframe[title="Aplicação"]').contentFrame().getByRole('button', { name: 'OK' }).click();
  await sharedPage.locator('iframe[title="Aplicação"]').contentFrame().locator('[id="__xmlview0--equiteta_solicitacao_tab_view--pageFilter-cont"]').click();

})

