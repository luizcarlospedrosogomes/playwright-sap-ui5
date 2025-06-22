import { test as base, expect } from '@playwright/test';

const test = base.extend<{consoleErrors: string[]; requestFailures: string[];}>({
  consoleErrors: async ({}, use) => {
    const errors: string[] = [];
    await use(errors);
  },
   requestFailures: async ({}, use) => {
    const failures: string[] = [];
    await use(failures);
  },
});

test.use({
  locale: 'pt-BR', // Força o navegador para português brasileiro
  storageState: './auth.json'
});

let sharedPage;
test.beforeEach(async ({ page, consoleErrors, requestFailures   }) => {
  sharedPage = page
  const site = process.env.SAP_BTP_WZ_SITE || ''
  await sharedPage.goto(site, { waitUntil: 'networkidle' });
  await sharedPage.waitForURL(/launchpad/);

  await sharedPage.context().storageState({ path: 'auth.json' });

  await sharedPage.getByRole('link', { name: 'Cockpit de Relatórios Impress' }).click();

  sharedPage.on('console', msg => {
    console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const loc = msg.location();
      const message = `[Console Error] ${msg.text()} (${loc.url}:${loc.lineNumber})`;
      console.error(message);
      consoleErrors.push(message);
    }
  });

   page.on('requestfailed', (request) => {
    const failure = request.failure();
    const message = `[Request Failed] ${request.method()} ${request.url()} - ${failure?.errorText}`;
    console.error(message);
    requestFailures.push(message);
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

test.afterEach(async ({ consoleErrors, requestFailures  }) => {
  if (consoleErrors.length > 0) {
    throw new Error(
      `❌ O teste falhou porque o console do navegador teve ${consoleErrors.length} erro(s):\n` +
      consoleErrors.join('\n')
    );
  }

  if (requestFailures.length > 0) {
    throw new Error(
      `❌ O teste falhou porque requisições do navegador teve ${requestFailures.length} erro(s):\n` +
      requestFailures.join('\n')
    );
  }
});


export { test, expect };