const { test, expect, request } = require('@playwright/test');

const { selectRandomBrand, selectRandomModel, selectRandomYear, selectRandomSubmodel, selectRandomProvince, selectRandomInsurer, selectRandomBirthYear } = require('../../../helpers/quote-helper-random');
const { insured, driver } = require('../../../helpers/test-data');
const { bypassOTP, acceptConsentAndPay, selectPaymentMethodAndConfirm, triggerPaymentWebhook } = require('../../../helpers/api-helpers');
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
    randomSelectTitleNameDriver1,
    closeLoginPopup,
    closeEmailPopup,
} from '../../../helpers/orferinfo-form-helpers';

const validIDcard = [
    '1100702074397',
    //   '3100900155331',
    //   '1234567890121',
    //   '0000000000001',
    //   '9999999999994',
];

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote/car?sale_channel=areegator&sale_code=A123456789&sale_action=share';
//const baseURL = 'https://uat-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

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
    const selector = '[data-day="2026-05-28"]:visible';
    await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });

    const day = page.locator(selector);
    await day.click({ force: true });
    await page.waitForTimeout(2000);

    console.log('Start Date: Selected 2026-05-28');
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


test('heygoody longterm e2e non-ev bymyself flow', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ รถเก๋ง และรถกระบะ 4 ประตู' })).toBeVisible();
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

    await closeLoginPopup(page);

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

    await closeEmailPopup(page);

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

    // const setDateOfBirth = page.locator('#dateOfBirth-input');
    // await expect(setDateOfBirth).toBeVisible();
    // await setDateOfBirth.click();

    // const confirmDobBtn = page.locator('#confirm-date-of-birth-button-id');
    // await confirmDobBtn.waitFor({ state: 'visible' });
    // await confirmDobBtn.click();

    const dobInput = page.locator('#dateOfBirth-input');
    await dobInput.click();
    await page.locator('[data-day*="/28/"]').click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();


    await page.waitForTimeout(1000);

    await humanFillText(
        page.locator('#insured-email-input-id'),
        insured.email
    );

    await humanFillText(
        page.locator('#insured-confirm-email-input-id'), insured.email
    );
    await page.waitForTimeout(500);

    const phoneInput = page.locator('#insured-phone-number-input-id');
    await phoneInput.pressSequentially(insured.phone, { delay: 40 });
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
    // await selectAddressOption(page, 'province-select-id');
    // await page.waitForTimeout(500);
    await selectAddressOption(page, 'district-select-id');
    await page.waitForTimeout(500);
    await selectAddressOption(page, 'sub-district-select-id');
    await page.waitForTimeout(500);
    await page.locator('#delivery-address-dialog-save-button-id').click();
    await page.waitForTimeout(500);


    await openAccordionByText(page, 'ข้อมูลรถ');
    await humanFillText(
        page.locator('#license-plate-id'),
        '2เฮ้2010'
    );
    await page.waitForTimeout(500);
    await humanFillText(
        page.locator('#chassis-number-id'),
        'AFFILIATESTEST001'
    );
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id');
    await page.waitForTimeout(3000);

    // const el = page.getByText(
    //     'หากชำระเงินหลัง 22:00 น. ของวันเริ่มต้นความคุ้มครองที่ระบุ ระบบจะปรับเป็นวันที่ชำระเงินสำเร็จให้อัตโนมัติ'
    // );

    // await el.waitFor({ state: 'visible' });
    // await el.scrollIntoViewIfNeeded();
    // await expect(el).toBeVisible();

    const nextBtn = page.locator('#next-button-id');
    await nextBtn.click();

    // assert ว่า OTP dialog โผล่
    const otpDialog = page.locator('[role="dialog"]');
    await expect(otpDialog).toBeVisible();

    // bypass OTP "123456" + กดยืนยัน
    await bypassOTP(page);

    // ยอมรับเงื่อนไข + กดชำระเลย + เก็บ order_no
    const { orderNo } = await acceptConsentAndPay(page);

    // เลือกวิธีชำระเงิน (QR Code) + หน่วง 5 วิ + กดชำระเงิน
    await selectPaymentMethodAndConfirm(page);

    // กรอก order_no ในเว็บ webhook payment + กดส่งข้อมูล
    await triggerPaymentWebhook(page, orderNo, { pause: true });


});

test('heygoody longterm e2e non-ev bymyself flow without CMI (no พ.ร.บ.)', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ รถเก๋ง และรถกระบะ 4 ประตู' })).toBeVisible();
    await selectSedanCarType(page);

    await selectRandomBrand(page);
    await selectRandomModel(page);
    await selectRandomYear(page);
    await selectRandomSubmodel(page);
    await selectRandomProvince(page);
    await selectRandomInsurer(page);
    await selectRandomBirthYear(page);
    await selectStartDate(page);

    // default หน้า quote = พ.ร.บ. ถูกเลือกอยู่ → คลิกเพื่อ untoggle
    const prbCard = page.locator('#quote-car-cmi-card-id');
    await expect(prbCard).toBeVisible();
    await prbCard.click();

    await submitQuote(page);
    await page.waitForTimeout(1000);

    await closeLoginPopup(page);

    const recommendedCard = page
        .locator('#insurance-coverage-head-component-id')
        .filter({ hasText: 'แผนแนะนำ' })
        .locator('..');

    await recommendedCard.locator('#choose-plan-button-id').click();
    await expect(recommendedCard.locator('text=แผนแนะนำ')).toBeVisible();
    await page.waitForTimeout(1000);

    await page.locator('#checkout-button-id').click();
    await page.waitForTimeout(1000);

    await closeEmailPopup(page);

    await selectBuyForMyself(page);

    const idCardInput = page.locator('#insured-id-card-input-id');
    await expect(idCardInput).toBeVisible();
    await testValidValues(page, idCardInput, validIDcard);
    await page.waitForTimeout(500);

    await selectRandomTitleName(page);
    await page.waitForTimeout(500);

    await humanFillText(page.locator('#insured-name-input-id'), generateRandomThaiName());
    await page.waitForTimeout(500);

    await humanFillText(page.locator('#insured-last-name-input-id'), generateRandomThaiLastName('เฮกู้ดดี้'));
    await page.waitForTimeout(500);

    const dobInput = page.locator('#dateOfBirth-input');
    await dobInput.click();
    await page.locator('[data-day*="/28/"]').click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    await page.waitForTimeout(1000);

    await humanFillText(page.locator('#insured-email-input-id'), insured.email);
    await humanFillText(page.locator('#insured-confirm-email-input-id'), insured.email);
    await page.waitForTimeout(500);

    const phoneInput = page.locator('#insured-phone-number-input-id');
    await phoneInput.pressSequentially(insured.phone, { delay: 40 });
    await phoneInput.blur();
    await expect(phoneInput).not.toHaveAttribute('aria-invalid', 'true');

    await openAccordion(page, 'driver-info-accordion-trigger-id');
    await selectRadioByLabel(page, 'driver1-insured-radio-id');
    await humanFillText(page.locator('#driver1-license-input-id'), '123456789012345678');

    await openAccordionByText(page, 'ที่อยู่ตามบัตรประชาชน');
    await page.locator('#add-address-info-button-id').click();
    await humanFillText(page.locator('#house-no-input-id'), '123/4');
    await humanFillText(page.locator('#village-building-input-id'), 'เดอะวิลล์ / Building 3');
    await humanFillText(page.locator('#moo-input-id'), '8');
    await humanFillText(page.locator('#alley-input-id'), 'สุขุมวิท 22');
    await humanFillText(page.locator('#street-input-id'), 'พระราม 4');
    await humanFillText(page.locator('#zipcode-input-id'), '10400');
    await selectAddressOption(page, 'district-select-id');
    await page.waitForTimeout(500);
    await selectAddressOption(page, 'sub-district-select-id');
    await page.waitForTimeout(500);
    await page.locator('#delivery-address-dialog-save-button-id').click();
    await page.waitForTimeout(500);

    await openAccordionByText(page, 'ข้อมูลรถ');
    await humanFillText(page.locator('#license-plate-id'), '2เฮ้2010');
    await page.waitForTimeout(500);
    await humanFillText(page.locator('#chassis-number-id'), 'AFFILIATESTEST001');
    await page.waitForTimeout(500);
    // ไม่มีฟิลด์สีรถเมื่อไม่ซื้อ พ.ร.บ. — ข้าม randomSelectColor
    await page.waitForTimeout(2000);

    await page.locator('#next-button-id').click();

    const otpDialog = page.locator('[role="dialog"]');
    await expect(otpDialog).toBeVisible();

    await bypassOTP(page);
    const { orderNo } = await acceptConsentAndPay(page);
    await selectPaymentMethodAndConfirm(page);
    await triggerPaymentWebhook(page, orderNo, { pause: true });
});

test('heygoody longterm e2e non-ev by for others flow', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ รถเก๋ง และรถกระบะ 4 ประตู' })).toBeVisible();
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

    await closeLoginPopup(page);

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

    await closeEmailPopup(page);

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

    /* const setDateOfBirth = page.locator('#dateOfBirth-input');
    await expect(setDateOfBirth).toBeVisible();
    await setDateOfBirth.click();

    const confirmDobBtn = page.locator('#confirm-date-of-birth-button-id');
    await confirmDobBtn.waitFor({ state: 'visible' });
    await confirmDobBtn.click(); */

    const dobInputbirthdate = page.locator('#dateOfBirth-input');
    await dobInputbirthdate.click();
    await page.locator('[data-day*="/28/"]').click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();

    await page.waitForTimeout(1000);

    await humanFillText(
        page.locator('#insured-email-input-id'),
        insured.email
    );

    await humanFillText(
        page.locator('#insured-confirm-email-input-id'), insured.email
    );
    await page.waitForTimeout(500);

    const phoneInput = page.locator('#insured-phone-number-input-id');
    await phoneInput.pressSequentially(insured.phone, { delay: 40 });
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
        driver.idCard,
        {
            delay: 30,
            normalize: v => v.replace(/\D/g, ''), // เอาเฉพาะตัวเลข
        }
    );
    await humanFillText(
        page.locator('#driver-driving-license-input-id'),
        driver.license
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
        has: page.locator('#confirm-dateOfBirth-button-id'),
    });
    const confirmDobBtn1 = datePickerDialog.locator('#confirm-dateOfBirth-button-id');
    await expect(confirmDobBtn1).toBeVisible();
    await confirmDobBtn1.click(); // ปุ่มยืนยันวันเกิด (อยู่ใน date picker dialog)



    await humanFillText(
        page.locator('#driver-email-input-id'),
        driver.email
    );
    await humanFillText(
        page.locator('#driver-phone-number-input-id'),
        driver.phone, {
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
    // await selectAddressOption(page, 'province-select-id');
    // await page.waitForTimeout(500);
    await selectAddressOption(page, 'district-select-id');
    await page.waitForTimeout(500);
    await selectAddressOption(page, 'sub-district-select-id');
    await page.waitForTimeout(500);
    await page.locator('#delivery-address-dialog-save-button-id').click();
    await page.waitForTimeout(500);


    await openAccordionByText(page, 'ข้อมูลรถ');
    await humanFillText(
        page.locator('#license-plate-id'),
        '2เฮ้2011'
    );
    await page.waitForTimeout(500);
    await humanFillText(
        page.locator('#chassis-number-id'),
        'AFFILIATESTEST002'
    );
    await page.waitForTimeout(500);
    // await randomSelectColor(page, 'car-color-id');
    // await page.waitForTimeout(3000);

    // const el = page.getByText(
    //     'หากชำระเงินหลัง 22:00 น. ของวันเริ่มต้นความคุ้มครองที่ระบุ ระบบจะปรับเป็นวันที่ชำระเงินสำเร็จให้อัตโนมัติ'
    // );

    // await el.waitFor({ state: 'visible' });
    // await el.scrollIntoViewIfNeeded();
    // await expect(el).toBeVisible();

    // const nextBtn = page.locator('#next-button-id');
    // await expect(nextBtn).toBeVisible();
    // await expect(nextBtn).toBeEnabled();
    // await nextBtn.scrollIntoViewIfNeeded();
    // await nextBtn.click();

    const nextBtn = page.locator('#next-button-id');
    await nextBtn.click();

    // assert ว่า OTP dialog โผล่
    const otpDialog = page.locator('[role="dialog"]');
    await expect(otpDialog).toBeVisible();

    // bypass OTP "123456" + กดยืนยัน
    await bypassOTP(page);

    // ยอมรับเงื่อนไข + กดชำระเลย + เก็บ order_no
    const { orderNo } = await acceptConsentAndPay(page);

    // เลือกวิธีชำระเงิน (QR Code) + หน่วง 5 วิ + กดชำระเงิน
    await selectPaymentMethodAndConfirm(page);

    // กรอก order_no ในเว็บ webhook payment + กดส่งข้อมูล
    await triggerPaymentWebhook(page, orderNo, { pause: true });

    // จบเทสตรงนี้

});









