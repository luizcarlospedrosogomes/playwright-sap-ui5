
import { test as setup, chromium } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();


const SAP_USER = process.env.USER_BTP || process.env.UI5_USERNAME || '';
const SAP_PASS = process.env.PASS_BTP || process.env.UI5_PASSWORD || '';
const SAP_URL = process.env.SAP_BTP_URL_WZ || '';
const SAP_USERNAME = process.env.NAME_BTP || '';

let sharedPage;
(async () => {
    console.log(SAP_USER);  
    console.log(SAP_PASS);  
    console.log(SAP_URL);  
    console.log(SAP_USERNAME);
    const browser = await chromium.launch({ headless: false });

    const context = await browser.newContext({ locale: 'pt-BR'});
    sharedPage = await context.newPage();
    await sharedPage.goto(SAP_URL, {
        waitUntil: 'networkidle'
    });

    // 2. Seleção do Identity Provider
    await sharedPage.getByRole('link', { name: 'Default Identity Provider' }).click();

    // 3. Preenchimento do email com verificações
    const emailField = sharedPage.getByRole('textbox', { name: /E-mail|Email/i });
    await emailField.waitFor({ state: 'visible', timeout: 15000 });
    await emailField.fill(SAP_USER);
    await emailField.press('Enter');

    // 4. Tratamento da tela intermediária
    try {
        await sharedPage.getByRole('button', { name: 'Continuar' }).click({ timeout: 10000 });
    } catch {
        console.log('Pulando tela intermediária não encontrada');
    }

    // 5. Preenchimento da senha

    const passwordField = sharedPage.getByRole('textbox', { name: 'Password' });
    await passwordField.waitFor({ state: 'visible', timeout: 20000 });

    await passwordField.evaluate((el: any) => el.value = ''); // Limpeza garantida
    await passwordField.fill(SAP_PASS);


    // 6. Login final com tratamento de popup
    await Promise.all([
        sharedPage.waitForNavigation({ waitUntil: 'networkidle', timeout: 90000 }),
        sharedPage.getByRole('button', { name: 'Sign in' }).click()
    ]);

    // 7. Seleção de conta se necessário
    if (await sharedPage.getByText(SAP_USERNAME).isVisible()) {
        await sharedPage.getByText(SAP_USERNAME).click();
        await sharedPage.waitForNavigation();
    }
    await sharedPage.waitForURL(/launchpad/); 
    await context.storageState({ path: 'auth.json' });
    await browser.close();
})()

