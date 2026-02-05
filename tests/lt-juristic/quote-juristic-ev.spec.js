const { test, expect, request } = require('@playwright/test');

// Import helper functions
const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer } = require('../../helpers/quote-helper-random');

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-juristic/new/quote';

async function selectJuristicCarType(page) {
    const juristicCard = page.locator('#lt-juristic-quote-car-type-item-id1');
    await expect(juristicCard).toBeVisible();
    await juristicCard.waitFor({ state: 'attached' });  
    await juristicCard.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('เช็คเบี้ยประกันรถนิติบุคคล')).toBeVisible();
    await page.waitForTimeout(500);
}

async function selectStartDate(page) {
    const selector = '[data-day="2026-02-28"]:visible';
    await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });

    const day = page.locator(selector);
    await day.click({ force: true });
    await page.waitForTimeout(2000);

    console.log('Start Date: Selected 2026-02-28');
}


async function submitQuote(page) {
    const btnByRole = page.getByRole('button', { name: 'ดูแผนประกันของคุณ' });
    await expect(btnByRole).toBeVisible();
    await expect(btnByRole).toBeEnabled();
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        btnByRole.click()
    ]);
    await expect(page.locator('text=ตัวกรอง')).toBeVisible();

}

test('heygoody juristic e2e ev random flow', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถนิติบุคคล' })).toBeVisible();

    await selectJuristicCarType(page);
    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectStartDate(page);
    await submitQuote(page);
    await page.waitForTimeout(1000);

});

































