const { test, expect, request } = require('@playwright/test');

const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer, selectRandomBirthYear } = require('../../../helpers/quote-helper-random');
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
} from '../../../helpers/orferinfo-form-helpers';

const validIDcard = [
    '1100702074397',
    //   '3100900155331',
    //   '1234567890121',
    //   '0000000000001',
    //   '9999999999994',
];

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote/ev-car?sale_channel=areegator&sale_code=A123456789&sale_action=share';
//const baseURL = 'https://uat-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

async function selectSedanCarType(page) {
    const sedanCard = page.locator('#lt-individual-quote-car-type-label-id1');
    await expect(sedanCard).toBeVisible();
    await sedanCard.waitFor({ state: 'attached' });  // รอจน DOM stable
    await sedanCard.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('รถไฟฟ้า EV ไม่เกิน 7 ที่นั่ง')).toBeVisible();
    await page.waitForTimeout(500);
}

async function selectStartDate(page) {
    const selector = '[data-day="2026-03-28"]:visible';
    await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });

    const day = page.locator(selector);
    await day.click({ force: true });
    await page.waitForTimeout(2000);

    console.log('Start Date: Selected 2026-03-28');
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


test('heygoody longterm e2e Ev bymyself flow', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ไฟฟ้า (รถ EV)' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);
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

    // close popup email
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id');
    await expect(closeIcon).toBeVisible();
    await closeIcon.click();
    await page.waitForTimeout(1000);

    await selectBuyForMyself(page);

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

    const dobInput = page.locator('#dateOfBirth-input');
    await dobInput.click();
    await page.locator('[data-day*="/28/"]').click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();

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
    await page.locator('#add-address-info-button-id').click();

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
    await selectAddressOption(page, 'district-select-id');
    await page.waitForTimeout(500);
    await selectAddressOption(page, 'sub-district-select-id');
    await page.waitForTimeout(500);
    await page.locator('#delivery-address-dialog-save-button-id').click();
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
    await humanFillText(
        page.locator('#engine-number-id'),
        'ENGINENUMBEREVTES'
    );
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id');
    await page.waitForTimeout(3000);

    const nextBtn = page.locator('#next-button-id');
    await nextBtn.click();

    // assert ว่า OTP dialog โผล่
    const otpDialog = page.locator('[role="dialog"]');
    await expect(otpDialog).toBeVisible();

    await page.pause();

});

test('heygoody longterm e2e Ev by for others flow', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ไฟฟ้า (รถ EV)' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);
    await selectStartDate(page);

    // Select cmi
    const prbCard = page.locator('#quote-car-cmi-card-id');
    await expect(prbCard).toBeVisible();
    await prbCard.click();

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

    await page.locator('#checkout-button-id').click(); //ปุ่มทำรายการต่อ
    await page.waitForTimeout(1000);

    // close popup email
    const closeIcon = page.locator('#close-auth-section-dialog-icon-id');
    await expect(closeIcon).toBeVisible();
    await closeIcon.click();
    await page.waitForTimeout(1000);

    await selectBuyForOthers(page);

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

    const dobInputbirthdate = page.locator('#dateOfBirth-input');
    await dobInputbirthdate.click();
    await page.locator('[data-day*="/28/"]').click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();

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
    /*  await selectRadioByLabel(page, 'driver1-insured-radio-id');
 
     await humanFillText(
         page.locator('#driver1-license-input-id'),
         '123456789012345678'
     ); */

    //ระบุผู้ขับขี่เอง
    await selectRadioByLabel(page, 'driver1-manual-radio-id');
    await humanFillText(
        page.locator('#driver-id-card-input-id'),
        '3100900155331',
        {
            delay: 30,
            normalize: v => v.replace(/\D/g, ''), // เอาเฉพาะตัวเลข
        }
    );
    await humanFillText(
        page.locator('#driver-driving-license-input-id'),
        '6000000001111'
    );

    await randomSelectTitleNameDriver1(page);

    await humanFillText(
        page.locator('#driver-name-input-id'),
        'ระบุคนที่หนึ่ง'
    );
    await humanFillText(
        page.locator('#driver-last-name-input-id'),
        'เฮกู้ดดี้'
    );
    // dialog ผู้ขับขี่
    const driverDialog = page.getByRole('dialog', { name: /ข้อมูลผู้ขับขี่/ });
    const dobInput = driverDialog.locator('#dateOfBirth-input');
    await expect(dobInput).toBeVisible();
    await dobInput.click();
    const datePickerDialog = page.getByRole('dialog').filter({
        has: page.locator('#confirm-date-of-birth-button-id'),
    });

    const confirmDobBtn = page.locator('#confirm-dateOfBirth-button-id');
    await expect(confirmDobBtn).toBeVisible({ timeout: 10000 });
    await confirmDobBtn.click();

    await humanFillText(
        page.locator('#driver-email-input-id'),
        'heygoody.test@gmail.com'
    );
    await humanFillText(
        page.locator('#driver-phone-number-input-id'),
        '0990000000', {
        normalize: v => v.replace(/\D/g, ''),
    });
    const confirmBtn = page.locator('#driver-dialog-save-button-id');

    await confirmBtn.waitFor({ state: 'visible' });
    await confirmBtn.scrollIntoViewIfNeeded();
    await confirmBtn.click();
    //-----------------------------------------------------------

    await openAccordionByText(page, 'ที่อยู่ตามบัตรประชาชน');
    await page.locator('#add-address-info-button-id').click(); 

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
    // ✅ ลบ province-select-id ออก (ฝั่งซ้ายไม่มี)
    await selectAddressOption(page, 'district-select-id');
    await page.waitForTimeout(500);
    await selectAddressOption(page, 'sub-district-select-id');
    await page.waitForTimeout(500);
    await page.locator('#delivery-address-dialog-save-button-id').click(); 
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
    await humanFillText( 
        page.locator('#engine-number-id'),
        'ENGINENUMBEREVTES'
    );
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id'); 
    await page.waitForTimeout(3000);

    const nextBtn = page.locator('#next-button-id');
    await nextBtn.click();

    // assert ว่า OTP dialog โผล่
    const otpDialog = page.locator('[role="dialog"]');
    await expect(otpDialog).toBeVisible();
    await page.pause();

    // จบเทสตรงนี้

});









