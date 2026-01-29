const { test, expect, request } = require('@playwright/test');

const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer, selectRandomBirthYear, selectCustomAccordionPickup } = require('../../helpers/quote-helper-random');
import {
    selectBuyForMyself,
} from '../../helpers/orferinfo-form-helpers';



const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/st-individual/new/quote';
//const baseURL = 'https://uat-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

async function selectSedanCarType(page) {
    const sedanCard = page.locator('#lt-individual-quote-car-type-label-id2'); //id0=Nonev, id1=EV, id2=Pickup, id3=Van 
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

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ระยะสั้น' })).toBeVisible();

    // await selectRandomBrand(page);
    // await selectRandomModel(page);
    // await selectRandomYear(page);
    // await selectRandomSubmodel(page);

    // Select brand 
    await page.click('text=TOYOTA');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ยี่ห้อรถ TOYOTA' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YARIS' })).toBeVisible();

    // Select model
    await page.click('text=YARIS');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'รุ่นรถ YARIS' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2024 (2567)' })).toBeVisible();

    // Select year
    await page.click('text=2024 (2567)');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ปีที่ผลิต 2024 (2567)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YARIS Premium 1.2' })).toBeVisible();

    // Select submodel
    await page.click('text=YARIS Premium 1.2');
    await page.waitForTimeout(1000);

    await selectRandomInsurer(page);
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
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id');

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

    const ocrDialog = page.locator('div[role="alertdialog"][data-state="open"]');

    await expect(ocrDialog).toBeVisible();
    await expect(
        page.getByRole('heading', {
            name: 'อย่าลืมตรวจสอบข้อมูล\nก่อนยืนยันรายการ',
        })
    ).toBeVisible();

});

test('Check Validate OCR fillinfo page : Upload Image > 10 MB', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ระยะสั้น' })).toBeVisible();

    // Select brand 
    await page.click('text=TOYOTA');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ยี่ห้อรถ TOYOTA' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YARIS' })).toBeVisible();

    // Select model
    await page.click('text=YARIS');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'รุ่นรถ YARIS' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2024 (2567)' })).toBeVisible();

    // Select year
    await page.click('text=2024 (2567)');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ปีที่ผลิต 2024 (2567)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YARIS Premium 1.2' })).toBeVisible();

    // Select submodel
    await page.click('text=YARIS Premium 1.2');
    await page.waitForTimeout(1000);

    await selectRandomInsurer(page);
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
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id');

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

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ระยะสั้น' })).toBeVisible();

    // Select brand 
    await page.click('text=TOYOTA');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ยี่ห้อรถ TOYOTA' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YARIS' })).toBeVisible();

    // Select model
    await page.click('text=YARIS');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'รุ่นรถ YARIS' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2024 (2567)' })).toBeVisible();

    // Select year
    await page.click('text=2024 (2567)');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ปีที่ผลิต 2024 (2567)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YARIS Premium 1.2' })).toBeVisible();

    // Select submodel
    await page.click('text=YARIS Premium 1.2');
    await page.waitForTimeout(1000);

    await selectRandomInsurer(page);
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
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id');

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

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ระยะสั้น' })).toBeVisible();

    // Select brand 
    await page.click('text=TOYOTA');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ยี่ห้อรถ TOYOTA' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YARIS' })).toBeVisible();

    // Select model
    await page.click('text=YARIS');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'รุ่นรถ YARIS' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2024 (2567)' })).toBeVisible();

    // Select year
    await page.click('text=2024 (2567)');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ปีที่ผลิต 2024 (2567)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YARIS Premium 1.2' })).toBeVisible();

    // Select submodel
    await page.click('text=YARIS Premium 1.2');
    await page.waitForTimeout(1000);

    await selectRandomInsurer(page);
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
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id');

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

    const ocrDialog = page.locator('div[role="alertdialog"][data-state="open"]');

    await expect(ocrDialog).toBeVisible();
    await expect(
        page.getByRole('heading', {
            name: 'รูปภาพไม่สามารถใช้งานได้',
        })
    ).toBeVisible();


});


















