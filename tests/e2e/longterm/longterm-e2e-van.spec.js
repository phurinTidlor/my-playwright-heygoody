const { test, expect } = require('@playwright/test');

const {
    goToQuoteWithRetry,
    selectSedanCarTypeVan,
    generatePlateAdvanced,
} = require('../../../helpers/quote-helper-random');
const { insured, driver, foreignDriver, address } = require('../../../helpers/test-data');
const { urls } = require('../../../helpers/config');
const { bypassOTP, acceptConsentAndPay, selectPaymentMethodAndConfirm, triggerPaymentWebhook } = require('../../../helpers/api-helpers');

import {
    selectBuyForMyself,
    selectBuyForOthers,
    closeLoginPopup,
    closeEmailPopup,
    testValidValues,
    selectRandomTitleName,
    generateRandomThaiName,
    generateRandomThaiLastName,
    generateUniqueThaiIDCard,
    generateUniqueLicense,
    generateUniquePassport,
    generateChassisNumber,
    humanFillText,
    selectRadioByLabel,
    openAccordionByText,
    fillAddressInfo,
    fillDriverInfoManual,
    addAdditionalDriver,
    randomSelectColor,
} from '../../../helpers/orferinfo-form-helpers';

const baseURL = urls.ltIndividualQuote;

const VAN_QUOTE_OPTIONS = {
    selectCarType: selectSedanCarTypeVan,
};

test('heygoody longterm e2e van bymyself flow', async ({ page }) => {
    test.setTimeout(180_000);

    await goToQuoteWithRetry(page, baseURL, VAN_QUOTE_OPTIONS);
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

    const validIDcard = Array.from({ length: 1 }, () => generateUniqueThaiIDCard());
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

    // Driver 1 = ตัวเอง (ใช้ข้อมูลผู้เอาประกัน)
    await expect(page.getByText('ข้อมูลผู้ขับขี่')).toBeVisible();
    await selectRadioByLabel(page, 'driver1-insured-radio-id');
    await humanFillText(
        page.locator('#driver1-license-input-id'),
        generateUniqueLicense()
    );

    await fillAddressInfo(page, address, 'address-information-header-id');

    await openAccordionByText(page, 'ข้อมูลรถ');

    await humanFillText(
        page.locator('#license-plate-id'),
        await generatePlateAdvanced()
    );
    await page.waitForTimeout(500);
    await humanFillText(
        page.locator('#chassis-number-id'),
        generateChassisNumber()
    );
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id');
    await page.waitForTimeout(3000);

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

test('heygoody longterm e2e van bymyself flow without CMI (no พ.ร.บ.)', async ({ page }) => {
    test.setTimeout(180_000);

    // default หน้า quote = พ.ร.บ. ถูกเลือกอยู่ → คลิก #quote-car-cmi-card-id เพื่อ untoggle
    await goToQuoteWithRetry(page, baseURL, {
        ...VAN_QUOTE_OPTIONS,
        beforeSubmit: async (p) => {
            const prbCard = p.locator('#quote-car-cmi-card-id');
            await expect(prbCard).toBeVisible();
            await prbCard.click();
        },
    });
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

    const validIDcard = Array.from({ length: 1 }, () => generateUniqueThaiIDCard());
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

    await expect(page.getByText('ข้อมูลผู้ขับขี่')).toBeVisible();
    await selectRadioByLabel(page, 'driver1-insured-radio-id');
    await humanFillText(page.locator('#driver1-license-input-id'), generateUniqueLicense());

    await fillAddressInfo(page, address, 'address-information-header-id');

    await openAccordionByText(page, 'ข้อมูลรถ');
    await humanFillText(page.locator('#license-plate-id'), await generatePlateAdvanced());
    await page.waitForTimeout(500);
    await humanFillText(page.locator('#chassis-number-id'), generateChassisNumber());
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

test('heygoody longterm e2e van by for others flow', async ({ page }) => {
    test.setTimeout(180_000);

    await goToQuoteWithRetry(page, baseURL, VAN_QUOTE_OPTIONS);
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
    await selectBuyForOthers(page);

    const idCardInput = page.locator('#insured-id-card-input-id');
    await expect(idCardInput).toBeVisible();

    const validIDcard = Array.from({ length: 1 }, () => generateUniqueThaiIDCard());
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

    await fillDriverInfoManual(page, driver);

    await fillAddressInfo(page, address, 'add-address-info-button-id');

    await openAccordionByText(page, 'ข้อมูลรถ');

    await humanFillText(
        page.locator('#license-plate-id'),
        await generatePlateAdvanced()
    );
    await page.waitForTimeout(500);
    await humanFillText(
        page.locator('#chassis-number-id'),
        generateChassisNumber()
    );
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id');
    await page.waitForTimeout(3000);

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

test('heygoody longterm e2e van add 5 drivers flow', async ({ page }) => {
    test.setTimeout(180_000);

    await goToQuoteWithRetry(page, baseURL, VAN_QUOTE_OPTIONS);
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
    await selectBuyForOthers(page);

    const idCardInput = page.locator('#insured-id-card-input-id');
    await expect(idCardInput).toBeVisible();

    const validIDcard = Array.from({ length: 1 }, () => generateUniqueThaiIDCard());
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

    const driverNames = [
        'ระบุคนที่หนึ่ง',
        'ระบุคนที่สอง',
        'ระบุคนที่สาม',
        'ระบุคนที่สี่',
        'ระบุคนที่ห้า',
    ];

    // Driver คนแรก
    await fillDriverInfoManual(page, {
        ...driver,
        idCard: generateUniqueThaiIDCard(),
        license: generateUniqueLicense(),
        name: driverNames[0],
    });

    // เพิ่ม driver คนที่ 2-5
    for (let i = 1; i < 5; i++) {
        await addAdditionalDriver(page, {
            ...driver,
            idCard: generateUniqueThaiIDCard(),
            license: generateUniqueLicense(),
            name: driverNames[i],
        });
    }

    await fillAddressInfo(page, address, 'add-address-info-button-id');

    await openAccordionByText(page, 'ข้อมูลรถ');

    await humanFillText(
        page.locator('#license-plate-id'),
        await generatePlateAdvanced()
    );
    await page.waitForTimeout(500);
    await humanFillText(
        page.locator('#chassis-number-id'),
        generateChassisNumber()
    );
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id');
    await page.waitForTimeout(3000);

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

test('heygoody longterm e2e van add 5 foreign drivers flow', async ({ page }) => {
    test.setTimeout(180_000);

    await goToQuoteWithRetry(page, baseURL, VAN_QUOTE_OPTIONS);
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
    await selectBuyForOthers(page);

    const idCardInput = page.locator('#insured-id-card-input-id');
    await expect(idCardInput).toBeVisible();

    const validIDcard = Array.from({ length: 1 }, () => generateUniqueThaiIDCard());
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

    const foreignNames = [
        { name: 'John', lastName: 'Doe' },
        { name: 'Jane', lastName: 'Smith' },
        { name: 'Tom', lastName: 'Brown' },
        { name: 'Sarah', lastName: 'Wilson' },
        { name: 'Mike', lastName: 'Johnson' },
    ];

    // Driver คนแรก — ต่างชาติ
    await fillDriverInfoManual(
        page,
        {
            ...foreignDriver,
            passport: generateUniquePassport(),
            license: generateUniqueLicense(),
            ...foreignNames[0],
        },
        { foreign: true }
    );

    // เพิ่ม driver คนที่ 2-5 — ต่างชาติ
    for (let i = 1; i < 5; i++) {
        await addAdditionalDriver(
            page,
            {
                ...foreignDriver,
                passport: generateUniquePassport(),
                license: generateUniqueLicense(),
                ...foreignNames[i],
            },
            { foreign: true }
        );
    }

    await fillAddressInfo(page, address, 'add-address-info-button-id');

    await openAccordionByText(page, 'ข้อมูลรถ');

    await humanFillText(
        page.locator('#license-plate-id'),
        await generatePlateAdvanced()
    );
    await page.waitForTimeout(500);
    await humanFillText(
        page.locator('#chassis-number-id'),
        generateChassisNumber()
    );
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id');
    await page.waitForTimeout(3000);

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

test('heygoody longterm e2e van bymyself add Thai+foreign drivers flow', async ({ page }) => {
    test.setTimeout(180_000);

    await goToQuoteWithRetry(page, baseURL, VAN_QUOTE_OPTIONS);
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

    const validIDcard = Array.from({ length: 1 }, () => generateUniqueThaiIDCard());
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

    // Driver 1 = ตัวเอง (ใช้ข้อมูลผู้เอาประกัน)
    await expect(page.getByText('ข้อมูลผู้ขับขี่')).toBeVisible();
    await selectRadioByLabel(page, 'driver1-insured-radio-id');
    await humanFillText(
        page.locator('#driver1-license-input-id'),
        generateUniqueLicense()
    );

    // Driver 2 = คนไทย
    await addAdditionalDriver(page, {
        ...driver,
        idCard: generateUniqueThaiIDCard(),
        license: generateUniqueLicense(),
        name: 'ระบุคนที่สอง',
    });

    // Driver 3 = ต่างชาติ
    await addAdditionalDriver(
        page,
        {
            ...foreignDriver,
            passport: generateUniquePassport(),
            license: generateUniqueLicense(),
            name: 'John',
            lastName: 'Doe',
        },
        { foreign: true }
    );

    await fillAddressInfo(page, address, 'address-information-header-id');

    await openAccordionByText(page, 'ข้อมูลรถ');

    await humanFillText(
        page.locator('#license-plate-id'),
        await generatePlateAdvanced()
    );
    await page.waitForTimeout(500);
    await humanFillText(
        page.locator('#chassis-number-id'),
        generateChassisNumber()
    );
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id');
    await page.waitForTimeout(3000);

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