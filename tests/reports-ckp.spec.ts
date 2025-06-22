import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config(); 
test.use({
  locale: 'pt-BR', // Força o navegador para português brasileiro
});

const SAP_USER      = process.env.USER_BTP || process.env.UI5_USERNAME || '';
const SAP_PASS      = process.env.PASS_BTP || process.env.UI5_PASSWORD || '';
const SAP_URL       = process.env.SAP_BTP_URL_WZ || '';
const SAP_USERNAME  = process.env.NAME_BTP  || '';

test('Fluxo Completo SAP - Relatórios', async ({ page }) => {

  // 1. Login Inicial
  await page.goto(SAP_URL, { 
    waitUntil: 'networkidle' 
  });

  // 2. Seleção do Identity Provider
  await page.getByRole('link', { name: 'Default Identity Provider' }).click();
  
  // 3. Preenchimento do email com verificações
  const emailField = page.getByRole('textbox', { name: /E-mail|Email/i });
  await emailField.waitFor({ state: 'visible', timeout: 15000 });
  await emailField.fill(SAP_USER);
  await emailField.press('Enter');

  // 4. Tratamento da tela intermediária
  try {
    await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 10000 });
  } catch {
    console.log('Pulando tela intermediária não encontrada');
  }

  // 5. Preenchimento da senha

  const passwordField = page.getByRole('textbox', { name: 'Password' });
  await passwordField.waitFor({ state: 'visible', timeout: 20000 });
  
  await passwordField.evaluate((el: any) => el.value = ''); // Limpeza garantida
  await passwordField.fill(SAP_PASS);

  
  // 6. Login final com tratamento de popup
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.getByRole('button', { name: 'Sign in' }).click()
  ]);

  // 7. Seleção de conta se necessário
  if (await page.getByText(SAP_USERNAME).isVisible()) {
    await page.getByText(SAP_USERNAME).click();
    await page.waitForNavigation();
  }

  // 8. Navegação no Launchpad
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