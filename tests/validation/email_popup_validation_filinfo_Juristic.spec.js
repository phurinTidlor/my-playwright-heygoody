const { test, expect, request } = require('@playwright/test');

const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer, selectRandomBirthYear } = require('../../helpers/quote-helper-random');
import {
    selectBuyForMyself,
    selectBuyForOthers,
    testInvalidValues,
    testValidValues,
    fillAndBlur,
    expectInvalid,
    expectError,
    nextButton,
    selectRandomTitleName,
    generateRandomThaiName,
    generateRandomThaiLastName,
    humanFillText,
    setDateOfBirth,
    openAccordion,
    selectRadioByLabel,
    openAccordionByText,
    selectAddressOption,
    randomSelectColor,
    randomSelectTitleNameDriver1
} from '../../helpers/orferinfo-form-helpers';

const validIDcard = [
    '1100702074397'
];

const validEmails = [
    "test1233@gmail.com",
    "user.name_ok-1@example.co",
    "abc_def-123@my-domain.com",
    "a1.b2_c3-d4@domain.co.th",
    "normalemail@abc.net",
    "good-email_123@sub.domain.com",
    "zz123@domain.io",
    "thisisaveryveryveryveryverylongemailaddress_thatexceedslimit@domain.com",
    "short@a.co",
    "p.testhddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddv@gmail.com",
];

const invalidEmails = [
    "@domain.com",
    "sหกฟหห@domain.com",
    ".username@domain.com",
    "user.@domain.com",
    "us..er@domain.com",
    "user@@domain.com",
    "user@do..main.com",
    "user@domain",
    "user@domain.c",
    "user@-domain.com",
    //"user@domain-.com", // This is emaill > system error
    "user@domain..com"
];

const memberEmails = [
    "qaheygoody@gmail.com"
];

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-juristic/new/quote/car';
//const baseURL = 'https://uat-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

async function selectSedanCarType(page) {
    const sedanCard = page.locator('#lt-juristic-quote-car-type-item-id0'); //id0=Nonev, id1=EV, id2=Pickup, id3=Van 
    await expect(sedanCard).toBeVisible();
    await sedanCard.waitFor({ state: 'attached' });  // รอจน DOM stable
    await sedanCard.click({ force: true });
    await page.waitForTimeout(500);
    //await expect(page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible();
    await expect(page.getByText('เช็คเบี้ยประกันรถนิติบุคคล')).toBeVisible();
    await page.waitForTimeout(500);
}

async function selectStartDate(page) {
    const selector = '[data-day="2026-01-31"]:visible';
    await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });

    const day = page.locator(selector);
    await day.click({ force: true });
    await page.waitForTimeout(2000);

    console.log('Start Date: Selected 2026-01-31');
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

export const getDialogEmailInput = (page) =>
    page.locator('div[role="dialog"][data-state="open"] input[name="email"]');

export const getFillInfoEmailInput = (page) =>
    page.locator('#insured-email-input-id');


test('Check Validate Email pop up login fillinfo page', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถนิติบุคคล' })).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    //await selectRandomBirthYear(page);
    await selectStartDate(page);

    // Select cmi
    /* const prbCard = page.locator('#quote-car-cmi-card-id');
    await expect(prbCard).toBeVisible();
    await prbCard.click(); */

    await submitQuote(page);
    await page.waitForTimeout(1000);

    // ปิด popup login
    const closeBtn = page.locator('button[data-slot="dialog-close"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(1000);

    const recommendedCard = page
        .locator('#insurance-coverage-head-component-id')
        .filter({ hasText: 'แผนแนะนำ' })
        .locator('..'); // ขยับขึ้นไป parent card

    await recommendedCard
        .locator('#choose-plan-button-id')
        .click();

    await expect(
        recommendedCard.locator('text=แผนแนะนำ')
    ).toBeVisible();
    await page.waitForTimeout(1000);

    await page.locator('#checkout-button-id').click(); //ปุ่มทำรายการต่อ
    await page.waitForTimeout(1000);

    // 🎯 popup email
    const emailInput = getDialogEmailInput(page);
    const submitBtn = page.getByRole('button', { name: 'สมัครฟรี รับส่วนลดทันที' });

    for (const email of validEmails) {
        await test.step(`✅ validate email (no submit): ${email}`, async () => {

            await emailInput.click();
            await emailInput.fill('');


            // กรอก email
            await emailInput.type(email, { delay: 50 });

            // 🔍 assert: ไม่มี error
            await expect(
                page.locator('[data-slot="form-message"]')
            ).toHaveCount(0);

            // 🔍 หรือเช็ค aria-invalid
            await expect(emailInput).toHaveAttribute('aria-invalid', 'false');
        });
    }


});


test('Check Invalidate Email pop up login fillinfo page', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถนิติบุคคล' })).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    //await selectRandomBirthYear(page);
    await selectStartDate(page);

    await submitQuote(page);
    await page.waitForTimeout(1000);

    // ปิด popup login
    const closeBtn = page.locator('button[data-slot="dialog-close"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(1000);

    const recommendedCard = page
        .locator('#insurance-coverage-head-component-id')
        .filter({ hasText: 'แผนแนะนำ' })
        .locator('..'); // ขยับขึ้นไป parent card

    await recommendedCard
        .locator('#choose-plan-button-id')
        .click();

    await expect(
        recommendedCard.locator('text=แผนแนะนำ')
    ).toBeVisible();
    await page.waitForTimeout(1000);

    await page.locator('#checkout-button-id').click(); //ปุ่มทำรายการต่อ
    await page.waitForTimeout(1000);

    // popup email
    const emailInput = getDialogEmailInput(page);
    const submitBtn = page.getByRole('button', { name: 'สมัครฟรี รับส่วนลดทันที' });

    for (const email of invalidEmails) {
        await test.step(`invalid email: ${email}`, async () => {

            await emailInput.pressSequentially(email, { delay: 80 });
            await submitBtn.click();
            await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
            await expect(
                page.getByText('กรอกอีเมลเพื่อใช้สร้างบัญชีให้ถูกต้อง')
            ).toBeVisible();
            // reset
            await emailInput.fill('');
            await emailInput.blur();
        });
    }


});

test('Check EMPTY Email pop up login fillinfo page', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถนิติบุคคล' })).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    //await selectRandomBirthYear(page);
    await selectStartDate(page);

    await submitQuote(page);
    await page.waitForTimeout(1000);

    // ปิด popup login
    const closeBtn = page.locator('button[data-slot="dialog-close"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(1000);

    const recommendedCard = page
        .locator('#insurance-coverage-head-component-id')
        .filter({ hasText: 'แผนแนะนำ' })
        .locator('..'); // ขยับขึ้นไป parent card

    await recommendedCard
        .locator('#choose-plan-button-id')
        .click();

    await expect(
        recommendedCard.locator('text=แผนแนะนำ')
    ).toBeVisible();
    await page.waitForTimeout(1000);

    await page.locator('#checkout-button-id').click(); //ปุ่มทำรายการต่อ
    await page.waitForTimeout(1000);

    // popup email
    const emailInput = getDialogEmailInput(page);
    const submitBtn = page.getByRole('button', { name: 'สมัครฟรี รับส่วนลดทันที' });

    /* =========================
          CASE 1: EMPTY EMAIL
       ========================== */
    await test.step('empty email should show required error', async () => {
        await emailInput.fill('');
        await submitBtn.click();

        await expect(emailInput).toHaveAttribute('aria-invalid', 'true');

        await expect(
            page.getByText('กรอกอีเมลเพื่อใช้สร้างบัญชี')
        ).toBeVisible();
    });


});


test('Check Member Email pop up login fillinfo page', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถนิติบุคคล' })).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    //await selectRandomBirthYear(page);
    await selectStartDate(page);

    await submitQuote(page);
    await page.waitForTimeout(1000);

    // ปิด popup login
    const closeBtn = page.locator('button[data-slot="dialog-close"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(1000);

    const recommendedCard = page
        .locator('#insurance-coverage-head-component-id')
        .filter({ hasText: 'แผนแนะนำ' })
        .locator('..'); // ขยับขึ้นไป parent card

    await recommendedCard
        .locator('#choose-plan-button-id')
        .click();

    await expect(
        recommendedCard.locator('text=แผนแนะนำ')
    ).toBeVisible();
    await page.waitForTimeout(1000);


    await page.locator('#checkout-button-id').click();
    await page.waitForTimeout(1000);

    const emailInput = getDialogEmailInput(page);
    const submitBtn = page.getByRole('button', { name: 'สมัครฟรี รับส่วนลดทันที' });

    for (const email of memberEmails) {

        await test.step(`Member email: ${email}`, async () => {

            await emailInput.fill(email, { delay: 50 });
            await submitBtn.click();

            await expect(page.getByText('อีเมลนี้มีบัญชีกับ heygoody แล้ว')).toBeVisible();
        });
    }

});




















