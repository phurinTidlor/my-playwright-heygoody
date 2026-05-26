const { test, expect } = require('@playwright/test');

const {
    goToQuoteWithRetry,
    selectSedanCarTypeEVJuristic,
    generatePlateAdvanced,
} = require('../../../helpers/quote-helper-random');
const { insured, driver, foreignDriver, address, juristic } = require('../../../helpers/test-data');
const { urls } = require('../../../helpers/config');
const { bypassOTP, acceptConsentAndPay, selectPaymentMethodAndConfirm, triggerPaymentWebhook } = require('../../../helpers/api-helpers');

import {
    closeLoginPopup,
    closeEmailPopup,
    selectRadioByLabel,
    openAccordionByText,
    fillAddressInfo,
    fillDriverInfoManual,
    addAdditionalDriver,
    fillJuristicCompanyInfo,
    fillJuristicSignatory,
    generateUniqueThaiIDCard,
    generateUniqueLicense,
    generateUniquePassport,
    generateUniqueJuristicId,
    generateRandomThaiName,
    generateRandomThaiLastName,
    generateChassisNumber,
    generateEngineNumber,
    humanFillText,
    maybeSelectCarColor,
} from '../../../helpers/orferinfo-form-helpers';

const baseURL = urls.ltJuristicQuote;

const JURISTIC_EV_QUOTE_OPTIONS = {
    selectCarType: selectSedanCarTypeEVJuristic,
    skipBirthYear: true,
    welcomeText: 'เช็คเบี้ยประกันรถนิติบุคคล',
};

/** ขั้นตอนร่วมก่อนถึง driver section: quote → plan → checkout → company + signatory + email/phone */
async function setupJuristicEvOrder(page, extraOptions = {}) {
    await goToQuoteWithRetry(page, baseURL, { ...JURISTIC_EV_QUOTE_OPTIONS, ...extraOptions });
    await page.waitForTimeout(1000);

    await closeLoginPopup(page);

    // เลือกแผนแนะนำ
    const recommendedCard = page
        .locator('#insurance-coverage-head-component-id')
        .filter({ hasText: 'แผนแนะนำ' })
        .locator('..');
    await recommendedCard.locator('#choose-plan-button-id').click();
    await expect(recommendedCard.locator('text=แผนแนะนำ')).toBeVisible();
    await page.waitForTimeout(1000);

    await page.locator('#checkout-button-id').click();
    await page.waitForTimeout(1000);

    await closeLoginPopup(page);
    await closeEmailPopup(page);

    // ข้อมูลบริษัท + ผู้เซ็นรับรอง
    await fillJuristicCompanyInfo(page, {
        juristicId: generateUniqueJuristicId(),
        companyName: juristic.companyName,
        branch: juristic.branch,
    });
    await fillJuristicSignatory(page, {
        idCard: generateUniqueThaiIDCard(),
        firstName: generateRandomThaiName('จูริสติค'),
        lastName: generateRandomThaiLastName('เฮกู้ดดี้'),
    });

    // email + phone
    await humanFillText(page.locator('#insured-email-input-id'), insured.email);
    await humanFillText(page.locator('#insured-confirm-email-input-id'), insured.email);
    await page.waitForTimeout(500);

    const phoneInput = page.locator('#insured-phone-number-input-id');
    await phoneInput.pressSequentially(insured.phone, { delay: 40 });
    await phoneInput.blur();
    await expect(phoneInput).not.toHaveAttribute('aria-invalid', 'true');
}

/** ขั้นตอนร่วมหลัง driver: ที่อยู่ + ข้อมูลรถ (incl. engine number) + กดถัดไป + assert OTP
 * @param {{ skipCarColor?: boolean }} options - skipCarColor=true เมื่อไม่ซื้อ พ.ร.บ.
 */
async function finalizeJuristicEvOrder(page, { skipCarColor = false } = {}) {
    await fillAddressInfo(page, address);

    await openAccordionByText(page, 'ข้อมูลรถ');
    await humanFillText(page.locator('#license-plate-id'), await generatePlateAdvanced());
    await page.waitForTimeout(500);
    await humanFillText(page.locator('#chassis-number-id'), generateChassisNumber());
    await humanFillText(page.locator('#engine-number-id'), generateEngineNumber());
    await page.waitForTimeout(500);
    if (!skipCarColor) {
        await maybeSelectCarColor(page);
    }
    await page.waitForTimeout(3000);

    await page.locator('#next-button-id').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // bypass OTP "123456" + กดยืนยัน
    await bypassOTP(page);

    // ยอมรับเงื่อนไข + กดชำระเลย + เก็บ order_no
    const { orderNo } = await acceptConsentAndPay(page);

    // เลือกวิธีชำระเงิน (QR Code) + หน่วง 5 วิ + กดชำระเงิน
    await selectPaymentMethodAndConfirm(page);

    // กรอก order_no ในเว็บ webhook payment + กดส่งข้อมูล
    await triggerPaymentWebhook(page, orderNo, { pause: true });
}

// ─────────────────────────────────────────────────────────────────────

test('heygoody longterm e2e juristic ev bymyself flow', async ({ page }) => {
    test.setTimeout(180_000);

    await setupJuristicEvOrder(page);

    // Driver 1 = ใช้ข้อมูลเจ้าของรถ (บริษัท/signatory)
    await expect(page.getByText('ข้อมูลผู้ขับขี่')).toBeVisible();
    await selectRadioByLabel(page, 'driver1-insured-radio-id');
    await humanFillText(
        page.locator('#driver1-license-input-id'),
        generateUniqueLicense()
    );

    await finalizeJuristicEvOrder(page);
});

test('heygoody longterm e2e juristic ev bymyself flow without CMI (no พ.ร.บ.)', async ({ page }) => {
    test.setTimeout(180_000);

    // default หน้า quote = พ.ร.บ. ถูกเลือกอยู่ → คลิก #quote-car-cmi-card-id เพื่อ untoggle
    await setupJuristicEvOrder(page, {
        beforeSubmit: async (p) => {
            const prbCard = p.locator('#quote-car-cmi-card-id');
            await expect(prbCard).toBeVisible();
            await prbCard.click();
        },
    });

    await expect(page.getByText('ข้อมูลผู้ขับขี่')).toBeVisible();
    await selectRadioByLabel(page, 'driver1-insured-radio-id');
    await humanFillText(
        page.locator('#driver1-license-input-id'),
        generateUniqueLicense()
    );

    await finalizeJuristicEvOrder(page, { skipCarColor: true });
});

test('heygoody longterm e2e juristic ev by for others flow', async ({ page }) => {
    test.setTimeout(180_000);

    // EV for-others มีการเลือก CMI ก่อนกด "ดูแผน"
    await setupJuristicEvOrder(page, {
        beforeSubmit: async (p) => {
            const prbCard = p.locator('#quote-car-cmi-card-id');
            await expect(prbCard).toBeVisible();
            await prbCard.click();
        },
    });

    // Driver 1 = manual entry
    await fillDriverInfoManual(page, {
        ...driver,
        idCard: generateUniqueThaiIDCard(),
        license: generateUniqueLicense(),
    });

    await finalizeJuristicEvOrder(page);
});

test('heygoody longterm e2e juristic ev add 5 drivers flow', async ({ page }) => {
    test.setTimeout(180_000);

    await setupJuristicEvOrder(page);

    const driverNames = [
        'ระบุคนที่หนึ่ง',
        'ระบุคนที่สอง',
        'ระบุคนที่สาม',
        'ระบุคนที่สี่',
        'ระบุคนที่ห้า',
    ];

    await fillDriverInfoManual(page, {
        ...driver,
        idCard: generateUniqueThaiIDCard(),
        license: generateUniqueLicense(),
        name: driverNames[0],
    });

    for (let i = 1; i < 5; i++) {
        await addAdditionalDriver(page, {
            ...driver,
            idCard: generateUniqueThaiIDCard(),
            license: generateUniqueLicense(),
            name: driverNames[i],
        });
    }

    await finalizeJuristicEvOrder(page);
});

test('heygoody longterm e2e juristic ev add 5 foreign drivers flow', async ({ page }) => {
    test.setTimeout(180_000);

    await setupJuristicEvOrder(page);

    const foreignNames = [
        { name: 'John', lastName: 'Doe' },
        { name: 'Jane', lastName: 'Smith' },
        { name: 'Tom', lastName: 'Brown' },
        { name: 'Sarah', lastName: 'Wilson' },
        { name: 'Mike', lastName: 'Johnson' },
    ];

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

    await finalizeJuristicEvOrder(page);
});

test('heygoody longterm e2e juristic ev bymyself add Thai+foreign drivers flow', async ({ page }) => {
    test.setTimeout(180_000);

    await setupJuristicEvOrder(page);

    // Driver 1 = ใช้ข้อมูลเจ้าของรถ
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

    await finalizeJuristicEvOrder(page);
});