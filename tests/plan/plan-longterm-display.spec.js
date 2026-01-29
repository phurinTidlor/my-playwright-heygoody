const { test, expect, request } = require('@playwright/test');

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

    console.log('Start Date: Selected 2025-12-31');
}

async function submitQuote(page) {
    const btnByRole = page.getByRole('button', { name: 'ดูแผนประกันของคุณ' });

    await expect(btnByRole).toBeVisible();
    await expect(btnByRole).toBeEnabled();

    await Promise.all([
        page.waitForNavigation(/*{ waitUntil: 'networkidle' }*/),
        btnByRole.click()
    ]);

    await expect(page.locator('text=ตัวกรอง')).toBeVisible();
}

function parsePrice(text) {
    return Number(text.replace(/[^\d.]/g, ''));
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

test('Check Display Plan with API validate', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    // await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
    // await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
    await selectSedanCarType(page);

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

    const brand = await selectRandomBrand(page);
    const model = await selectRandomModel(page);
    const year = await selectRandomYear(page);
    const submodel = await selectRandomSubmodel(page);
    const province = await selectRandomProvince(page);
    const insurer = await selectRandomInsurer(page);
    const birthYear = await selectRandomBirthYear(page);
    const StartDate = await selectStartDate(page);
    const prbCard = page.locator('#quote-car-cmi-card-id');
    await expect(prbCard).toBeVisible();
    await prbCard.click();

    //await submitQuote(page);
    await page.waitForTimeout(1000);


    /*  //  Payload Log
     const payload = { brand, model, year, submodel, province, insurer, birthYear, StartDate };
     console.log('✔ Payload to API:', payload);
 
     //  Log all captured cURL
     console.log(`\n==================== Captured API cURL (${capturedRequests.length}) ====================`);
 
     for (const req of capturedRequests) {
         const curl = await requestToCurl(req);
         console.log('\n----- cURL -----');
         console.log(curl);
     }
 
     console.log('====================================================================\n');
  */

    const submitBtn = page.getByRole('button', { name: 'ดูแผนประกันของคุณ' });

    const [response] = await Promise.all([
        page.waitForResponse(res =>
            res.url().includes('/v3/selling/hg-car-plan') &&
            res.request().method() === 'POST'
        ),
        submitBtn.click()
    ]);

    //Validate API
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const apiPlanCount =
        body?.data?.car_normal_plan_list?.length ?? 0;
    console.log('📨 API plan count:', apiPlanCount);
    console.log(
        '📨 API response Detail Plan:\n',
        JSON.stringify(body, null, 2)
    );

    expect(typeof apiPlanCount).toBe('number');


    // ปิด popup login
    const closeBtn = page.locator('button[data-slot="dialog-close"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    const apiPlans = body.data.car_normal_plan_list.map(plan => ({
        insurerName: plan.insurer_short_name_th?.trim(),
        ins_type_desc: plan.ins_type_desc?.trim(),
        premium: Number(plan.ins_premium),
        sumInsure: Number(plan.sum_insured)
    }));

    const cards = page.locator('#insurance-list-id > div');
    const cardCount = await cards.count();

    // expect(cardCount).toBeGreaterThan('');
    console.log('🧾 UI card count:', cardCount);

    // ✅ validate
    expect(cardCount).toBeGreaterThan(0);
    expect(cardCount).toBeLessThanOrEqual(apiPlanCount);

    console.log('๔5555555 :', apiPlans);

    // Check card
    await page.getByRole('radio').filter({ hasText: 'ชั้น 1' })

    await page.waitForTimeout(1500);
    // const shareBtn = page.locator('button[id^="share-button-"]').first();

    // await expect(shareBtn).toBeVisible();
    // await shareBtn.click();
    // await page.waitForTimeout(1500);

    for (const plan of apiPlans) {
        await test.step(
            `Check price ${plan.insurerName} | ${plan.ins_type_desc} | ${plan.sumInsure}`,
            async () => {

                // 🔍 หา card ที่ตรง insurer + ชั้น
                const card = page.locator('#insurance-list-id > div').filter({
                    hasText: plan.insurerName,
                }).filter({
                    hasText: plan.ins_type_desc,
                });

                // บาง insurer มีหลายทุน → เช็ค sum insure ถ้าไม่ใช่ 0
                if (plan.sumInsure > 0) {
                    await expect(card).toContainText(
                        plan.sumInsure.toLocaleString('th-TH')
                    );
                }

                await expect(card.first()).toBeVisible();

                // 💰 ดึงราคาจาก UI (ราคาปกติ หรือ ราคาสมาชิก)
                const priceText = await card
                    .first()
                    .locator(
                        '#insurance-guest-price-component-id span.font-bold'
                    )
                    .innerText();

                const uiPrice = parsePrice(priceText);

                console.log(
                    `💰 UI price: ${uiPrice} | API price: ${plan.premium}`
                );

                // ✅ validate ราคา (allow diff เล็กน้อยจาก decimal)
                expect(uiPrice).toBeCloseTo(plan.premium, 0);
            }
        );
    }





});


