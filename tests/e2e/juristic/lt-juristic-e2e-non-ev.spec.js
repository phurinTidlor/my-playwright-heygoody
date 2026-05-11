const { test, expect } = require('@playwright/test');

const {
    goToQuoteWithRetry,
    selectSedanCarTypeJuristic,
    generatePlateAdvanced,
} = require('../../../helpers/quote-helper-random');
const { insured, driver, foreignDriver, address, juristic } = require('../../../helpers/test-data');
const { urls } = require('../../../helpers/config');

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
    humanFillText,
    randomSelectColor,
} from '../../../helpers/orferinfo-form-helpers';

const baseURL = urls.ltJuristicQuote;

const JURISTIC_QUOTE_OPTIONS = {
    selectCarType: selectSedanCarTypeJuristic,
    skipBirthYear: true,
    welcomeText: 'เช็คเบี้ยประกันรถนิติบุคคล',
};

/** ขั้นตอนร่วมก่อนถึง driver section: quote → plan → checkout → company + signatory + email/phone */
async function setupJuristicOrder(page) {
    await goToQuoteWithRetry(page, baseURL, JURISTIC_QUOTE_OPTIONS);
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
        firstName: generateRandomThaiName(),
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

/** ขั้นตอนร่วมหลัง driver: ที่อยู่ + ข้อมูลรถ + กดถัดไป + assert OTP */
async function finalizeJuristicOrder(page) {
    await fillAddressInfo(page, address);

    await openAccordionByText(page, 'ข้อมูลรถ');
    await humanFillText(page.locator('#license-plate-id'), await generatePlateAdvanced());
    await page.waitForTimeout(500);
    await humanFillText(page.locator('#chassis-number-id'), generateChassisNumber());
    await page.waitForTimeout(500);
    await randomSelectColor(page, 'car-color-id');
    await page.waitForTimeout(3000);

    await page.locator('#next-button-id').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.pause();
}

// ─────────────────────────────────────────────────────────────────────

test('heygoody longterm e2e juristic non-ev bymyself flow', async ({ page }) => {
    test.setTimeout(120_000);

    await setupJuristicOrder(page);

    // Driver 1 = ใช้ข้อมูลเจ้าของรถ (บริษัท/signatory)
    await expect(page.getByText('ข้อมูลผู้ขับขี่')).toBeVisible();
    await selectRadioByLabel(page, 'driver1-insured-radio-id');
    await humanFillText(
        page.locator('#driver1-license-input-id'),
        generateUniqueLicense()
    );

    await finalizeJuristicOrder(page);
});

test('heygoody longterm e2e juristic non-ev by for others flow', async ({ page }) => {
    test.setTimeout(120_000);

    await setupJuristicOrder(page);

    // Driver 1 = manual entry
    await fillDriverInfoManual(page, {
        ...driver,
        idCard: generateUniqueThaiIDCard(),
        license: generateUniqueLicense(),
    });

    await finalizeJuristicOrder(page);
});

test('heygoody longterm e2e juristic non-ev add 5 drivers flow', async ({ page }) => {
    test.setTimeout(180_000);

    await setupJuristicOrder(page);

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

    await finalizeJuristicOrder(page);
});

test('heygoody longterm e2e juristic non-ev add 5 foreign drivers flow', async ({ page }) => {
    test.setTimeout(180_000);

    await setupJuristicOrder(page);

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

    await finalizeJuristicOrder(page);
});

test('heygoody longterm e2e juristic non-ev bymyself add Thai+foreign drivers flow', async ({ page }) => {
    test.setTimeout(120_000);

    await setupJuristicOrder(page);

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

    await finalizeJuristicOrder(page);
});