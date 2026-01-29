import { test, expect } from '@playwright/test';

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
    "3100900155331",
    "1234567890121",
    "0000000000001",
    "9999999999994",
];

test.describe('Validate form on Order Info page', () => {
    const url =
        'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/order-info';

    test.beforeEach(async ({ page }) => {
        await page.goto(url);
    });

    test('select buy for myself + empty validation', async ({ page }) => {

        // STEP 1: Select buy for myself
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        await expect(buyForMyself).toHaveAttribute('aria-checked', 'true');

        // STEP 2: Submit empty form
        const idCardInput = page.locator('#insured-id-card-input-id');
        await idCardInput.fill('');
        await idCardInput.blur();

        await page.getByRole('button', { name: /ถัดไป|ต่อไป/ }).click();

        // STEP 3: Assert invalid field
        await expect(idCardInput).toHaveAttribute('aria-invalid', 'true');

        // STEP 4: Assert error messages
        const expectedErrors = [
            'กรุณากรอกเลขบัตรประชาชน',
            'กรุณาเลือกคำนำหน้าชื่อ',
            'กรุณากรอกชื่อ',
            'กรุณากรอกนามสกุล',
            'กรุณาเลือกวันเกิด',
            'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง'
        ];

        for (const message of expectedErrors) {
            await expect(page.getByText(message)).toBeVisible();
        }

        // email + confirm email (ข้อความซ้ำ 2 จุด)
        await expect(
            page.getByText('กรุณากรอกอีเมล')
        ).toHaveCount(2);

        // STEP 5: Still on step 1
        await expect(
            page.getByText('ขั้นตอน 1/4')
        ).toBeVisible();
    });

    test('should invalidate id card and allow re-input', async ({ page }) => {

        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const idCardInput = page.locator('#insured-id-card-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

        for (const idcard of invalidIDcard) {
            // กรอกเลขบัตรผิด
            await idCardInput.pressSequentially(idcard, { delay: 80 });
            await idCardInput.blur();

            // trigger validation
            await nextButton.click();

            // field ต้อง invalid
            await expect(idCardInput).toHaveAttribute('aria-invalid', 'true');

            // error message ต้องขึ้น
            await expect(
                page.getByText('กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง')
            ).toBeVisible();

            // clear เพื่อกรอกค่าใหม่
            await idCardInput.fill('');
            await expect(idCardInput).toHaveValue('');
        }
    });

    test('should accept valid id card and allow re-input', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const idCardInput = page.locator('#insured-id-card-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

        for (const idcard of validIDcard) {
            // กรอกเลขบัตรถูกต้อง
            await idCardInput.fill(''); // ensure clean
            await idCardInput.pressSequentially(idcard, { delay: 80 });
            await idCardInput.blur();

            // trigger validation
            await nextButton.click();

            // field ต้อง NOT invalid
            await expect(idCardInput).not.toHaveAttribute('aria-invalid', 'true');

            // error message ต้องไม่แสดง
            await expect(
                page.getByText('กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง')
            ).toHaveCount(0);

            await idCardInput.fill('');
            await expect(idCardInput).toHaveValue('');
        }
    });

    test('should prevent typing more than max length for id card', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const idCardInput = page.locator('#insured-id-card-input-id');

        const maxLength = 17;
        const fullIdCard = '1-2345-67890-12-3'; // 17 chars

        // กรอกให้เต็ม
        await idCardInput.pressSequentially(fullIdCard, { delay: 40 });
        await expect(idCardInput).toHaveValue(fullIdCard);

        // พยายามกรอกเกิน
        await idCardInput.pressSequentially('99999', { delay: 40 });

        //  Paste เกิน
        await idCardInput.fill('1-2345-67890-12-34567');
        expect((await idCardInput.inputValue()).length).toBe(17);


        const finalValue = await idCardInput.inputValue();

        // assert เฉพาะ behavior ของ maxlength
        expect(finalValue.length).toBe(maxLength);
        expect(finalValue).toBe(fullIdCard);
    });

    test('should show required error when id card is cleared by backspace', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const idCardInput = page.locator('#insured-id-card-input-id');

        // กรอกค่าที่ถูกต้องก่อน
        const validId = '1-2345-67890-12-3';
        await idCardInput.pressSequentially(validId, { delay: 80 });
        await expect(idCardInput).toHaveValue(validId);

        // ลบออกทั้งหมด (simulate backspace)
        for (let i = 0; i < validId.length; i++) {
            await idCardInput.press('Backspace');
            await page.waitForTimeout(80);
        }

        // ระบบต้องขึ้น error ทันที
        await expect(idCardInput).toHaveAttribute('aria-invalid', 'true');

        await expect(
            page.getByText('กรุณากรอกเลขบัตรประชาชน')
        ).toBeVisible();
    });

    //------------------------------ TITLE NAME-----------------------------------
    test('should show error when title name is not selected', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const titleSelect = page.locator('#insured-title-name-select-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const titleSelect = page.locator('#insured-title-name-select-id');

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const titleSelect = page.locator('#insured-title-name-select-id');

        // เลือกค่าแรก
        await titleSelect.click();
        await page.getByRole('option', { name: 'นาย' }).click();

        await expect(
            titleSelect.locator('[data-slot="select-value"]')
        ).toHaveText('นาย');
        await page.waitForTimeout(1000);

        await expect(titleSelect).not.toHaveAttribute('aria-invalid', 'true');

        // เปลี่ยนเป็นค่าใหม่
        await titleSelect.click();
        await page.getByRole('option', { name: 'นาง' }).click();

        // ค่าใหม่ต้องแสดง
        await expect(
            titleSelect.locator('[data-slot="select-value"]')
        ).toHaveText('นาง');
        await page.waitForTimeout(1000);

        // เปลี่ยนเป็นค่าใหม่
        await titleSelect.click();
        await page.getByRole('option', { name: 'น.ส.' }).click();

        // ค่าใหม่ต้องแสดง
        await expect(
            titleSelect.locator('[data-slot="select-value"]')
        ).toHaveText('น.ส.');
        await page.waitForTimeout(1000);

        // ยังต้อง valid
        await expect(titleSelect).not.toHaveAttribute('aria-invalid', 'true');
    });

    //---------------------------------- NAME -----------------------------------
    test('first name: should show error when empty', async ({ page }) => {

        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const firstNameInput = page.locator('#insured-name-input-id');

        // ต้องประกาศก่อนใช้
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

        await firstNameInput.fill('');
        await firstNameInput.blur();

        // trigger validation
        await nextButton.click();

        await expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(page.getByText('กรุณากรอกชื่อ')).toBeVisible();
        await page.waitForTimeout(1000);
    });


    test('first name: should accept Thai characters 1-50 characters', async ({ page }) => {

        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const firstNameInput = page.locator('#insured-name-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });
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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const firstNameInput = page.locator('#insured-name-input-id');

        const longThaiName = 'ก'.repeat(60);
        await firstNameInput.fill(longThaiName);

        const value = await firstNameInput.inputValue();
        expect(value.length).toBeLessThanOrEqual(50);
        await page.waitForTimeout(1000);
    });

    test('first name: should block non-Thai characters', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const firstNameInput = page.locator('#insured-name-input-id');

        await firstNameInput.fill('John123!@#');
        const value = await firstNameInput.inputValue();

        // ต้องไม่ติดอะไรเลย
        expect(value).toBe('');
        await page.waitForTimeout(1000);
    });

    test('first name: should show error after clearing input', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const firstNameInput = page.locator('#insured-name-input-id');

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const lastNameInput = page.locator('#insured-last-name-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const lastNameInput = page.locator('#insured-last-name-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const lastNameInput = page.locator('#insured-last-name-input-id');

        await lastNameInput.fill('ใจดี  มาก'); // วรรคติดกัน
        await lastNameInput.blur();

        await expect(lastNameInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกนามสกุล')
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('last name: should not allow leading or trailing spaces', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const lastNameInput = page.locator('#insured-last-name-input-id');

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const lastNameInput = page.locator('#insured-last-name-input-id');

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const lastNameInput = page.locator('#insured-last-name-input-id');

        const longThaiName = 'ใจ'.repeat(60); // 120 ตัว
        await lastNameInput.pressSequentially(longThaiName, { delay: 40 });

        await lastNameInput.fill(longThaiName);

        await expect(lastNameInput).toHaveValue(
            longThaiName.slice(0, 100)
        );
        await page.waitForTimeout(1000);
    });

    test('last name: should block invalid characters', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const lastNameInput = page.locator('#insured-last-name-input-id');

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const dobInput = page.locator('#insured-date-of-birth-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const dobInput = page.locator('#insured-date-of-birth-input-id');

        await expect(dobInput).toHaveAttribute('readonly', '');
        await page.waitForTimeout(1000);
    });

    test('date of birth: should accept age between 20 and 85 years', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();

        const dobInput = page.locator('#insured-date-of-birth-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const emailInput = page.locator('#insured-email-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });
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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const emailInput = page.locator('#insured-email-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });
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
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const emailInput = page.locator('#insured-email-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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

        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const emailInput = page.locator('#insured-email-input-id');

        const tooLong =
            'a'.repeat(150) + '@test.com';

        await emailInput.fill(tooLong);

        const value = await emailInput.inputValue();
        // ถูกตัดเหลือ 100 ตัว
        expect(value.length).toBe(100);
        await page.waitForTimeout(1000);
    });

    //--------------------------- Confirme Email -----------------------------

    test('confirm email: should show required error when empty', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const emailInput = page.locator('#insured-confirm-email-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

        await emailInput.fill('');
        await nextButton.click();

        await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกอีเมล').first()
        ).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('confirm email: should reject invalid formats', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const inemailInput = page.locator('#insured-confirm-email-input-id');
        const emailInput = page.locator('#insured-email-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

        const validEmails = [
            'test.user@email.com',
        ];

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
        for (const validemail of validEmails) {
            await emailInput.fill('');
            await emailInput.pressSequentially(validemail, { delay: 40 });
            await page.waitForTimeout(1000);

        }

        for (const email of invalidEmails) {
            await inemailInput.fill('');
            await inemailInput.pressSequentially(email, { delay: 40 });
            await nextButton.click();

            await expect(inemailInput).toHaveAttribute('aria-invalid', 'true');
            await expect(
                page.getByText('กรุณากรอกอีเมลให้ถูกต้อง')
            ).toBeVisible();
            await page.waitForTimeout(1000);
        }
    });

    test('confirm email: should accept valid email formats', async ({ page }) => {
        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const emailInput = page.locator('#insured-confirm-email-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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
            //await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');

            // error ของ field นี้ต้องไม่ขึ้น
            const emailError = page.locator('#_r_19_-form-item-message');
            await expect(emailError).toHaveCount(0);
            await page.waitForTimeout(1000);
        }
    });

    test('confirm email: should limit length to max 100 characters', async ({ page }) => {

        const buyForMyself = page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' });
        await buyForMyself.click();
        const emailInput = page.locator('#insured-confirm-email-input-id');

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
        await page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' }).click();
        const phoneInput = page.locator('#insured-phone-number-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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
        await page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' }).click();
        const phoneInput = page.locator('#insured-phone-number-input-id');

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
        await page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' }).click();
        const phoneInput = page.locator('#insured-phone-number-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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
        await page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' }).click();

        const phoneInput = page.locator('#insured-phone-number-input-id');
        const nextButton = page.getByRole('button', { name: /ถัดไป|ต่อไป/ });

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
        await page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' }).click();
        const phoneInput = page.locator('#insured-phone-number-input-id');

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
        await page.getByRole('radio', { name: 'ซื้อให้ตัวเอง' }).click();
        const phoneInput = page.locator('#insured-phone-number-input-id');

        await phoneInput.pressSequentially('0891234567', { delay: 40 } );
        await phoneInput.blur();

        await expect(phoneInput).not.toHaveAttribute('aria-invalid', 'true');
        await expect(
            page.getByText('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง')
        ).toHaveCount(0);
        await page.waitForTimeout(1000);
    });
































});
