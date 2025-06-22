import { test, expect } from './fixtures';
test.use({
  locale: 'pt-BR', // Força o navegador para português brasileiro
  storageState: './auth.json'
});

test('Fluxo Completo SAP - Relatórios', async ({ page }) => {
  await page.goto('/site?siteId=6e2024f0-d0e3-48d8-82fa-49aadbe5fcae#Shell-home', { waitUntil: 'networkidle' });
  await page.waitForURL(/launchpad/);

  await page.context().storageState({ path: 'auth.json' });

  await page.getByRole('link', { name: 'Cockpit de Relatórios Impress' }).click();

  // 9. Interação com iframe da aplicação
  const appFrame = page.frameLocator('iframe[title="Aplicação"]');

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