import { test, expect } from '@playwright/test';


test.describe('Validate form Address on Order Info page', () => {
    const url =
        'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/order-info';

    test.beforeEach(async ({ page }) => {
        await page.goto(url);
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const addressAccordionTrigger = page.locator('#radix-_r_7_');
        const addressAccordionContent = page.locator('#radix-_r_8_');

        await addressAccordionTrigger.scrollIntoViewIfNeeded();

        // เปิดเฉพาะกรณียังไม่เปิด
        if (await addressAccordionTrigger.getAttribute('aria-expanded') !== 'true') {
            await addressAccordionTrigger.click();
        }

        // assert ว่าเปิดแล้วจริง
        await expect(addressAccordionTrigger).toHaveAttribute('aria-expanded', 'true');
        await expect(addressAccordionTrigger).toHaveAttribute('data-state', 'open');
        await expect(addressAccordionContent).toBeVisible();



        await page.waitForTimeout(1000);

    });

    test('house no: should show required error when empty', async ({ page }) => {
        const houseNoInput = page.locator('#house-no-input-id');
        const nextButton = page.locator('#next-button-id');
        await houseNoInput.scrollIntoViewIfNeeded();
        await houseNoInput.focus();

        // ไม่กรอกอะไร
        await nextButton.click();

        await expect(houseNoInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกบ้านเลขที่')
        ).toBeVisible();
        await expect(
            page.getByText('กรุณากรอกรหัสไปรษณีย์')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('house no: should accept valid value', async ({ page }) => {
        const houseNoInput = page.locator('#house-no-input-id');
        await houseNoInput.scrollIntoViewIfNeeded();
        await houseNoInput.focus();

        await houseNoInput.pressSequentially('123/4', { delay: 40 });
        await houseNoInput.blur();

        // ไม่ควร error
        await expect(houseNoInput).toHaveAttribute('aria-invalid', 'false');

        // error message ต้องไม่แสดง
        await expect(
            page.getByText('กรุณากรอกบ้านเลขที่')
        ).not.toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('village/building: should allow valid characters', async ({ page }) => {
        const input = page.locator('#village-building-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        const validValues = [
            'เดอะวิลล์',
            'The Ville',
            'อาคาร A-1',
            'Village/Building 3',
            'หมู่บ้าน 12/3'
        ];

        for (const value of validValues) {
            await input.fill('');
            await input.pressSequentially(value, { delay: 40 });
            await input.blur();

            await expect(input).toHaveAttribute('aria-invalid', 'false');
            await page.waitForTimeout(1000);
        }
    });

    test('village/building: should not allow special characters', async ({ page }) => {
        const input = page.locator('#village-building-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        await input.pressSequentially('เดอะวิลล์@#!', { delay: 40 });
        await input.blur();

        await expect(input).toHaveValue('เดอะวิลล์');
        await page.waitForTimeout(1000);
    });

    test('moo: should allow numeric input', async ({ page }) => {
        const input = page.locator('#moo-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        await input.pressSequentially('5', { delay: 40 });
        await input.blur();

        await expect(input).toHaveValue('5');
        await expect(input).toHaveAttribute('aria-invalid', 'false');
        await page.waitForTimeout(1000);
    });

    test('moo: should not allow non-numeric characters', async ({ page }) => {
        const input = page.locator('#moo-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        await input.pressSequentially('5abc@#', { delay: 40 });
        await input.blur();

        await expect(input).toHaveValue('5');
        await page.waitForTimeout(1000);
    });

    test('moo: should not allow more than 10 digits', async ({ page }) => {
        const input = page.locator('#moo-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        await input.pressSequentially('1234567890123', { delay: 40 });

        await expect(input).toHaveValue('1234567890');
        await page.waitForTimeout(1000);
    });

    test('alley: should allow valid characters', async ({ page }) => {
        const input = page.locator('#alley-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        await input.pressSequentially('สุขุมวิท 22', { delay: 40 });
        await input.blur();

        await expect(input).toHaveValue('สุขุมวิท 22');
        await expect(input).toHaveAttribute('aria-invalid', 'false');
        await page.waitForTimeout(1000);
    });

    test('alley: should not allow special characters', async ({ page }) => {
        const input = page.locator('#alley-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        await input.pressSequentially('สุขุมวิท@22#!', { delay: 40 });
        await input.blur();

        await expect(input).toHaveValue('สุขุมวิท22');
        await page.waitForTimeout(1000);
    });

    test('alley: should not allow more than 100 characters', async ({ page }) => {
        const input = page.locator('#alley-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        const longText = 'ซอย'.repeat(60); // ยาวเกิน 100
        await input.pressSequentially(longText, { delay: 40 });

        const value = await input.inputValue();
        expect(value.length).toBeLessThanOrEqual(100);
        await page.waitForTimeout(1000);
    });

    test('street: should allow valid characters', async ({ page }) => {
        const input = page.locator('#street-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        await input.pressSequentially('พระราม 4', { delay: 40 });
        await input.blur();

        await expect(input).toHaveValue('พระราม 4');
        await expect(input).toHaveAttribute('aria-invalid', 'false');
        await page.waitForTimeout(1000);
    });

    test('street: should not allow special characters', async ({ page }) => {
        const input = page.locator('#street-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();


        await input.pressSequentially('พระราม@4/#!', { delay: 40 });
        await input.blur();

        // เหลือเฉพาะตัวที่อนุญาต
        await expect(input).toHaveValue('พระราม4');
        await page.waitForTimeout(1000);
    });

    test('street: should not allow more than 100 characters', async ({ page }) => {
        const input = page.locator('#street-input-id');
        await input.scrollIntoViewIfNeeded();
        await input.focus();

        const longText = 'ถนน'.repeat(60); // > 100 chars
        await input.pressSequentially(longText, { delay: 40 });

        const value = await input.inputValue();
        expect(value.length).toBeLessThanOrEqual(100);
        await page.waitForTimeout(1000);
    });

    test('zipcode: should show format error when less than 5 digits', async ({ page }) => {
        const zipcodeInput = page.locator('#zipcode-input-id');
        await zipcodeInput.scrollIntoViewIfNeeded();
        await zipcodeInput.focus();

        await zipcodeInput.pressSequentially('1011', { delay: 40 });
        await zipcodeInput.blur();

        await expect(zipcodeInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกรหัสไปรษณีย์ให้ถูกต้อง')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('zipcode: should allow only numbers', async ({ page }) => {
        const zipcodeInput = page.locator('#zipcode-input-id');
        await zipcodeInput.scrollIntoViewIfNeeded();
        await zipcodeInput.focus();

        await zipcodeInput.pressSequentially('10a-1/', { delay: 40 });
        await zipcodeInput.blur();

        // เหลือเฉพาะตัวเลข
        await expect(zipcodeInput).toHaveValue('101');
        await page.waitForTimeout(1000);
    });

    test('zipcode: should accept valid zipcode', async ({ page }) => {
        const zipcodeInput = page.locator('#zipcode-input-id');
        await zipcodeInput.scrollIntoViewIfNeeded();
        await zipcodeInput.focus();

        await zipcodeInput.pressSequentially('10110', { delay: 40 });
        await zipcodeInput.blur();

        await expect(zipcodeInput).toHaveValue('10110');
        await expect(zipcodeInput).toHaveAttribute('aria-invalid', 'false');
        await page.waitForTimeout(1000);
    });

    test('zipcode: should auto select province district subdistrict', async ({ page }) => {
        await page.locator('#zipcode-input-id').fill('10110');
        await page.locator('#zipcode-input-id').blur();

        await expect(page.locator('#province-select-id')).not.toBeDisabled();
        await expect(page.locator('#district-select-id')).not.toBeDisabled();
        await expect(page.locator('#sub-district-select-id')).not.toBeDisabled();
    });





















});