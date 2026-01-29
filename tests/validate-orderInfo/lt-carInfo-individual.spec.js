import { test, expect } from '@playwright/test';


test.describe('Validate form Car Info on Order Info page', () => {
    const url =
        'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/order-info';

    test.beforeEach(async ({ page }) => {
        await page.goto(url);
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const carAccordion = page.locator(
            'button:has-text("ข้อมูลรถ")'
        );

        await carAccordion.scrollIntoViewIfNeeded();
        await carAccordion.click();

        await page.waitForTimeout(1000);

    });

    test('should show required error when empty', async ({ page }) => {
        const licenseInput = page.locator('#license-plate-id');

        await licenseInput.scrollIntoViewIfNeeded();
        await licenseInput.click();
        await licenseInput.blur();

        // กดปุ่มถัดไป / submit
        await page.getByRole('button', { name: /ถัดไป|ยืนยัน|ดำเนินการต่อ/i }).click();

        const expectedErrors = [
            'กรุณากรอกทะเบียนรถ',
            'กรุณาเลือกจังหวัดจดทะเบียน',
            'กรุณากรอกเลขตัวถัง',
            'กรุณากรอกเลขเครื่องยนต์',
            'กรุณาเลือกสีรถ',
            'กรุณาเลือกวันที่เริ่มคุ้มครอง',
            //'กรุณาระบุวันที่ต้องการให้เริ่มคุ้มครอง'
        ];

        for (const message of expectedErrors) {
            await expect(page.getByText(message)).toBeVisible();
        }
        await expect(licenseInput).toHaveAttribute('aria-invalid', 'true');

        await page.waitForTimeout(1000);

    });

    test('license plate: invalid format', async ({ page }) => {
        const licenseInput = page.locator('#license-plate-id');
        await licenseInput.scrollIntoViewIfNeeded();
        await licenseInput.focus();

        const invalidValues = [
            '1234',
            'กก',
            // 'ก1ก123',
            // '1กก12345',
            //'12345678901ก1',
            '5ใบหยก',
            'เศรษฐี12345',
            //'ใบ5หยก021',

        ];

        for (const value of invalidValues) {
            await licenseInput.fill('');
            await licenseInput.pressSequentially(value, { delay: 40 });

            await expect(licenseInput).toHaveAttribute('aria-invalid', 'true');
            await expect(
                page.getByText('กรุณากรอกทะเบียนรถให้ถูกต้อง')
            ).toBeVisible();
            await page.waitForTimeout(1000);
        }
    });

    test('license plate: valid format', async ({ page }) => {
        const licenseInput = page.locator('#license-plate-id');
        await licenseInput.scrollIntoViewIfNeeded();
        await licenseInput.focus();

        const validValues = [
            'กก1',
            '1กก1',
            '12กข123',
            '1กก1234',
            'เศรษฐี123',
            '5ใบหยก021',
            'ใบหยก1',
            '9เศรษฐี1',
        ];

        for (const value of validValues) {
            await licenseInput.fill('');
            await licenseInput.pressSequentially(value, { delay: 40 });

            await expect(licenseInput).toHaveAttribute('aria-invalid', 'false');
            await page.waitForTimeout(1000);
        }
    });

    test('license plate: valid format with 14 characters', async ({ page }) => {
        const licenseInput = page.locator('#license-plate-id');
        await licenseInput.scrollIntoViewIfNeeded();
        await licenseInput.focus();

        const maxLengthValue = '123456789ก1234'; // 14 ตัวอักษร

        await licenseInput.pressSequentially(maxLengthValue, { delay: 40 });
        await licenseInput.blur();

        await expect(licenseInput).toHaveAttribute('aria-invalid', 'false');
        await page.waitForTimeout(1000);
    });

    test('license plate: invalid when longer than 14 characters', async ({ page }) => {
        const licenseInput = page.locator('#license-plate-id');
        await licenseInput.scrollIntoViewIfNeeded();
        await licenseInput.focus();

        const overMaxLength = '1234567890ก12345'; // 16 ตัว

        await licenseInput.pressSequentially(overMaxLength, { delay: 40 });
        await licenseInput.blur();

        await expect(licenseInput).toHaveValue('1234567890ก123');
        await page.waitForTimeout(1000);
    });

    test('กรอกเลขตัวถังไม่ครบ 17 หลัก', async ({ page }) => {

        const chassisInput = page.locator('#chassis-number-id');

        await chassisInput.pressSequentially('MRH123456789', { delay: 40 }); // 12 หลัก
        await chassisInput.blur();

        await expect(
            page.locator('[data-slot="form-message"]')
        ).toHaveText('กรุณากรอกเลขตัวถังให้ถูกต้อง');
        await page.waitForTimeout(1000);
    });

    test('กรอกเลขตัวถังครบ 17 หลัก (ถูกต้อง)', async ({ page }) => {

        const chassisInput = page.locator('#chassis-number-id');

        await chassisInput.pressSequentially('MRH123456789ABCDE', { delay: 40 }); // 17 ตัวอักษร
        await chassisInput.blur();

        // error message ต้องไม่แสดง
        await expect(
            page.locator('[data-slot="form-message"]')
        ).toBeHidden();
        await page.waitForTimeout(1000);
    });

    test('กรอกเลขตัวถังเกิน 17 ตัว ระบบต้องตัดเหลือ 17 ตัว', async ({ page }) => {

        const chassisInput = page.locator('#chassis-number-id');

        await chassisInput.pressSequentially('MRH123456789ABCDE999', { delay: 40 });
        // ตรวจว่าค่าใน input ถูกตัดเหลือ 17 ตัว
        await expect(chassisInput).toHaveValue('MRH123456789ABCDE');

        // blur เพื่อตรวจ validation
        await chassisInput.blur();

        // ต้องไม่มี error message แสดง
        await expect(
            page.locator('[data-slot="form-message"]')
        ).toBeHidden();
        await page.waitForTimeout(1000);
    });

    test('กรอกเลขตัวถัง - กรอกอิโมจิไม่ได้', async ({ page }) => {

        const chassisInput = page.locator('#chassis-number-id');

        await chassisInput.pressSequentially('😀🚗🔥', { delay: 40 });
      
        await expect(chassisInput).toHaveValue('');
        await page.waitForTimeout(1000);
    });

    test('เลขเครื่องยนต์ - กรอกถูกต้อง', async ({ page }) => {

        const engineInput = page.locator('#engine-number-id');

        await engineInput.pressSequentially('SDSDASDAS123', { delay: 40 }); // < 20 ตัว
        await engineInput.blur();

        await expect(
            page.locator('[data-slot="form-message"]')
        ).toBeHidden();
        await page.waitForTimeout(1000);
    });

    test('เลขเครื่องยนต์ - กรอกเกิน 20 ตัวไม่ได้', async ({ page }) => {

        const engineInput = page.locator('#engine-number-id');

        await engineInput.pressSequentially('ABCDEFGH123456789012345', { delay: 40 }); // 23 ตัว

        await expect(engineInput).toHaveValue('ABCDEFGH123456789012'); // 20 ตัว
        await expect(engineInput).toHaveJSProperty('value.length', 20);
        await page.waitForTimeout(1000);
    });

    test('เลขเครื่องยนต์ - กรอกอิโมจิไม่ได้', async ({ page }) => {
        const engineInput = page.locator('#engine-number-id');

        await engineInput.fill('😀🚗🔥');

        // ระบบไม่ควรรับอิโมจิ
        await expect(engineInput).toHaveValue('');

    });






























});