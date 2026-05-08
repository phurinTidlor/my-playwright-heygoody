import { expect } from '@playwright/test';

/** เลือกซื้อให้ตัวเอง (ใช้แทบทุก test) */
export async function selectBuyForMyself(page) {
    const tab = page.getByRole('tab', { name: /ซื้อให้ตัวเอง/ });

    // 1. รอให้ UI มาถึง step นี้ก่อน
    await expect(page.getByText('ข้อมูลเจ้าของรถ (ผู้เอาประกัน)')).toBeVisible({ timeout: 15000 });

    // 2. กัน popup (สำคัญมาก)
    const popup = page.locator('#close-auth-section-sheet-icon-id');
    if (await popup.isVisible().catch(() => false)) {
        await popup.click();
    }

    // 3. รอให้ tab usable จริง
    await expect(tab).toBeVisible({ timeout: 15000 });
    await expect(tab).toBeEnabled();

    // 4. click
    await tab.click();

    // 5. assert state
    await expect(tab).toHaveAttribute('aria-selected', 'true');

    // 6. รอ field ถัดไป
    await expect(
        page.locator('#insured-id-card-input-id')
    ).toBeVisible({ timeout: 10000 });
}

export async function selectBuyForOthers(page) {
    const tab = page.getByRole('tab', { name: /ซื้อให้คนอื่น/ });

    // 1. รอให้ UI มาถึง step นี้ก่อน
    await expect(page.getByText('ข้อมูลเจ้าของรถ (ผู้เอาประกัน)')).toBeVisible({ timeout: 15000 });

    // 2. กัน popup
    const popup = page.locator('#close-auth-section-sheet-icon-id');
    if (await popup.isVisible().catch(() => false)) {
        await popup.click();
    }

    // 3. รอ tab usable
    await expect(tab).toBeVisible({ timeout: 15000 });
    await expect(tab).toBeEnabled();

    // 4. click
    await tab.click();

    // 5. assert state
    await expect(tab).toHaveAttribute('aria-selected', 'true');

    // 6. รอ tab panel แสดงจริง
    const panel = page.locator('[role="tabpanel"]:visible');
    await expect(panel).toBeVisible();
}

/** ปุ่มถัดไป / ต่อไป */
export function nextButton(page) {
    return page.getByRole('button', { name: /ถัดไป|ต่อไป/ });
}

/** เลือกสีรถแบบ optional — บาง flow ไม่มีช่องสี (เช่น EV/ST) ให้ข้ามเฉยๆ */
export async function maybeSelectCarColor(page, timeout = 2000) {
    const colorField = page.locator('#car-color-id');
    if (await colorField.isVisible({ timeout }).catch(() => false)) {
        await randomSelectColor(page, 'car-color-id');
    }
}

/**
 * เลือก "จังหวัดจดทะเบียน" ในส่วนข้อมูลรถ — ST flow ต้องระบุเอง
 * (LT flow มักจะ auto-fill จาก brand แล้ว disabled — helper จะข้ามถ้า disabled/ไม่มี)
 */
export async function maybeFillRegisteredProvince(page, timeout = 1500) {
    const combo = page.getByRole('combobox', { name: 'จังหวัดจดทะเบียน' });
    if (!(await combo.isVisible({ timeout }).catch(() => false))) return;
    if (!(await combo.isEnabled().catch(() => false))) return;

    await combo.click();
    const option = page.locator('[role="listbox"]').last().locator('[role="option"]').first();
    await expect(option).toBeVisible();
    await option.click();
    await page.waitForTimeout(500);
}

/**
 * กรอกข้อมูลบริษัท (juristic) — ใช้แทนข้อมูลส่วนตัว เมื่อซื้อในนามบริษัท
 * @param {{juristicId, companyName, branch}} data
 */
export async function fillJuristicCompanyInfo(page, data) {
    // Defensive: ปิด popup signup ที่อาจโผล่ช้า ก่อนเริ่มกรอก
    await closeEmailPopup(page, 1500);

    // 1. เลขที่นิติบุคคล (filter ด้วย name="juristicId" เพราะ id ซ้ำกับ field อื่น)
    await humanFillText(
        page.locator('input[name="juristicId"]'),
        data.juristicId,
        { delay: 30, normalize: v => v.replace(/\D/g, '') }
    );
    await page.waitForTimeout(500);

    // 2. คำนำหน้าบริษัท (random)
    const titleTrigger = page.locator('#insured-title-company-name-select-id');
    await expect(titleTrigger).toBeVisible({ timeout: 10000 });
    await titleTrigger.click();
    await expect(titleTrigger).toHaveAttribute('data-state', 'open');
    const titleListbox = page.locator('[role="listbox"]').last();
    await expect(titleListbox).toBeVisible();
    const titleOptions = titleListbox.locator('[role="option"]');
    const titleCount = await titleOptions.count();
    expect(titleCount).toBeGreaterThan(0);
    await titleOptions.nth(Math.floor(Math.random() * titleCount)).click();
    await page.waitForTimeout(500);

    // 3. ชื่อบริษัท (filter ด้วย name="companyName")
    await humanFillText(
        page.locator('input[name="companyName"]'),
        data.companyName,
        { delay: 40 }
    );
    await page.waitForTimeout(500);

    // 4. สาขา
    await humanFillText(
        page.locator('#company-branch-input-id'),
        data.branch || '00',
        { delay: 40 }
    );
    await page.waitForTimeout(500);

    // 5. วันที่จดทะเบียนบริษัท — เปิด picker, เลือกวันใดก็ได้, ยืนยัน
    await page.locator('#companyRegistrationDate-input').click();

    const ltDay = page.locator('[data-day*="/28/"]:not([disabled])').first();
    if (await ltDay.isVisible({ timeout: 1500 }).catch(() => false)) {
        await ltDay.click();
    } else {
        await page.locator('[role="dialog"] button:not([disabled])')
            .filter({ hasText: /^\d+$/ })
            .first()
            .click();
    }
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    await page.waitForTimeout(1000);
}

/**
 * กรอกข้อมูลผู้เซ็นรับรอง (signatory) ของ juristic flow
 * — ส่วนนี้อยู่หลัง company info ใช้ id ซ้ำกับ company แต่มี name attribute ต่าง
 * @param {{idCard, firstName, lastName}} data
 */
export async function fillJuristicSignatory(page, data) {
    // Defensive: ปิด popup signup ที่อาจโผล่ระหว่างกรอก
    await closeEmailPopup(page, 1500);

    // 1. เลขบัตรประชาชน (filter ด้วย name="idCard")
    // — field มี auto-format ใส่ขีด (1-2345-67890-12-3) ใช้ normalize ลบขีดออกก่อนเทียบ
    await humanFillText(
        page.locator('input[name="idCard"]'),
        data.idCard,
        { delay: 30, normalize: v => v.replace(/\D/g, '') }
    );
    await page.waitForTimeout(500);

    // 2. คำนำหน้าชื่อ (ใช้ accessible name แทน id เพราะ juristic ใช้ id ต่าง)
    const titleTrigger = page.getByRole('combobox', { name: 'คำนำหน้าชื่อ' });
    await expect(titleTrigger).toBeVisible({ timeout: 10000 });
    await titleTrigger.click();
    const titleListbox = page.locator('[role="listbox"]').last();
    await expect(titleListbox).toBeVisible();
    const titleOptions = titleListbox.locator('[role="option"]');
    const titleCount = await titleOptions.count();
    expect(titleCount).toBeGreaterThan(0);
    await titleOptions.nth(Math.floor(Math.random() * titleCount)).click();
    await page.waitForTimeout(500);

    // 3. ชื่อ — ใช้ .last() เพราะ id ซ้ำกับ company name
    await humanFillText(
        page.locator('#insured-name-input-id').last(),
        data.firstName,
        { delay: 40 }
    );
    await page.waitForTimeout(500);

    // 4. นามสกุล (ไม่มี duplicate)
    await humanFillText(
        page.locator('#insured-last-name-input-id'),
        data.lastName,
        { delay: 40 }
    );
    await page.waitForTimeout(500);

    // 5. วันเกิด
    await pickDateOfBirth(page);
}

/**
 * เปิด DOB picker, เลือกวันที่ใดก็ได้ที่ enabled (รองรับทั้ง LT/ST calendar), แล้วกดยืนยัน
 * - LT: ใช้ `data-day` attribute
 * - ST: ใช้ button[aria-label] (ไม่มี data-day)
 */
export async function pickDateOfBirth(page) {
    await page.locator('#dateOfBirth-input').click();

    const ltDay = page.locator('[data-day*="/28/"]:not([disabled])').first();
    const found = await ltDay.isVisible({ timeout: 1500 }).catch(() => false);
    if (found) {
        await ltDay.click();
    } else {
        // ST calendar: pick first enabled day-number button in date dialog
        await page.locator('[role="dialog"] button:not([disabled])')
            .filter({ hasText: /^\d+$/ })
            .first()
            .click();
    }

    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    await page.waitForTimeout(1000);
}

/** ปิด popup login (ถ้ามี) — ปรากฏหลัง submit quote บางครั้ง */
export async function closeLoginPopup(page, timeout = 3000) {
    const closeBtn = page.locator('button[data-slot="dialog-close"]');
    await closeBtn.waitFor({ state: 'visible', timeout })
        .then(() => closeBtn.click())
        .catch(() => { });
    await page.waitForTimeout(500);
}

/** ปิด popup email signup (ถ้ามี) — ปรากฏหลังคลิก checkout */
export async function closeEmailPopup(page, timeout = 3000) {
    // 1. ลอง icon X — รองรับทั้ง #id และ data-slot (เป็น element เดียวกันแต่ selector ต่าง)
    const closeBtn = page.locator(
        '#close-auth-section-sheet-icon-id, button[data-slot="dialog-close"]'
    ).first();
    if (await closeBtn.isVisible({ timeout }).catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => { });
        await page.waitForTimeout(500);
        return;
    }

    // 2. fallback: ปุ่ม "ไปซื้อต่อแบบไม่รับส่วนลด" (popup signup แบบใหม่ — เจอใน juristic flow)
    const skipBtn = page.getByRole('button', { name: 'ไปซื้อต่อแบบไม่รับส่วนลด' });
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await skipBtn.click({ force: true }).catch(() => { });
        await page.waitForTimeout(500);
        return;
    }
}

/** กรอก input + blur */
export async function fillAndBlur(input, value, delay = 80) {
    const text = String(await value);

    await input.waitFor({ state: 'visible' });
    await input.click({ force: true });

    await input.fill('');

    if (text) {
        await input.pressSequentially(text, { delay });
    }

    // รอให้ input settle (สำคัญมาก)
    await input.evaluate(el => el.blur());
}

/** expect field invalid */
export async function expectInvalid(input) {
    await expect(input).toHaveAttribute('aria-invalid', 'true');
}
/** expect field valid */
export async function expectValid(input) {
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
}
/** expect error text visible */
export async function expectError(page, text) {
    await expect(page.getByText(text)).toBeVisible();
}
/** expect error text not exist */
export async function expectNoError(page, text) {
    await expect(page.getByText(text)).toHaveCount(0);
}
/** loop test invalid values */
export async function testInvalidValues(
    page,
    input,
    values,
    errorText
) {
    const next = nextButton(page);

    for (const value of values) {
        await fillAndBlur(input, value);
        await next.click();

        await expectInvalid(input);
        await expectError(page, errorText);

        await input.fill('');
        await expect(input).toHaveValue('');
    }
}

/** loop test valid values */
export async function testValidValues(
    page,
    input,
    values,
    errorText
) {
    const next = nextButton(page);

    for (const value of values) {

        await fillAndBlur(input, value);
        await next.evaluate(el => el.click());
        await expectValid(input);

        if (errorText) {
            await expectNoError(page, errorText);
        }
    }
}

export async function selectRandomTitleName(page) {
    const trigger = page.locator('#title-name-select-id');

    await expect(trigger).toBeVisible({ timeout: 10000 });
    await trigger.click();
    await expect(trigger).toHaveAttribute('data-state', 'open');

    const listbox = page.locator('[role="listbox"]').last();
    await expect(listbox).toBeVisible();

    const options = listbox.locator('[role="option"]');

    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    const randomIndex = Math.floor(Math.random() * count);
    await options.nth(randomIndex).click();
}


export async function fillThaiIdCard(input, value) {
    if (typeof value !== 'string') {
        throw new Error(
            `fillThaiIdCard expects string, got ${typeof value}`
        );
    }

    await input.click({ force: true });
    await input.fill('', { force: true });
    await input.fill(value, { force: true });
    await input.evaluate(el => el.blur());
}

export function generateRandomThaiName(prefix = 'ทดสอบ') {
    const thaiNumbers = ['หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];

    const randomWord =
        thaiNumbers[Math.floor(Math.random() * thaiNumbers.length)];

    return `${prefix}${randomWord}`;
}

/** Random last name */
export function generateRandomThaiLastName(prefix = 'เฮกู้ดดี้') {
    const thaiNumbers = ['หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];

    const randomWord =
        thaiNumbers[Math.floor(Math.random() * thaiNumbers.length)];

    return `${prefix}${randomWord}`;
}

/** สุ่มเลขบัตรประชาชนไทย 13 หลัก พร้อม checksum ที่ถูกต้อง */
export function generateThaiIDCard() {
    const digits = [];
    for (let i = 0; i < 12; i++) {
        digits.push(Math.floor(Math.random() * 10));
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += digits[i] * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;

    return digits.join('') + checkDigit;
}

const _usedIDs = new Set();

/** สุ่มเลขบัตรประชาชนแบบไม่ซ้ำในรอบ run เดียวกัน */
export function generateUniqueThaiIDCard() {
    let id;
    do {
        id = generateThaiIDCard();
    } while (_usedIDs.has(id));

    _usedIDs.add(id);
    return id;
}

const _usedLicenses = new Set();

/** สุ่มเลขใบขับขี่ 13 หลัก แบบไม่ซ้ำในรอบ run เดียวกัน */
export function generateUniqueLicense() {
    let lic;
    do {
        lic = String(Math.floor(Math.random() * 1e13)).padStart(13, '0');
    } while (_usedLicenses.has(lic));

    _usedLicenses.add(lic);
    return lic;
}

const _usedJuristicIds = new Set();

/** สุ่มเลขนิติบุคคล 13 หลัก พร้อม checksum (ใช้สูตรเดียวกับเลขบัตร ปชช ไทย) */
export function generateUniqueJuristicId() {
    let id;
    do {
        const digits = [];
        for (let i = 0; i < 12; i++) {
            digits.push(Math.floor(Math.random() * 10));
        }
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += digits[i] * (13 - i);
        }
        const checkDigit = (11 - (sum % 11)) % 10;
        id = digits.join('') + checkDigit;
    } while (_usedJuristicIds.has(id));

    _usedJuristicIds.add(id);
    return id;
}

const _usedPassports = new Set();

/** สุ่มเลข passport (2 ตัวอักษร + 7 ตัวเลข) แบบไม่ซ้ำในรอบ run เดียวกัน */
export function generateUniquePassport() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let p;
    do {
        const l1 = letters[Math.floor(Math.random() * 26)];
        const l2 = letters[Math.floor(Math.random() * 26)];
        const digits = String(Math.floor(Math.random() * 1e7)).padStart(7, '0');
        p = `${l1}${l2}${digits}`;
    } while (_usedPassports.has(p));

    _usedPassports.add(p);
    return p;
}

/** สุ่มเลขตัวถังรถ format: AUTOHEY + YYYYMMDD (วันนี้) + 2 หลักสุ่ม */
export function generateChassisNumber() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const ss = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return `AUTOHEY${yyyy}${mm}${dd}${ss}`;
}

/** สุ่มเลขเครื่องยนต์ (EV) format: EVENG + YYYYMMDD (วันนี้) + 2 หลักสุ่ม */
export function generateEngineNumber() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const ss = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return `EVENG${yyyy}${mm}${dd}${ss}`;
}

export async function humanFill(input, value, delay = 50) {

    await input.waitFor({ state: 'visible' });
    await input.click({ force: true });
    await input.fill('', { force: true });

    for (const char of value) {
        await input.page().keyboard.insertText(char);
        await input.page().waitForTimeout(delay);
    }

    await input.evaluate(el => el.blur());
    await expect(input).toHaveValue(value, { timeout: 5000 });
}

export async function humanFillText(
    input,
    value,
    {
        delay = 0,         
        blur = true,
        normalize,        
        assert = true,
    } = {}
) {
    const page = input.page();
    const text = String(value);

    await input.waitFor({ state: 'visible' });
    await input.scrollIntoViewIfNeeded();
    await input.click({ force: true });

    // clear ด้วย fill('') ก่อน — เชื่อถือได้กว่า Control+A สำหรับ React-controlled input
    // (บาง dialog ที่ reuse component จะ pre-populate จาก state เก่า)
    await input.fill('');
    // re-focus เพราะ fill('') บางครั้งทำให้ focus หลุด → typing พิมพ์ไม่ลงช่อง
    await input.focus();
    await input.press('Control+A');
    await input.press('Backspace');
    await input.pressSequentially(text, { delay });

    if (blur) {
        await input.evaluate(el => el.blur());
    }

    // guard กันหลุด
    if (assert) {
        if (normalize) {
            await expect.poll(async () => {
                const v = await input.inputValue();
                return normalize(v);
            }).toBe(normalize(text));
        } else {
            await expect(input).toHaveValue(text);
        }
    }
}

export async function setDateOfBirth(page, thaiDateText) {
    const dobInput = page.locator('#dateOfBirth-input');

    await dobInput.waitFor({ state: 'visible' });

    // คลิกเพื่อเปิด date picker
    await dobInput.click({ force: true });

    /**
     * กรณี heygoody:
     * FE จะ set value เองจาก date picker
     * เราจำเป็นต้อง inject ค่าเข้าไป
     */
    await dobInput.evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.blur();
    }, thaiDateText);

    await expect(dobInput).toHaveValue(thaiDateText);
}

export async function openAccordion(page, triggerId) {
    const trigger = page.locator(`#${triggerId}`);

    await trigger.waitFor({ state: 'visible' });

    const expanded = await trigger.getAttribute('aria-expanded');

    if (expanded !== 'true') {
        await trigger.evaluate(el => el.click());
    }
}

export async function selectRadioByLabel(page, forId) {
    const label = page.locator(`label[for="${forId}"]`);

    await label.waitFor({ state: 'visible' });
    await label.scrollIntoViewIfNeeded();

    await label.evaluate(el => el.click());

    await expect(
        page.locator(`#${forId}`)
    ).toHaveAttribute('aria-checked', 'true');
}

export async function openAccordionByText(page, titleText) {
    const trigger = page.locator(
        'button[data-slot="accordion-trigger"]',
        { hasText: titleText }
    );

    await trigger.waitFor({ state: 'visible' });

    const expanded = await trigger.getAttribute('aria-expanded');
    if (expanded !== 'true') {
        await trigger.evaluate(el => el.click());
    }
}

export async function selectAddressOption(page, triggerId) {

    const trigger = page.locator(`#${triggerId}`);
    await expect(trigger).toBeVisible({ timeout: 15000 });
    await expect(trigger).toBeEnabled({ timeout: 15000 });
    await trigger.click();

    const listbox = page.locator('[role="listbox"]').last();
    await expect(listbox).toBeVisible();

    const option = listbox.locator('[role="option"]').first();
    await option.click();
}

/** ภายใน: กรอก dialog ผู้ขับขี่ที่เปิดอยู่ (ใช้กับทั้ง driver แรกและที่เพิ่มเติม) */
async function _fillDriverDialog(page, driverData, { foreign = false } = {}) {
    // Scope ทุก field ให้อยู่ใน dialog ที่เปิดล่าสุด — ป้องกัน locator ไปจับ field ของ driver ก่อนๆ
    const dialog = page.getByRole('dialog', { name: /ข้อมูลผู้ขับขี่/ }).last();

    if (foreign) {
        const foreignTab = dialog.getByRole('tab', { name: 'ต่างชาติ' });
        await foreignTab.click();
        await expect(foreignTab).toHaveAttribute('aria-selected', 'true');

        await humanFillText(
            dialog.locator('#driver-passport-no-input-id'),
            driverData.passport
        );
    } else {
        await humanFillText(
            dialog.locator('#driver-id-card-input-id'),
            driverData.idCard,
            { delay: 30, normalize: v => v.replace(/\D/g, '') }
        );
    }

    await humanFillText(dialog.locator('#driver-driving-license-input-id'), driverData.license);
    await randomSelectTitleNameDriver1(page);
    await humanFillText(dialog.locator('#driver-name-input-id'), driverData.name);
    await humanFillText(dialog.locator('#driver-last-name-input-id'), driverData.lastName);

    // เปิด date picker แล้วกดยืนยัน (ใช้ default date)
    const dobInput = dialog.locator('#dateOfBirth-input');
    await expect(dobInput).toBeVisible();
    await dobInput.click();

    const datePickerDialog = page.getByRole('dialog').filter({
        has: page.locator('#confirm-dateOfBirth-button-id'),
    });
    const confirmDobBtn = datePickerDialog.locator('#confirm-dateOfBirth-button-id');
    await expect(confirmDobBtn).toBeVisible();
    await confirmDobBtn.click();

    await humanFillText(dialog.locator('#driver-email-input-id'), driverData.email);
    await humanFillText(
        dialog.locator('#driver-phone-number-input-id'),
        driverData.phone,
        { normalize: v => v.replace(/\D/g, '') }
    );

    const saveBtn = dialog.locator('#driver-dialog-save-button-id');
    await saveBtn.waitFor({ state: 'visible' });
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
}

/**
 * กรอก driver แบบ manual คนแรก — เปิด accordion → เลือก "ระบุเอง" → กรอกข้อมูล → บันทึก
 * @param {import('@playwright/test').Page} page
 * @param {object} driverData - {idCard|passport, license, name, lastName, email, phone}
 * @param {{foreign?: boolean}} options - ส่ง { foreign: true } เพื่อกรอกแท็บ "ต่างชาติ"
 */
export async function fillDriverInfoManual(page, driverData, options = {}) {
    await openAccordion(page, 'driver-info-accordion-trigger-id');
    await selectRadioByLabel(page, 'driver1-manual-radio-id');
    await _fillDriverDialog(page, driverData, options);
}

/**
 * เพิ่มผู้ขับขี่คนถัดไป (driver 2-5) — กดปุ่ม "เพิ่มผู้ขับขี่" → กรอกข้อมูล → บันทึก
 * @param {import('@playwright/test').Page} page
 * @param {object} driverData - {idCard|passport, license, name, lastName, email, phone}
 * @param {{foreign?: boolean}} options - ส่ง { foreign: true } เพื่อกรอกแท็บ "ต่างชาติ"
 */
export async function addAdditionalDriver(page, driverData, options = {}) {
    const addBtn = page.locator('#add-driver-button-id');
    await expect(addBtn).toBeEnabled();
    await addBtn.click();
    await _fillDriverDialog(page, driverData, options);
}

/**
 * กรอกข้อมูล "ที่อยู่ตามบัตรประชาชน" ครบทุกช่อง + เลือก district/sub-district + กดบันทึก
 * @param {import('@playwright/test').Page} page
 * @param {{houseNo, village, moo, alley, street, zipcode}} addressData - ข้อมูลที่อยู่ (จาก test-data)
 * @param {string} openButtonId - ID ของปุ่มเปิด form (ต่างกันใน flow bymyself กับ for-others)
 */
export async function fillAddressInfo(page, addressData, openButtonId = 'address-information-header-id') {
    await openAccordionByText(page, 'ที่อยู่ตามบัตรประชาชน');
    await page.locator(`#${openButtonId}`).click();

    await humanFillText(page.locator('#house-no-input-id'), addressData.houseNo);
    await humanFillText(page.locator('#village-building-input-id'), addressData.village);
    await humanFillText(page.locator('#moo-input-id'), addressData.moo);
    await humanFillText(page.locator('#alley-input-id'), addressData.alley);
    await humanFillText(page.locator('#street-input-id'), addressData.street);
    await humanFillText(page.locator('#zipcode-input-id'), addressData.zipcode);

    await selectAddressOption(page, 'district-select-id');
    await page.waitForTimeout(500);
    await selectAddressOption(page, 'sub-district-select-id');
    await page.waitForTimeout(500);
    await page.locator('#delivery-address-dialog-save-button-id').click();
    await page.waitForTimeout(500);
}

export async function randomSelectColor(page, selectId, index = 0) {
    const trigger = page.locator(`#${selectId}`);

    await expect(trigger).toBeVisible();
    await trigger.click();

    const options = page.locator('[role="option"]');
    await expect(options.nth(index)).toBeVisible();

    const text = (await options.nth(index).innerText()).trim();
    await options.nth(index).click();

    return text;
}

export async function randomSelectTitleNameDriver1(page) {
    const trigger = page.locator('#title-name-select-id').nth(1);

    await expect(trigger).toBeVisible({ timeout: 15000 });

    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();

    const count = await options.count();
    const randomIndex = Math.floor(Math.random() * count);

    await options.nth(randomIndex).click();
}




