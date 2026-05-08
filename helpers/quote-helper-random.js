import { test, expect } from '@playwright/test';

// Helper Functions
async function selectRandomFromListItems(page, description = '') {
    const buttons = page.getByRole('listitem').locator('button');
    const items = await buttons.allTextContents();

    if (items.length === 0) {
        throw new Error(`No items available for "${description}"`);
    }

    const randomIndex = Math.floor(Math.random() * items.length);
    const randomItem = items[randomIndex];
    const selectedButton = buttons.filter({ hasText: randomItem }).first();

    console.log(`${description}: Selected "${randomItem}" (${randomIndex + 1}/${items.length})`);

    await selectedButton.click();
    await page.waitForTimeout(1000);

    return randomItem;
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
async function selectSedanCarTypeEV(page) {
    const evCard = page.locator('#lt-individual-quote-car-type-label-id1');
    await expect(evCard).toBeVisible();
    await evCard.waitFor({ state: 'attached' });
    await evCard.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(page.getByText('รถไฟฟ้า EV ไม่เกิน 7 ที่นั่ง')).toBeVisible();
    await page.waitForTimeout(1000);
}
async function selectSedanCarTypePickup(page) {
    const pickupCard = page.locator('#lt-individual-quote-car-type-item-id2');
    await expect(pickupCard).toBeVisible();
    await pickupCard.waitFor({ state: 'attached' });
    await pickupCard.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(
        page.getByText('รถกระบะ 2 ประตู', { exact: true })
    ).toBeVisible();
    await page.waitForTimeout(1000);
}
async function selectSedanCarTypeJuristic(page) {
    const card = page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง');
    await expect(card).toBeVisible();
    await card.click({ force: true });
    await page.waitForTimeout(1000);
}

async function selectSedanCarTypeEVJuristic(page) {
    const card = page.getByText('รถไฟฟ้า EV ไม่เกิน 7 ที่นั่ง');
    await expect(card).toBeVisible();
    await card.click({ force: true });
    await page.waitForTimeout(1000);
}

async function selectSedanCarTypeVan(page) {
    const pickupCard = page.locator('#lt-individual-quote-car-type-item-id3');
    await expect(pickupCard).toBeVisible();
    await pickupCard.waitFor({ state: 'attached' });
    await pickupCard.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(
        page.getByText('รถตู้เกิน 7 ที่นั่ง', { exact: true })
    ).toBeVisible();
    await page.waitForTimeout(1000);
}
async function selectCustomAccordionPickup(page, customId = 'ltIndividualQuotePickUpCustomBoxButtonId') {
    const accordionTrigger = page.locator('#lt-individual-quote-pick-up-custom-none-button-id');
    const triggerCount = await accordionTrigger.count();
    if (triggerCount > 0) {
        await accordionTrigger.waitFor({ state: 'visible', timeout: 5000 });
        await accordionTrigger.click();
        console.log('Accordion opened');
        await page.waitForTimeout(500);
    } else {
        console.warn('Accordion trigger not found');
    }
    const customButton = page.locator(`#${customId}`);
    const count = await customButton.count();
    if (count === 0) {
        console.warn(`Button with id "${customId}" not found, skipping click`);
        return null;
    }
    await customButton.waitFor({ state: 'visible', timeout: 10000 });
    await customButton.click();
    console.log(`Clicked button with id "${customId}"`);

    await page.waitForTimeout(1000);

    return customId;
}

async function selectRandomBrand(page) {
    const selectedBrand = await selectRandomFromListItems(page, 'Brand');
    return selectedBrand;
}

async function selectRandomModel(page) {
    return await selectRandomFromListItems(page, 'Model');
}

async function selectRandomYear(page) {
    return await selectRandomFromListItems(page, 'Year');
}

async function selectRandomSubmodel(page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    return await selectRandomFromListItems(page, 'Submodel');
}

async function selectRandomProvince(page) {
    return await selectRandomFromListItems(page, 'Province');
}

async function selectRandomInsurer(page) {
    return await selectRandomFromListItems(page, 'Insurer');
}

async function selectRandomBirthYear(page) {
    return await selectRandomFromListItems(page, 'Birth Year');
}

async function selectStartDate(page, date = '2026-05-28') {
    const selector = `[data-day="${date}"]:visible`;
    await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });

    const day = page.locator(selector);
    await day.click({ force: true });
    await page.waitForTimeout(2000);

    console.log(`Start Date: Selected ${date}`);
}

function generatePlateAdvanced() {
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const time = Date.now().toString().slice(-1);
    return `1เฮ้${rand}${time}`;
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

/**
 * เข้าหน้า quote → กรอกข้อมูลรถ/คนขับ → submit แบบมี retry
 * ถ้าเจอ "เรายังไม่มีแผนประกันสำหรับรถคุณ" → กดกลับสู่หน้าหลัก แล้วเริ่ม flow ใหม่
 * จบเมื่อหน้า "ตัวกรอง" ปรากฏ (มีแผนประกันให้เลือก)
 */
async function goToQuoteWithRetry(page, baseURL, options = {}) {
    const {
        maxAttempts = 5,
        selectCarType = selectSedanCarType,   // ส่ง null เพื่อข้าม (เช่น ST flow)
        afterSubmodel = null,
        beforeSubmit = null,
        skipProvince = false,                 // ST flow ไม่มี province
        skipBirthYear = false,                // ST/juristic ไม่มี birth year
        skipStartDate = false,                // juristic auto-fill start date — ไม่ต้องเลือก
        welcomeText = 'เปรียบเทียบประกันรถง่ายๆ กับ heygoody',
    } = options;
    let attempt = 0;

    while (true) {
        attempt++;
        if (attempt > maxAttempts) {
            throw new Error(`ไม่พบแผนประกันหลังลองครบ ${maxAttempts} ครั้ง`);
        }
        console.log(`🔄 Attempt ${attempt}/${maxAttempts}`);

        try {
            await page.goto(baseURL);
            await page.waitForLoadState('networkidle');

            await expect(page.getByText(welcomeText)).toBeVisible();
            if (selectCarType) await selectCarType(page);

            await selectRandomBrand(page);
            await selectRandomModel(page);
            await selectRandomYear(page);
            await selectRandomSubmodel(page);

            // hook สำหรับ extra step หลัง submodel (เช่น pickup ต้องเลือก accordion ก่อน)
            if (afterSubmodel) await afterSubmodel(page);

            if (!skipProvince) await selectRandomProvince(page);
            await selectRandomInsurer(page);
            if (!skipBirthYear) await selectRandomBirthYear(page);
            if (!skipStartDate) await selectStartDate(page);

            // hook สำหรับ extra step ก่อน submit (เช่นเลือก CMI)
            if (beforeSubmit) await beforeSubmit(page);

            // กดดูแผน inline (ไม่ใช้ submitQuote เพราะต้องเช็ก no-plans ก่อน assert ตัวกรอง)
            const btnByRole = page.getByRole('button', { name: 'ดูแผนประกันของคุณ' });
            await expect(btnByRole).toBeVisible();
            await expect(btnByRole).toBeEnabled();
            await btnByRole.click();
            await page.waitForLoadState('networkidle').catch(() => { });
            await page.waitForTimeout(1000);
        } catch (err) {
            console.log(`⚠️ Quote form failed: ${err.message} — retry`);
            continue;
        }

        // race: รอ "ตัวกรอง" (มีแผน) หรือ "เรายังไม่มีแผนประกัน..." อย่างใดอย่างหนึ่ง
        const planList = page.locator('text=ตัวกรอง');
        const noPlanText = page.getByText('เรายังไม่มีแผนประกันสำหรับรถคุณ');
        await Promise.race([
            planList.waitFor({ state: 'visible', timeout: 15000 }),
            noPlanText.waitFor({ state: 'visible', timeout: 15000 }),
        ]).catch(() => { });

        if (await noPlanText.isVisible().catch(() => false)) {
            console.log('⚠️ ไม่พบแผนประกัน → กดปุ่ม "กลับสู่หน้าหลัก" แล้ว retry');
            await page.getByRole('button', { name: 'กลับสู่หน้าหลัก' }).click();
            await page.waitForTimeout(1000);
            continue;
        }

        await expect(planList).toBeVisible();

        // เช็กว่ามี "แผนแนะนำ" จริง — ถ้าไม่เจอ retry (สุ่มข้อมูลใหม่)
        const recommendedExists = await page
            .locator('#insurance-coverage-head-component-id')
            .filter({ hasText: 'แผนแนะนำ' })
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);
        if (!recommendedExists) {
            console.log('⚠️ ไม่เจอแผนแนะนำในหน้าผลลัพธ์ → retry สุ่มใหม่');
            continue;
        }

        break;
    }
}

async function completeRandomQuoteFlow(page) {
    console.log('Starting random quote selection process...');

    try {

        await selectSedanCarType(page);
        // Random selections
        const brand = await selectRandomBrand(page);
        const model = await selectRandomModel(page);
        const year = await selectRandomYear(page);
        const submodel = await selectRandomSubmodel(page);
        const province = await selectRandomProvince(page);
        const insurer = await selectRandomInsurer(page);
        const birthYear = await selectRandomBirthYear(page);

        // Date and submission
        await selectStartDate(page);
        await submitQuote(page);

        console.log('Random quote flow completed successfully');
        console.log(`Final selection: ${brand} ${model} ${year} ${submodel}, Province: ${province}, Insurer: ${insurer}, Birth Year: ${birthYear}`);

        return {
            brand,
            model,
            year,
            submodel,
            province,
            insurer,
            birthYear
        };
    } catch (error) {
        console.error('Error in random quote flow:', error);
        throw error;
    }
}

module.exports = {
    selectSedanCarType,
    selectSedanCarTypeEV,
    selectSedanCarTypePickup,
    selectSedanCarTypeVan,
    selectSedanCarTypeJuristic,
    selectSedanCarTypeEVJuristic,
    selectCustomAccordionPickup,
    selectRandomBrand,
    selectRandomModel,
    selectRandomYear,
    selectRandomSubmodel,
    selectRandomProvince,
    selectRandomInsurer,
    selectRandomBirthYear,
    selectStartDate,
    submitQuote,
    goToQuoteWithRetry,
    generatePlateAdvanced
};