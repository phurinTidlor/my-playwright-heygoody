const { test, expect, request } = require('@playwright/test');

// Import helper functions
const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer, selectRandomBirthYear } = require('../../helpers/quote-helper-random');

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

const validEmails = [
    //"test1233@gmail.com",
    // "user.name_ok-1@example.co",
    // "abc_def-123@my-domain.com",
    // "a1.b2_c3-d4@domain.co.th",
    // "normalemail@abc.net",
    // "good-email_123@sub.domain.com",
    // "zz123@domain.io",
    // "thisisaveryveryveryveryverylongemailaddress_thatexceedslimit@domain.com",
    // "short@a.co",
    "p.testhdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd@gmail.com",
];

const invalidEmails = [
    "@domain.com",
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
    const selector = '[data-day="2026-01-31"]:visible';
    await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });

    const day = page.locator(selector);
    await day.click({ force: true });
    await page.waitForTimeout(2000);

    console.log('✅ Start Date: Selected 2026-01-31');
}

//async function selectStartDate(page) { const day = page.locator('[data-day="2025-10-23"] > .focus-visible\\:border-ring'); await day.click({ force: true }); await page.waitForTimeout(2000); console.log('Start Date: Selected 2025-10-23'); }

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

async function backToEmailPopup(page) {
    const backBtn = page.getByRole('button', { name: 'ย้อนกลับ' });
    if (await backBtn.isVisible()) {
        await backBtn.click();
    }

    await expect(
        page.getByLabel('อีเมลเพื่อใช้สร้างบัญชี')
    ).toBeVisible();
}


test('Check Validate Email pop up login', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(
        page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })
    ).toBeVisible();

    await selectSedanCarType(page);
    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);
    await selectStartDate(page);
    await submitQuote(page);

    // 🎯 popup email
    const emailInput = page.getByLabel('อีเมลเพื่อใช้สร้างบัญชี');
    const submitBtn = page.getByRole('button', { name: 'เข้าสู่ระบบ' });

    for (const email of validEmails) {
        await test.step(`✅ validate email: ${email}`, async () => {
            await emailInput.fill(email);
            await submitBtn.click();

            // 👉 assert สมัครสมาชิก
            await expect(page.getByText('สมัครสมาชิกฟรี')).toBeVisible();
            //await expect(page.getByText('หากมีบัญชีอยู่แล้ว!')).toBeVisible();
            // await expect(
            //     page.getByRole('button', { name: 'ดำเนินการต่อ' })
            // ).toBeVisible();
            //await waitForTimeout(6000);

            // 🔄 reset state
            await backToEmailPopup(page);
            await emailInput.clear();
        });
    }
});


test('Check Invalid & Empty Email popup login', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(
        page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })
    ).toBeVisible();

    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);
    await selectStartDate(page);
    await submitQuote(page);

    // popup login
    const emailInput = page.getByRole('textbox', {
        name: 'อีเมลเพื่อใช้สร้างบัญชี',
    });
    const submitBtn = page.getByRole('button', { name: 'สมัครเลย' });

    await expect(emailInput).toBeVisible();

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

    /* =========================
       CASE 2: INVALID FORMAT
    ========================== */
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
