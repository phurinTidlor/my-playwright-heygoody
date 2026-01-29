const { test, expect, request } = require('@playwright/test');

const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer, selectRandomBirthYear, selectCustomAccordionPickup } = require('../../helpers/quote-helper-random');
import {
    selectBuyForMyself,
} from '../../helpers/orferinfo-form-helpers';


//const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';
const baseURL = 'https://uat-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

async function selectSedanCarType(page) {
    const sedanCard = page.locator('#lt-individual-quote-car-type-label-id0'); //id0=Nonev, id1=EV, id2=Pickup, id3=Van 
    await expect(sedanCard).toBeVisible();
    await sedanCard.waitFor({ state: 'attached' });  // รอจน DOM stable
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


test('Check Validate OCR fillinfo page : Upload Success', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    //await selectCustomAccordionPickup(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);
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

    // close popup email
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id').nth(1);

    await expect(closeIcon).toBeVisible();
    await closeIcon.click();
    await page.waitForTimeout(1000);

    await selectBuyForMyself(page);

    // เลือก input file ที่อยู่ในปุ่ม OCR
    const fileInput = page.locator(
        '#insured-upload-id-card-button-id input[type="file"]'
    );

    // อัปโหลดไฟล์บัตรประชาชน
    await fileInput.setInputFiles('tests/fixtures/phuID.jpg');
    await page.waitForTimeout(5000);

    /* await page.waitForResponse(res =>
        res.url().includes('/ocr') && res.status() === 200
    );

    await expect(page.locator('input[name="firstName"]'))
        .toHaveValue('ภาวรินทร์'); */

    const ocrDialog = page.locator('div[role="alertdialog"][data-state="open"]');

    await expect(ocrDialog).toBeVisible();
    await expect(
        page.getByRole('heading', {
            name: 'อย่าลืมตรวจสอบข้อมูล\nก่อนยืนยันรายการ',
        })
    ).toBeVisible();

    /* await selectBuyForMyself(page);

    const idCardInput = page.locator('#insured-id-card-input-id');
    await expect(idCardInput).toBeVisible();

    await testValidValues(
        page,
        idCardInput,
        validIDcard,
    );
    await page.waitForTimeout(500);

    await selectRandomTitleName(page);
    await page.waitForTimeout(500);

    const nameInput = page.locator('#insured-name-input-id');
    const randomName = generateRandomThaiName();

    await humanFillText(nameInput, randomName);
    await page.waitForTimeout(500);

    const lastNameInput = page.locator('#insured-last-name-input-id');
    const randomLastname = generateRandomThaiLastName('เฮกู้ดดี้');

    await humanFillText(lastNameInput, randomLastname);
    await page.waitForTimeout(500);

    // await setDateOfBirth(page, '25 กันยายน 2540');
    // await page.waitForTimeout(500);

    const setDateOfBirth = page.locator('#dateOfBirth-input');
    await expect(setDateOfBirth).toBeVisible();
    await setDateOfBirth.click();

    const confirmDobBtn = page.locator('#confirm-date-of-birth-button-id');
    await confirmDobBtn.waitFor({ state: 'visible' });
    await confirmDobBtn.click();

    await page.waitForTimeout(1000);

    await humanFillText(
        page.locator('#insured-email-input-id'),
        'ptest.hg@gmail.com'
    );

    await humanFillText(
        page.locator('#insured-confirm-email-input-id'), 'ptest.hg@gmail.com'
    );
    await page.waitForTimeout(500);

    const phoneInput = page.locator('#insured-phone-number-input-id');
    await phoneInput.pressSequentially('0980356820', { delay: 40 });
    await phoneInput.blur();
    await expect(phoneInput).not.toHaveAttribute('aria-invalid', 'true')

    await openAccordion(page, 'driver-info-accordion-trigger-id');
    await selectRadioByLabel(page, 'driver1-insured-radio-id');

    await humanFillText(
        page.locator('#driver1-license-input-id'),
        '123456789012345678'
    );

    await openAccordionByText(page, 'ที่อยู่ตามบัตรประชาชน');

    await humanFillText(
        page.locator('#house-no-input-id'),
        '123/4'
    );

    await humanFillText(
        page.locator('#village-building-input-id'),
        'เดอะวิลล์ / Building 3'
    );
    await humanFillText(
        page.locator('#moo-input-id'),
        '8'
    );
    await humanFillText(
        page.locator('#alley-input-id'),
        'สุขุมวิท 22'
    );
    await humanFillText(
        page.locator('#street-input-id'),
        'พระราม 4'
    );
    await humanFillText(
        page.locator('#zipcode-input-id'),
        '10400'
    );
    await selectAddressOption(page, 'province-select-id');
    await page.waitForTimeout(500);
    await selectAddressOption(page, 'district-select-id');
    await page.waitForTimeout(500);
    await selectAddressOption(page, 'sub-district-select-id');
    await page.waitForTimeout(500);


    await openAccordionByText(page, 'ข้อมูลรถ');
    await humanFillText(
        page.locator('#license-plate-id'),
        '2เฮ้2026'
    );
    await page.waitForTimeout(500);
    await humanFillText(
        page.locator('#chassis-number-id'),
        'MRH123456789ABCDE'
    );
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id');
    await page.waitForTimeout(3000);

    const el = page.getByText(
        'หากชำระเงินหลังวันที่เลือก ระบบจะปรับเป็นวันถัดไป โดยอัตโนมัติ'
    );

    await el.waitFor({ state: 'visible' });
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible(); */


});

test('Check Validate OCR fillinfo page : Upload Image > 10 MB', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    //await selectCustomAccordionPickup(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);
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

    // close popup email
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id').nth(1);

    await expect(closeIcon).toBeVisible();
    await closeIcon.click();
    await page.waitForTimeout(1000);

    await selectBuyForMyself(page);

    // เลือก input file ที่อยู่ในปุ่ม OCR
    const fileInput = page.locator(
        '#insured-upload-id-card-button-id input[type="file"]'
    );

    // อัปโหลดไฟล์บัตรประชาชน
    await fileInput.setInputFiles('tests/fixtures/11mb-example.jpg');
    await page.waitForTimeout(5000);

    /* await page.waitForResponse(res =>
        res.url().includes('/ocr') && res.status() === 200
    );

    await expect(page.locator('input[name="firstName"]'))
        .toHaveValue('ภาวรินทร์'); */

    const ocrDialog = page.locator('div[role="alertdialog"][data-state="open"]');

    await expect(ocrDialog).toBeVisible();
    await expect(
        page.getByRole('heading', {
            name: 'รูปภาพขนาดเกิน 10 MB',
        })
    ).toBeVisible();


});


test('Check Validate OCR fillinfo page : Upload Image can not file image', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    //await selectCustomAccordionPickup(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);
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

    // close popup email
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id').nth(1);

    await expect(closeIcon).toBeVisible();
    await closeIcon.click();
    await page.waitForTimeout(1000);

    await selectBuyForMyself(page);

    // เลือก input file ที่อยู่ในปุ่ม OCR
    const fileInput = page.locator(
        '#insured-upload-id-card-button-id input[type="file"]'
    );

    // อัปโหลดไฟล์บัตรประชาชน
    await fileInput.setInputFiles('tests/fixtures/imagegif.gif');
    await page.waitForTimeout(5000);

    /* await page.waitForResponse(res =>
        res.url().includes('/ocr') && res.status() === 200
    );

    await expect(page.locator('input[name="firstName"]'))
        .toHaveValue('ภาวรินทร์'); */

    const ocrDialog = page.locator('div[role="alertdialog"][data-state="open"]');

    await expect(ocrDialog).toBeVisible();
    await expect(
        page.getByRole('heading', {
            name: 'ไฟล์ที่คุณเลือกไม่สามารถใช้งานได้',
        })
    ).toBeVisible();


});

test('Check Validate OCR fillinfo page : Upload Image can not using', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    //await selectCustomAccordionPickup(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);
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

    // close popup email
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id').nth(1);

    await expect(closeIcon).toBeVisible();
    await closeIcon.click();
    await page.waitForTimeout(1000);

    await selectBuyForMyself(page);

    // เลือก input file ที่อยู่ในปุ่ม OCR
    const fileInput = page.locator(
        '#insured-upload-id-card-button-id input[type="file"]'
    );

    // อัปโหลดไฟล์บัตรประชาชน
    await fileInput.setInputFiles('tests/fixtures/picture.jpg');
    await page.waitForTimeout(5000);

    /* await page.waitForResponse(res =>
        res.url().includes('/ocr') && res.status() === 200
    );

    await expect(page.locator('input[name="firstName"]'))
        .toHaveValue('ภาวรินทร์'); */

    const ocrDialog = page.locator('div[role="alertdialog"][data-state="open"]');

    await expect(ocrDialog).toBeVisible();
    await expect(
        page.getByRole('heading', {
            name: 'รูปภาพไม่สามารถใช้งานได้',
        })
    ).toBeVisible();


});


















