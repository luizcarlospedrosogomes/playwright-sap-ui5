import { test, expect } from '@playwright/test';
import { checkApiResponses } from './helpers/checkApis';
import dotenv from 'dotenv';
dotenv.config();
test.use({
  locale: 'pt-BR', // Força o navegador para português brasileiro
  storageState: './auth.json'
});

let sharedPage: any;
test.beforeEach(async ({ page }) => {
  sharedPage = page
  const site = process.env.SAP_BTP_WZ_SITE || ''
  await sharedPage.goto(site, { waitUntil: 'networkidle' });
  await sharedPage.waitForURL(/launchpad/);

  await sharedPage.context().storageState({ path: 'auth.json' });

  await page.getByRole('link', { name: 'Entry Resuts Entrada de' }).click();
  const page1Promise = page.waitForEvent('popup');
  sharedPage = await page1Promise;
  sharedPage.on('console', (msg: any) => {
    // console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
    if (msg.type() === 'error') {
      const loc = msg.location();
      const text = msg.text();

      // Checa se é erro de rede HTTP (500, 403, etc.)
      const isHttpError = /status of (4\d{2}|5\d{2})/.test(text);

      const prefix = isHttpError ? '[Network Console Error]' : '[Console Error]';
      const message = `${prefix} ${text} (${loc.url}:${loc.lineNumber})`;
      if (isHttpError) {
        console.error(message);
      }

    }
  });

  sharedPage.on('requestfailed', (request: any) => {
    const failure = request.failure();
    const message = `[Request Failed] ${request.method()} ${request.url()} - ${failure?.errorText}`;
    console.error(message);
  })
})


test('Abrir app com filtro de data', async ({ page }) => {
  await sharedPage.getByLabel('Abrir selecionador').locator('path').click();
  await sharedPage.getByLabel('junho 26,').getByText('26').click();
  await sharedPage.getByLabel('Dia livre junho 1,').getByText('1').click();
  await sharedPage.getByRole('button', { name: 'Executar' }).click();
  await sharedPage.locator('#menu-bar').getByRole('button').click();
});

test('verifica se APIs foram chamadas com sucesso', async ({ page }) => {
  await checkApiResponses({ page: sharedPage });
});