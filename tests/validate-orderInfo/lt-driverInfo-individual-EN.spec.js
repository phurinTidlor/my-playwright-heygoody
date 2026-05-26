import { test, expect } from '@playwright/test';
const { driver } = require('../../helpers/test-data');

const invalidIDcard = [
    "7",
    "73",
    "730",
    "7301",
    "73016",
    "730166",
    "7301664",
    "73016644",
    "730166441",
    "7301664413",
    "73016644137",
    "730166441376",
    "7301664413762",
    "1100702074392",
    "3100900155339",
    "1234567890129",
    "1111111111111",
    "1234567890123",
    "9999999999999",
];

const validIDcard = [
    "1919900230281",
    "1100702074397",
    driver.idCard,
    "1234567890121",
    "0000000000001",
    "9999999999994",
];

const validLicenses = [
    'ข.ต.1932332',
    'กท 123456',
    'ทบ.12345',
    'ขจ 12-345678',
    '6500900123456',
    '01234567',
    '12345678',
];

const invalidLicenses = [
    '@@@###',
    '1234567890123456789',
    '--123',
    'ก@123',
];

const validPassports = [
    'A12345',
    'AB123456',
    'A1B2C3',
    'ABC1234',
    'A123456789',
];

test.describe('Validate form on Order Info page', () => {
    const url =
        'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/order-info';

    test.beforeEach(async ({ page }) => {
        await page.goto(url);
        const trigger = page.locator('#driver-info-accordion-trigger-id');
        const content = page.locator('#radix-_r_6_');
        await trigger.scrollIntoViewIfNeeded();

        // เช็คก่อนว่าปิดอยู่ไหม
        const expanded = await trigger.getAttribute('aria-expanded');

        if (expanded !== 'true') {
            await trigger.click();
        }
        // assert ว่าเปิดจริง
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(trigger).toHaveAttribute('data-state', 'open');
        await expect(content).toBeVisible();

        // เลือก radio "ระบุข้อมูลเอง"
        const manualRadio = page.locator('#driver1-manual-radio-id');

        await manualRadio.scrollIntoViewIfNeeded();
        await manualRadio.click();
        await expect(manualRadio).toHaveAttribute('aria-checked', 'true');
        await page.waitForTimeout(1000);

        // เลือก ต่างชาติ
        const foreignRadio = page.locator('#nationality-foreign');

        await foreignRadio.scrollIntoViewIfNeeded();
        await foreignRadio.click();

        await expect(foreignRadio).toHaveAttribute('aria-checked', 'true');
        await expect(foreignRadio).toHaveAttribute('data-state', 'checked');


        await page.waitForTimeout(1000);

    });


    test('passport no: should show required error when empty', async ({ page }) => {
        const input = page.locator('#driver-passport-no-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });

        await input.fill('');
        await input.blur();
        await nextButton.click();

        await expect(input).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอก Passport No.').first()
        ).toBeVisible();
    });


    test('passport no: should show error when less than 6 characters', async ({ page }) => {
        const input = page.locator('#driver-passport-no-input-id');

        await input.fill('A123');
        await input.blur();

        await expect(input).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอก Passport No. ให้ถูกต้อง').first()
        ).toBeVisible();
    });


    test('passport no: should accept valid formats (6–10 chars)', async ({ page }) => {
        const input = page.locator('#driver-passport-no-input-id');

        for (const value of validPassports) {
            await input.fill('');
            await input.type(value, { delay: 30 });
            await input.blur();

            await expect(input).toHaveAttribute('aria-invalid', 'false');
        }
    });

    test('passport no: should allow only english letters and digits', async ({ page }) => {
        const input = page.locator('#driver-passport-no-input-id');

        await input.fill('');
        await input.type('A12@#กข!', { delay: 30 });

        const value = await input.inputValue();

        // ต้องเหลือเฉพาะ A-Z a-z 0-9
        expect(value).toMatch(/^[A-Za-z0-9]*$/);
    });


    test('passport no: should not allow more than 10 characters', async ({ page }) => {
        const input = page.locator('#driver-passport-no-input-id');

        await input.fill('A123456789999');
        const value = await input.inputValue();

        expect(value.length).toBeLessThanOrEqual(10);
    });

    //------------------------------ DRIVER LICENSE ----------------------------------

    test('driving license: required validation', async ({ page }) => {
        const licenseInput = page.locator('#driver-driving-license-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });

        await licenseInput.fill('');
        await licenseInput.blur();
        await nextButton.click();

        await expect(licenseInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกเลขที่ใบขับขี่')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });


    test(`driving license: valid format > 4 `, async ({ page }) => {
        for (const value of validLicenses) {
            const input = page.locator('#driver-driving-license-input-id');

            await input.fill(value);
            await input.blur();

            await expect(input).toHaveAttribute('aria-invalid', 'false');
        }
    });

    test('driving license: valid format (fill and re-fill)', async ({ page }) => {
        const inputlicense = page.locator('#driver-driving-license-input-id');

        for (const value of validLicenses) {

            // STEP 2: กรอกค่าใหม่
            await inputlicense.pressSequentially(value, { delay: 80 });
            await inputlicense.blur();
            await inputlicense.fill('');

            // STEP 3: assert ว่าผ่าน validation
            await expect(inputlicense).toHaveValue('');
        }
    });

    test('driving license: invalid format (fill and re-fill)', async ({ page }) => {
        const inputlicense = page.locator('#driver-driving-license-input-id');

        for (const value of invalidLicenses) {

            await inputlicense.pressSequentially(value, { delay: 80 });
            await inputlicense.blur();
            await inputlicense.fill('');
            await expect(inputlicense).toHaveValue('');
        }
    });

    test('driving license: should not allow more than 18 characters', async ({ page }) => {
        const input = page.locator('#driver-driving-license-input-id');

        const overLimitValue = '12345678901234567890'; // 20 ตัว

        await input.fill('');
        await input.type(overLimitValue);
        await input.blur();

        // STEP 1: ค่าใน input ต้องไม่เกิน 18
        const value = await input.inputValue();
        expect(value.length).toBe(18);

        // STEP 2: ต้องไม่ invalid (เพราะ format ยังเป็นตัวเลขล้วน)
        await expect(input).toHaveAttribute('aria-invalid', 'false');
        await page.waitForTimeout(1000);
    });

    //------------------------------ TITLE NAME-----------------------------------
    test('should show error when title name is not selected', async ({ page }) => {

        const titleSelect = page.locator('#driver-title-name-select-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });

        // ไม่เลือกอะไรเลย → กดถัดไป
        await nextButton.click();

        // ต้อง invalid
        await expect(titleSelect).toHaveAttribute('aria-invalid', 'true');

        // error message ต้องขึ้น
        await expect(
            page.getByText('กรุณาเลือกคำนำหน้าชื่อ')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('should allow selecting title name', async ({ page }) => {
        const titleSelect = page.locator('#driver-title-name-select-id');

        // เปิด select
        await titleSelect.click();

        // เลือกค่า (Radix render เป็น role="option")
        await page.getByRole('option', { name: 'นาง' }).click();

        // ต้องไม่ invalid
        await expect(titleSelect).not.toHaveAttribute('aria-invalid', 'true');

        // ค่าใน select ต้องเป็น "นาง"
        await expect(
            titleSelect.locator('[data-slot="select-value"]')
        ).toHaveText('นาง');
        await page.waitForTimeout(1000);
    });

    test('should allow changing title name selection', async ({ page }) => {

        const titleSelect = page.locator('#driver-title-name-select-id');

        // เลือกค่าแรก
        await titleSelect.click();
        await page.getByRole('option', { name: 'Mrs.' }).click();

        await expect(
            titleSelect.locator('[data-slot="select-value"]')
        ).toHaveText('Mrs.');
        await page.waitForTimeout(1000);

        await expect(titleSelect).not.toHaveAttribute('aria-invalid', 'true');

        // เปลี่ยนเป็นค่าใหม่
        await titleSelect.click();
        await page.getByRole('option', { name: 'Mr.' }).click();

        // ค่าใหม่ต้องแสดง
        await expect(
            titleSelect.locator('[data-slot="select-value"]')
        ).toHaveText('Mr.');
        await page.waitForTimeout(1000);

        // เปลี่ยนเป็นค่าใหม่
        await titleSelect.click();
        await page.getByRole('option', { name: 'Miss.' }).click();

        // ค่าใหม่ต้องแสดง
        await expect(
            titleSelect.locator('[data-slot="select-value"]')
        ).toHaveText('Miss.');
        await page.waitForTimeout(1000);

        // ยังต้อง valid
        await expect(titleSelect).not.toHaveAttribute('aria-invalid', 'true');
    });

    //---------------------------------- NAME -----------------------------------
    test('first name: should show error when empty', async ({ page }) => {
        const firstNameInput = page.locator('#driver-name-input-id');

        // ต้องประกาศก่อนใช้
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });

        await firstNameInput.fill('');
        await firstNameInput.blur();

        // trigger validation
        await nextButton.click();

        await expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(page.getByText('กรุณากรอกชื่อ')).toBeVisible();
        await page.waitForTimeout(1000);
    });


    test('first name: should accept Thai characters 1-50 characters', async ({ page }) => {

        const firstNameInput = page.locator('#driver-name-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });
        const thaiName =
            'ชื่อทดสอบภาษาไทยยาวไม่เกินห้าสิบตัวอักษรเท่านั้น';

        await firstNameInput.fill('');
        await firstNameInput.pressSequentially(thaiName, { delay: 50 });
        await firstNameInput.blur();
        await nextButton.click();
        await expect(firstNameInput).not.toHaveAttribute('aria-invalid', 'true');

        await expect(
            page.getByText('กรุณากรอกชื่อ')
        ).toHaveCount(0);
    });


    test('first name: should not allow more than 50 characters', async ({ page }) => {

        const firstNameInput = page.locator('#driver-name-input-id');

        const longThaiName = 'ก'.repeat(60);
        await firstNameInput.fill(longThaiName);

        const value = await firstNameInput.inputValue();
        expect(value.length).toBeLessThanOrEqual(50);
        await page.waitForTimeout(1000);
    });

    test('first name: should block non-Thai characters', async ({ page }) => {

        const firstNameInput = page.locator('#driver-name-input-id');

        await firstNameInput.fill('John123!@#');
        const value = await firstNameInput.inputValue();

        // ต้องไม่ติดอะไรเลย
        expect(value).toBe('');
        await page.waitForTimeout(1000);
    });

    test('first name: should show error after clearing input', async ({ page }) => {
        const firstNameInput = page.locator('#driver-name-input-id');

        await firstNameInput.fill('สมชาย');
        await expect(firstNameInput).not.toHaveAttribute('aria-invalid', 'true');

        // clear
        await firstNameInput.fill('');
        await firstNameInput.blur();

        await expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(page.getByText('กรุณากรอกชื่อ')).toBeVisible();
        await page.waitForTimeout(1000);
    });

    //---------------------------------- LAST NAME -----------------------------------

    test('last name: should show error when empty', async ({ page }) => {

        const lastNameInput = page.locator('#driver-last-name-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });

        await lastNameInput.fill('');
        await lastNameInput.blur();
        await nextButton.click();

        await expect(lastNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกนามสกุล')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('last name: should accept Thai characters with up to 4 spaces', async ({ page }) => {

        const lastNameInput = page.locator('#driver-last-name-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });

        const validLastName = 'ใจดี มาก สุข สันติ';

        await lastNameInput.fill('');
        await lastNameInput.pressSequentially(validLastName, { delay: 40 });
        await lastNameInput.blur();
        await nextButton.click();

        await expect(lastNameInput).not.toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกนามสกุล')
        ).toHaveCount(0);
        await page.waitForTimeout(1000);
    });

    test('last name: should not allow double spaces', async ({ page }) => {

        const lastNameInput = page.locator('#driver-last-name-input-id');

        await lastNameInput.fill('ใจดี  มาก'); // วรรคติดกัน
        await lastNameInput.blur();

        await expect(lastNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกนามสกุล')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('last name: should not allow leading or trailing spaces', async ({ page }) => {

        const lastNameInput = page.locator('#driver-last-name-input-id ');

        await lastNameInput.fill(' ใจดี');
        //await lastNameInput.blur();

        await expect(lastNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('ไม่สามารถมีช่องว่างหน้าหรือหลังได้')
        ).toBeVisible();
        await page.waitForTimeout(1000);
        await lastNameInput.fill('');

        await lastNameInput.fill('ใจดี ');
        //await lastNameInput.blur();

        await expect(lastNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('ไม่สามารถมีช่องว่างหน้าหรือหลังได้')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('last name: should not allow more than 4 spaces', async ({ page }) => {

        const lastNameInput = page.locator('#driver-last-name-input-id');

        const tooManySpaces = 'ใจดี มาก สุข สันติ ดีงาม นะ';

        await lastNameInput.fill('');
        await lastNameInput.pressSequentially(tooManySpaces, { delay: 40 });
        await lastNameInput.blur();

        await expect(lastNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('ช่องว่างต้องไม่เกิน 4 ช่อง')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });


    test('last name: should not exceed 100 characters', async ({ page }) => {

        const lastNameInput = page.locator('#driver-last-name-input-id');

        const longThaiName = 'ใจ'.repeat(60); // 120 ตัว
        await lastNameInput.pressSequentially(longThaiName, { delay: 40 });

        await lastNameInput.fill(longThaiName);

        await expect(lastNameInput).toHaveValue(
            longThaiName.slice(0, 100)
        );
        await page.waitForTimeout(1000);
    });

    test('last name: should block invalid characters', async ({ page }) => {

        const lastNameInput = page.locator('#driver-last-name-input-id');

        const invalidInputs = [
            'Smith',
            '123',
            '....&&>()',
            '😎👍😉❌'
        ];

        for (const value of invalidInputs) {
            await lastNameInput.fill('');
            await lastNameInput.pressSequentially(value, { delay: 40 });
            await lastNameInput.blur();

            // ระบบต้องไม่รับค่า
            await expect(lastNameInput).toHaveValue('');

            // ยังไม่ invalid เพราะยังไม่ submit
            await expect(lastNameInput).toHaveAttribute('aria-invalid', 'false');

            console.log(`🚫 Blocked invalid last name: ${value}`);
        }
    });

    //--------------------------- Select Birthdate -----------------------------
    test('date of birth: should show error when empty', async ({ page }) => {

        const dobInput = page.locator('#driver-date-of-birth-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });

        // ไม่เลือกวันเกิด
        await nextButton.click();

        // ต้อง invalid
        await expect(dobInput).toHaveAttribute('aria-invalid', 'true');

        // inline error
        await expect(
            page.getByText('กรุณาเลือกวันเกิด')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('date of birth: should be readonly', async ({ page }) => {

        const dobInput = page.locator('#driver-date-of-birth-input-id');

        await expect(dobInput).toHaveAttribute('readonly', '');
        await page.waitForTimeout(1000);
    });

    test('date of birth: should accept age between 20 and 85 years', async ({ page }) => {

        const dobInput = page.locator('#driver-date-of-birth-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });

        // เปิด date picker
        await dobInput.click();

        // ตัวอย่าง: เลือกวันที่ valid (เช่น 1 ม.ค. 2540)
        await page.getByRole('button', { name: '1' }).click();
        await page.getByText('มกราคม').click();
        await page.getByText('2540').click();

        await nextButton.click();

        // ต้อง valid
        await expect(dobInput).not.toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณาเลือกวันเกิด')
        ).toHaveCount(0);
        await page.waitForTimeout(1000);
    });

    //--------------------------- Email -----------------------------

    test('email: should show required error when empty', async ({ page }) => {

        const emailInput = page.locator('#driver-email-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });
        await emailInput.scrollIntoViewIfNeeded();

        await emailInput.fill('');
        await nextButton.click();

        await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกอีเมล').first()
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('email: should reject invalid formats', async ({ page }) => {

        const emailInput = page.locator('#driver-email-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });
        await emailInput.scrollIntoViewIfNeeded();

        const invalidEmails = [
            'abc',                 // สั้นเกิน
            'abc@',                // ไม่มี domain
            '@domain.com',         // ไม่มี username
            '.abc@domain.com',     // ขึ้นต้นด้วย .
            'abc.@domain.com',     // ลงท้ายด้วย .
            'ab..c@domain.com',    // .. ใน username
            'abc@@domain.com',     // @ มากกว่า 1
            'abc@domain',          // ไม่มี TLD
            'abc@domain.',         // TLD ไม่ครบ
            'abc@do..main.com',    // domain มี ..
            'abc@domain.c',        // TLD < 2
        ];

        for (const email of invalidEmails) {
            await emailInput.fill('');
            await emailInput.pressSequentially(email, { delay: 40 });
            await nextButton.click();

            await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
            await expect(
                page.getByText('กรุณากรอกอีเมลให้ถูกต้อง')
            ).toBeVisible();
            await page.waitForTimeout(1000);
        }
    });

    test('email: should accept valid email formats', async ({ page }) => {

        const emailInput = page.locator('#driver-email-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });
        await emailInput.scrollIntoViewIfNeeded();

        const validEmails = [
            'test.user@email.com',
            'user_123@test.co.th',
            'hello-world@test.net',
        ];

        for (const email of validEmails) {
            // clear ก่อนทุกครั้ง
            await emailInput.fill('');
            await emailInput.pressSequentially(email, { delay: 40 });

            // trigger validation
            await nextButton.click();

            // field ต้อง valid
            await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');

            // error ของ field นี้ต้องไม่ขึ้น
            const emailError = page.locator('#_r_19_-form-item-message');
            await expect(emailError).toHaveCount(0);
            await page.waitForTimeout(1000);
        }
    });

    test('email: should limit length to max 100 characters', async ({ page }) => {

        const emailInput = page.locator('#driver-email-input-id');
        await emailInput.scrollIntoViewIfNeeded();

        const tooLong =
            'a'.repeat(150) + '@test.com';

        await emailInput.fill(tooLong);

        const value = await emailInput.inputValue();
        // ถูกตัดเหลือ 100 ตัว
        expect(value.length).toBe(100);
        await page.waitForTimeout(1000);
    });


    //--------------------------- Telephone -----------------------------

    test('phone: should show required error when empty', async ({ page }) => {

        const phoneInput = page.locator('#driver-phone-number-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });
        await phoneInput.scrollIntoViewIfNeeded();

        await phoneInput.fill('');
        await phoneInput.blur();
        await nextButton.click();

        await expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกเบอร์โทรศัพท์').first()
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('phone: should allow digits only (with auto format)', async ({ page }) => {
        const phoneInput = page.locator('#driver-phone-number-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });
        await phoneInput.scrollIntoViewIfNeeded();

        await phoneInput.fill('');
        await phoneInput.pressSequentially('123abc@#$ไทย', { delay: 40 });

        const value = await phoneInput.inputValue();

        // อนุญาตเฉพาะตัวเลข และ dash (-)
        expect(value).toMatch(/^[0-9-]*$/);

        // ต้องไม่มีตัวอักษร
        expect(value).not.toMatch(/[a-zA-Zก-๙]/);
        await page.waitForTimeout(1000);
    });

    test('phone: should show error when less than 10 digits', async ({ page }) => {
        const phoneInput = page.locator('#driver-phone-number-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });
        await phoneInput.scrollIntoViewIfNeeded();

        await phoneInput.fill('08912345'); // 8 digits
        await phoneInput.blur();
        await nextButton.click();

        await expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('phone: should reject invalid prefix', async ({ page }) => {
        const phoneInput = page.locator('#driver-phone-number-input-id');
        const nextButton = page.getByRole('button', { name: /บันทึก|ต่อไป/ });
        await phoneInput.scrollIntoViewIfNeeded();

        const invalidPhones = [
            '0512345678',
            '0712345678',
            '0012345678',
        ];

        for (const phone of invalidPhones) {
            await phoneInput.fill('');
            await phoneInput.pressSequentially(phone, { delay: 40 });
            await phoneInput.blur();
            await nextButton.click();

            await expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
            await expect(
                page.getByText('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง')
            ).toBeVisible();
            await page.waitForTimeout(1000);
        }
    });

    test('phone: should not allow more than 10 digits', async ({ page }) => {
        const phoneInput = page.locator('#driver-phone-number-input-id');
        await phoneInput.scrollIntoViewIfNeeded();

        // พิมพ์เกิน 10 digit
        await phoneInput.fill('');
        await phoneInput.pressSequentially('081234567899999', { delay: 30 });

        const value = await phoneInput.inputValue();
        const digitsOnly = value.replace(/\D/g, '');

        // ตัวเลขจริงต้องไม่เกิน 10
        expect(digitsOnly.length).toBeLessThanOrEqual(10);
        await page.waitForTimeout(1000);
    });

    test('phone: should accept valid phone number', async ({ page }) => {
        const phoneInput = page.locator('#driver-phone-number-input-id');
        await phoneInput.scrollIntoViewIfNeeded();

        await phoneInput.pressSequentially('0812345678', { delay: 40 });
        await phoneInput.blur();

        await expect(phoneInput).not.toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง')
        ).toHaveCount(0);
        await page.waitForTimeout(1000);
    });








});