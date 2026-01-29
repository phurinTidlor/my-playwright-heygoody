import { expect } from '@playwright/test';

/** เลือกซื้อให้ตัวเอง (ใช้แทบทุก test) */
export async function selectBuyForMyself(page) {
    // const radio = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
    // await radio.click();
    const buyForMyselfTab = page.getByRole('tab', { name: 'ซื้อให้ตัวเอง' });

    await buyForMyselfTab.click();
    await expect(buyForMyselfTab).toHaveAttribute('aria-selected', 'true');
    //await expect(radio).toHaveAttribute('aria-checked', 'true');
    await page.locator('#insured-id-card-input-id').waitFor({
        state: 'visible'
    });
}

export async function selectBuyForOthers(page) {
    const radio = page.getByRole('radio', { name: 'ซื้อให้คนอื่น' });
    await radio.click();
    await expect(radio).toHaveAttribute('aria-checked', 'true');
    await page.locator('#insured-id-card-input-id').waitFor({
        state: 'visible'
    });
}

/** ปุ่มถัดไป / ต่อไป */
export function nextButton(page) {
    return page.getByRole('button', { name: /ถัดไป|ต่อไป/ });
}

/** กรอก input + blur */
export async function fillAndBlur(input, value, delay = 40) {
    await input.fill('');
    if (value) {
        await input.pressSequentially(value, { delay });
    }
    await input.blur();
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

        // ❌ อย่าใช้ next.click()
        // ✅ ใช้ JS click แทน
        await next.evaluate(el => el.click());

        await expectValid(input);

        if (errorText) {
            await expectNoError(page, errorText);
        }
    }
}


/** loop test select คำนำหน้า */
export async function selectRandomTitleName(page) {
    const trigger = page.locator('#insured-title-name-select-id');

    // เปิด dropdown
    await trigger.click();

    // Radix option จะเป็น role="option"
    const options = page.getByRole('option');

    // รอให้ option โผล่จริง
    await expect(options.first()).toBeVisible();

    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // สุ่ม index
    const randomIndex = Math.floor(Math.random() * count);
    const randomOption = options.nth(randomIndex);

    // คลิก option
    await randomOption.click();
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

export async function humanFill(input, value, delay = 50) {
    await input.waitFor({ state: 'visible' });

    // focus แบบ force
    await input.click({ force: true });

    // clear ก่อน
    await input.fill('', { force: true });

    // พิมพ์ทีละตัว (ปลอดภัยกว่า type)
    for (const char of value) {
        await input.page().keyboard.insertText(char);
        await input.page().waitForTimeout(delay);
    }

    // blur เพื่อ trigger validation
    await input.evaluate(el => el.blur());

    // assert กันหลุด
    await expect(input).toHaveValue(value, { timeout: 5000 });
}

export async function humanFillText(
    input,
    value,
    {
        delay = 0,          // ใช้ delay เดียวพอ
        blur = true,
        normalize,          // สำหรับ masked input
        assert = true,
    } = {}
) {
    const page = input.page();
    const text = String(value);

    // ensure input พร้อม
    await input.waitFor({ state: 'visible' });
    await input.scrollIntoViewIfNeeded();
    await input.click({ force: true });

    // clear แบบ user
    await input.press('Control+A');
    await input.press('Backspace');

    // พิมพ์ทีเดียว (เร็ว + เสถียร)
    await input.type(text, { delay });

    // blur เพื่อ trigger validation / mask
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
     * ⚠️ กรณี heygoody:
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
        // ใช้ JS click กัน scroll / animation พัง
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
    await trigger.click({ force: true });

    const option = page.locator('[role="option"]').first();
    await expect(option).toBeVisible();
    await option.click();
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
    // 1. เปิด select (ตัวปุ่ม combobox)
    const trigger = page.locator('#driver-title-name-select-id');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    // 2. รอ listbox ของ Radix โผล่
    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible' });

    // 3. สุ่ม index
    const count = await options.count();
    const index = Math.floor(Math.random() * count);

    // 4. คลิก option
    const chosen = options.nth(index);
    const text = await chosen.innerText();

    await chosen.click();

    // 5. assert ว่าเลือกแล้วจริง
    await expect(trigger).toContainText(text);

    return text; // เผื่อเอาไป log / assert ต่อ
}




