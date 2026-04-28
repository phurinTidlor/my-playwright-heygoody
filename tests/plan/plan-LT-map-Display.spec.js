const { test, expect } = require('@playwright/test');

const {
    selectRandomBrand,
    selectRandomModel,
    selectRandomYear,
    selectRandomSubmodel,
    selectRandomProvince,
    selectRandomInsurer,
    selectRandomBirthYear
} = require('../../helpers/quote-helper-random');

const baseURL =
    'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

/* =====================================================
   Utils
===================================================== */

function parsePrice(text) {
    return Number(text.replace(/[^\d.]/g, ''));
}

async function scrollToLoadAllCards(page, maxScroll = 10) {
    const cards = page.locator('#insurance-list-id > div');

    let lastCount = await cards.count();

    for (let i = 0; i < maxScroll; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(400);

        const newCount = await cards.count();

        // ❌ ไม่มี card เพิ่ม → หยุด
        if (newCount === lastCount) break;

        lastCount = newCount;
    }
}


async function selectInsuranceType(page, insType) {
    // หา label จาก text ชั้นประกัน
    const label = page
        .locator('#insurance-level-filter-id label')
        .filter({ hasText: insType })
        .first();

    // ❌ ไม่มี radio ชั้นนี้ใน UI
    if (await label.count() === 0) {
        console.log(`⚠️ Skip ${insType} (no radio in UI)`);
        return false;
    }

    const radioButton = label.locator('button[role="radio"]');

    // ❌ ไม่มี radio button จริง
    if (await radioButton.count() === 0) {
        console.log(`⚠️ Skip ${insType} (radio not found)`);
        return false;
    }

    // ⚠️ radio disabled
    const isDisabled = await radioButton.isDisabled();
    if (isDisabled) {
        console.log(`ℹ️ ${insType} radio disabled → use current UI state`);
        return false;
    }

    // ✅ radio enable → click
    await label.click({ force: true });
    // รอให้ list เปลี่ยนจริง
    await page.waitForSelector('#insurance-list-id > div', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    console.log(`🔘 Selected ${insType}`);
    return true;
}

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
    const selector = '[data-day="2026-03-22"]:visible';
    await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });

    const day = page.locator(selector);
    await day.click({ force: true });
    await page.waitForTimeout(2000);

    console.log('Start Date: Selected 2026-03-22');
}

async function waitForCardsToStabilize(page, timeout = 8000) {
    const cards = page.locator('#insurance-list-id > div');
    let lastCount = 0;
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const count = await cards.count();

        if (count === lastCount && count > 0) {
            return;
        }

        lastCount = count;
        await page.waitForTimeout(400);
    }
}


/* =====================================================
   Main Test
===================================================== */

test('Check Display Plan with API validate (map by insurance type)', async ({
    page
}) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // ---------- Quote Flow ----------
    await selectSedanCarType(page);
    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);

    // เลือกวัน
    await selectStartDate(page);

    // เลือก พ.ร.บ
    const prbCard = page.locator('#quote-car-cmi-card-id');
    await expect(prbCard).toBeVisible();
    await prbCard.click();

    // ---------- Submit & Capture API ----------
    const submitBtn = page.getByRole('button', {
        name: 'ดูแผนประกันของคุณ'
    });

    const [response] = await Promise.all([
        page.waitForResponse(
            (res) =>
                res.url().includes('/v3/selling/hg-car-plan') &&
                res.request().method() === 'POST'
        ),
        submitBtn.click()
    ]);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    const apiPlans = body.data.car_normal_plan_list.map((plan) => ({
        insurerName: plan.insurer_short_name_th?.trim(),
        insType: plan.ins_type_desc?.trim(),
        premium: Number(plan.ins_premium),
        sumInsure: Number(plan.sum_insured)
    }));

    console.log('📨 API plan count:', apiPlans.length);

    // ปิด popup login
    const closeBtn = page.locator('button[data-slot="dialog-close"]');
    if (await closeBtn.isVisible()) {
        await closeBtn.click();
    }

    /* =====================================================
       Group API Plans by Insurance Type
    ===================================================== */

    const INSURANCE_TYPE_ORDER = [
        'ชั้น 1',
        'ชั้น 2+',
        'ชั้น 2',
        'ชั้น 3+',
        'ชั้น 3'
    ];

    const apiPlansByType = {};
    for (const type of INSURANCE_TYPE_ORDER) {
        apiPlansByType[type] = apiPlans
            .filter((p) => p.insType === type)
            .sort((a, b) => a.premium - b.premium); // 🔽 ราคาน้อย → มาก
    }

    console.log('📦 Sorted API Plans:', apiPlansByType);

    /* =====================================================
      Validate UI ↔ API (เดินตาม radio ที่ enable)
    ===================================================== */

    const radioLabels = page.locator(
        '#insurance-level-filter-id label'
    );

    const radioCount = await radioLabels.count();

    for (let i = 0; i < radioCount; i++) {
        const label = radioLabels.nth(i);
        const radio = label.locator('button[role="radio"]');

        // ไม่มี radio จริง
        if (await radio.count() === 0) continue;

        // radio disabled → ข้าม
        if (await radio.isDisabled()) {
            const skipText = (await label.innerText()).trim();
            console.log(`⏭ Skip ${skipText} (radio disabled)`);
            continue;
        }

        // ชื่อชั้นจาก UI
        const insType = (await label.innerText()).trim();
        console.log(`🔘 Selected ${insType}`);

        // click radio
        await label.click({ force: true });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(600);

        // scroll โหลด card
        await scrollToLoadAllCards(page);
        await waitForCardsToStabilize(page);

        const uiCards = page
            .locator('#insurance-list-id > div')
            .filter({ hasText: insType });

        const uiCount = await uiCards.count();
        console.log(`🧾 UI cards (${insType}):`, uiCount);

        if (uiCount === 0) {
            console.warn(`⚠️ Skip ${insType} (no cards in UI)`);
            continue;
        }

        // plans จาก API ของชั้นนี้
        const plansInType = apiPlansByType[insType] || [];

        if (plansInType.length === 0) {
            console.log(`ℹ️ No API plans for ${insType}`);
            continue;
        }

        // ===== validate ทีละ plan =====
        for (const plan of plansInType) {
            await test.step(
                `💰 ${insType} | ${plan.insurerName}`,
                async () => {
                    let card = uiCards.filter({
                        hasText: plan.insurerName,
                    });

                    if (plan.sumInsure > 0) {
                        card = card.filter({
                            hasText: plan.sumInsure.toLocaleString('th-TH'),
                        });
                    }

                    if (await card.count() === 0) {
                        console.warn(
                            `⚠️ Skip ${insType} | ${plan.insurerName} (not found in UI)`
                        );
                        return;
                    }

                    const cardCount = await card.count();
                    let matchedCard = null;
                    let matchedPrice = null;

                    for (let i = 0; i < cardCount; i++) {
                        const c = card.nth(i);

                        const priceText = await c
                            .locator('#insurance-guest-price-component-id span.font-bold')
                            .innerText();

                        const uiPrice = parsePrice(priceText);

                        if (Math.abs(uiPrice - plan.premium) < 0.5) {
                            matchedCard = c;
                            matchedPrice = uiPrice;
                            break;
                        }
                    }

                    if (!matchedCard) {
                        console.error(
                            `❌ FAIL | ${insType} | ${plan.insurerName} | No matching price in UI (API: ${plan.premium})`
                        );
                        expect(false).toBeTruthy(); // fail test
                        return;
                    }

                    console.log(
                        `✅ PASS | ${insType} | ${plan.insurerName} | UI: ${matchedPrice} | API: ${plan.premium}`
                    );

                    expect(matchedPrice).toBeCloseTo(plan.premium, 0);
                    ;
                }
            );
        }
    }


});
