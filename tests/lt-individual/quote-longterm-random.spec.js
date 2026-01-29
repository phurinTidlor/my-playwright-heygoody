const { test, expect, request } = require('@playwright/test');

// Import helper functions
const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer, selectRandomBirthYear } = require('../../helpers/quote-helper-random');

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

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

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
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
    const expected = `${payload.brand}, ${payload.submodel}`;
    console.log('Expected:', expected);

    // หา element ที่มีข้อความ expected แบบ exact
    const vehicleText = page.getByText(expected, { exact: true });

    // log ว่ามีเจอหรือไม่
    const count = await vehicleText.count();
    console.log('Matched count:', count);

    // ถ้ามี → log actual text
    if (count > 0) {
        const actual = await vehicleText.first().evaluate(el => el.textContent.trim());
        console.log('Actual:', actual);
    } else {
        console.log('No matching element found.');
    }

    // ตรวจสอบว่าตรงจริง
    await expect(vehicleText).toBeVisible();
    console.log('✅ Matching ', vehicleText);

});















































// import { test, expect } from '@playwright/test';
// import { selectSedanCarType } from '../../helpers/quote-helper-random';

// test.describe('Heygoody Long Term Quote Page', () => {
//     const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

//     test.beforeEach(async ({ page }) => {
//         await page.goto(baseURL);
//         await page.waitForLoadState('networkidle');
//     });

//     test('heygoody motor longterm e2e sedan', async ({ page }) => {
//         await page.goto(baseURL);

//         expect(page.url()).toBe(baseURL);
//         await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
//         await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
//         await page.waitForTimeout(1000);

//         // Click Select sedan
//         /* const sedanCard = page.locator('#ltIndividualQuoteCarTypeItemId0');
//         await expect(sedanCard).toBeVisible();
//         await sedanCard.click();
//         await page.waitForTimeout(1000);
//         await expect(page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible();
//         await page.waitForTimeout(1000); */

//         //import function
//         await selectSedanCarType(page);

//         // Select brand 
//         const brandButtons = page.getByRole('listitem').locator('button');

//         const brandNames = await brandButtons.allTextContents();
//         const randomBrand = brandNames[Math.floor(Math.random() * brandNames.length)];
//         const selectedBrandButton = brandButtons.filter({ hasText: randomBrand }).first();
//         await selectedBrandButton.click();
//         await expect(page.getByRole('heading', { name: `ยี่ห้อรถ ${randomBrand}` })).toBeVisible();

//         // Select model
//         const modelButtons = page.getByRole('listitem').locator('button');
//         const models = await modelButtons.allTextContents();
//         const randomModels = models[Math.floor(Math.random() * modelButtons.length)];
//         const selectedModel = modelButtons.filter({ hasText: randomModels }).first();
//         await selectedModel.click();
//         //await expect(page.getByRole('heading', { name: `รุ่นรถ ${randomModels}` })).toBeVisible();

//         // Select year
//         const yearButtons = page.getByRole('listitem').locator('button');
//         const years = await yearButtons.allTextContents();
//         const randomYears = years[Math.floor(Math.random() * yearButtons.length)];
//         const selectedYears = yearButtons.filter({ hasText: randomYears }).first();
//         await selectedYears.click();
//         //await expect(page.getByRole('heading', { name: `รุ่นรถ ${randomYears}` })).toBeVisible();

//         // Select submodel
//         const submodelButtons = page.getByRole('listitem').locator("button");
//         const submodels = await submodelButtons.allTextContents();
//         const randomSubmodel = submodels[Math.floor(Math.random() * submodelButtons.length)];
//         const selectedSub = submodelButtons.filter({ hasText: randomSubmodel }).first();
//         await selectedSub.click();

//         // Select province
//         const provinceButtons = page.getByRole('listitem').locator("button");
//         const provinces = await provinceButtons.allTextContents();
//         const randomProvince = provinces[Math.floor(Math.random() * provinceButtons.length)];
//         const selectedProvince = provinceButtons.filter({ hasText: randomProvince }).first();
//         await selectedProvince.click();

//         // Select insure
//         const insureButtons = page.getByRole('listitem').locator("button");
//         const insures = await insureButtons.allTextContents();
//         const randomInsure = insures[Math.floor(Math.random() * insureButtons.length)];
//         const selectedInsure = insureButtons.filter({ hasText: randomInsure }).first();
//         await selectedInsure.click();

//         // Select birth of year
//         const bYearButtons = page.getByRole('listitem').locator("button");
//         const bYears = await bYearButtons.allTextContents();
//         const randombYear = bYears[Math.floor(Math.random() * bYearButtons.length)];
//         const selectedbYear = bYearButtons.filter({ hasText: randombYear }).first();
//         await selectedbYear.click();

//         // Date start
//         const day = page.locator('[data-day="2025-09-27"] > .focus-visible\\:border-ring');
//         await day.click();
//         await page.waitForTimeout(2000);

//         // Submit button
//         const submitButton = page.locator('#quoteDocumentSubmitButtonId');
//         await expect(submitButton).toBeVisible();
//         await expect(submitButton).toBeEnabled();
//         await submitButton.click();

//         // ========== ยิง API ตรวจสอบ ==========
//         const payload = {
//             brand: randomBrand,
//             model: randomModels,
//             year: randomYears,
//             submodel: randomSubmodel,
//             province: randomProvince,
//             insurer: randomInsure,
//             birthYear: randombYear
//         };

//         console.log('API Payload:', payload);

//         /* const apiResponse = await request.post('https://dev-api.heygoody.areetech.io/check-quote', {
//             data: payload
//         });

//         expect(apiResponse.ok()).toBeTruthy();
//         const result = await apiResponse.json();
//         console.log('API Response:', result);

//         // สมมติว่าต้องได้ "success" กลับมา
//         expect(result.success).toBe(true); */

//     });

// });




