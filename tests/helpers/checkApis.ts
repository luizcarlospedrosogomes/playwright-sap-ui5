import { Page } from '@playwright/test';

export type ApiFilter = (url: string) => boolean;

export async function checkApiResponses({page,
  filter = (url: string) =>
    url.includes('/sap/opu/odata') || url.includes('/v2/') || url.includes('/v1/'),
  gotoUrl = '/',
}: {
  page: Page;
  filter?: ApiFilter;
  gotoUrl?: string;
}) {
  const apiResponses: { url: string; status: number }[] = [];

  page.on('response', (response) => {
    const url = response.url();
    if (filter(url)) {
      apiResponses.push({ url, status: response.status() });
    }
  });

  await page.goto(gotoUrl);
  await page.waitForLoadState('networkidle');

  const failed = apiResponses.filter((res) => res.status >= 400);
  if (failed.length > 0) {
    throw new Error(
      `🚨 ${failed.length} API(s) falharam:\n` +
      failed.map((f) => `❌ ${f.status} - ${f.url}`).join('\n')
    );
  }

  console.log('✅ Todas as APIs principais carregaram com sucesso');
}
