const { test, expect, request } = require('@playwright/test');

// Import helper functions
const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer, selectRandomBirthYear } = require('../../helpers/quote-helper-random');

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-juristic/new/quote';

async function selectSedanCarType(page) {
    const sedanCard = page.locator('#lt-individual-quote-car-type-label-id0');
    await expect(sedanCard).toBeVisible();
    await sedanCard.waitFor({ state: 'attached' });  // รอจน DOM stable
    await sedanCard.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible();
    await page.waitForTimeout(500);
}

async function selectStartDate(page) {
    const selector = '[data-day="2025-12-31"]:visible';
    await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });

    const day = page.locator(selector);
    await day.click({ force: true });
    await page.waitForTimeout(2000);

    console.log('✅ Start Date: Selected 2025-12-31');
}

//async function selectStartDate(page) { const day = page.locator('[data-day="2025-10-23"] > .focus-visible\\:border-ring'); await day.click({ force: true }); await page.waitForTimeout(2000); console.log('Start Date: Selected 2025-10-23'); }

async function submitQuote(page) {
    const btnByRole = page.getByRole('button', { name: 'ดูแผนประกันของคุณ' });
    // รอให้ปุ่มปรากฏ และรอให้ไม่ถูก disabled
    await expect(btnByRole).toBeVisible();
    await expect(btnByRole).toBeEnabled();
    // ถ้าการคลิกจะนำไปสู่ navigation:
    await Promise.all([
        page.waitForNavigation(/*{ waitUntil: 'networkidle' }*/),
        btnByRole.click()
    ]);
    // ตรวจสอบผลลัพธ์บางอย่างหลังคลิก 
    await expect(page.locator('text=ตัวกรอง')).toBeVisible();

}

test('heygoody longterm e2e random flow with API check', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถนิติบุคคล' })).toBeVisible();

    await page.waitForLoadState('networkidle'); // sometimes needed

    await selectSedanCarType(page);

    const brand = await selectRandomBrand(page);
    const model = await selectRandomModel(page);
    const year = await selectRandomYear(page);
    const submodel = await selectRandomSubmodel(page);
    const province = await selectRandomProvince(page);
    const insurer = await selectRandomInsurer(page);
    const birthYear = await selectRandomBirthYear(page);
    const StartDate = await selectStartDate(page);
    const Submit = await submitQuote(page);
    await page.waitForTimeout(1000);


    // Payload API
    const payload = {
        brand,
        model,
        year,
        submodel,
        province,
        insurer,
        birthYear,
        StartDate,
        Submit
    };

    console.log('Payload to API:', payload);

    /* const apiContext = await request.newContext();
    const apiResponse = await apiContext.post('https://dev-heygoody.areetech.io/api/quote/check', {
        data: payload
    });
    const apiResult = await apiResponse.json();
    console.log('API response:', apiResult);

    expect(apiResponse.ok()).toBeTruthy();  */

});

































