const { test, expect, request } = require('@playwright/test');

// Import helper functions
const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer, selectRandomBirthYear } = require('../../helpers/quote-helper-random');

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

async function selectSedanCarType(page) {
    const sedanCard = page.locator('#lt-individual-quote-car-type-label-id0');
    await expect(sedanCard).toBeVisible();
    await sedanCard.waitFor({ state: 'attached' });
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

async function submitQuote(page) {
    const btnByRole = page.getByRole('button', { name: 'ดูแผนประกันของคุณ' });

    await expect(btnByRole).toBeVisible();
    await expect(btnByRole).toBeEnabled();

    await Promise.all([
        page.waitForNavigation(),
        btnByRole.click()
    ]);

    await expect(page.locator('text=ตัวกรอง')).toBeVisible();
}

/* -----------------------------------------------------
   🔥 Helper: Convert captured request → cURL format
----------------------------------------------------- */
async function requestToCurl(req) {
    const method = req.method();
    const url = req.url();
    const headers = await req.headers();
    const postData = req.postData() || "";

    let curl = `curl '${url}' \\\n  -X ${method}`;

    // Headers
    for (const key in headers) {
        curl += ` \\\n  -H '${key}: ${headers[key]}'`;
    }

    // Body
    if (postData) {
        const json = postData.replace(/\s+/g, ' '); // flatten JSON
        curl += ` \\\n  --data-raw '${json}'`;
    }

    return curl;
}



/* -----------------------------------------------------
   🚀 Main E2E Test
----------------------------------------------------- */
test('heygoody longterm e2e random flow with API check + cURL', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
    await selectSedanCarType(page);

    // =============================
    //  เตรียมเก็บ request สำหรับ cURL
    // =============================
    const capturedRequests = [];

    page.on('request', (req) => {
        if (
            req.url().includes('/longterm')
            || req.url().includes('/plan')
            || req.url().includes('/quote')
            || req.method() === 'POST'
        ) {
            capturedRequests.push(req);
        }
    });

    // =============================
    //  Form selections
    // =============================
    const brand = await selectRandomBrand(page);
    const model = await selectRandomModel(page);
    const year = await selectRandomYear(page);
    const submodel = await selectRandomSubmodel(page);
    const province = await selectRandomProvince(page);
    const insurer = await selectRandomInsurer(page);
    const birthYear = await selectRandomBirthYear(page);
    const StartDate = await selectStartDate(page);

    await submitQuote(page);
    await page.waitForTimeout(1000);

    // =============================
    //  Payload Log
    // =============================
    const payload = { brand, model, year, submodel, province, insurer, birthYear, StartDate };
    console.log('✔ Payload to API:', payload);

    // =============================
    //  Log all captured cURL
    // =============================
    console.log(`\n==================== Captured API cURL (${capturedRequests.length}) ====================`);

    for (const req of capturedRequests) {
        const curl = await requestToCurl(req);
        console.log('\n----- cURL -----');
        console.log(curl);
    }

    console.log('====================================================================\n');

    // =============================
    //  UI Matching Check
    // =============================
    const expected = `${payload.brand}, ${payload.submodel}`;
    console.log('Expected:', expected);

    const vehicleText = page.getByText(expected, { exact: true });
    const count = await vehicleText.count();

    console.log('Matched count:', count);

    if (count > 0) {
        const actual = await vehicleText.first().evaluate(el => el.textContent.trim());
        console.log('Actual:', actual);
    } else {
        console.log('❌ No matching element found.');
    }

    await expect(vehicleText).toBeVisible();
    console.log('✅ Matching text found!');
});

