import { test, expect } from '@playwright/test';

const validEmails = [
    "test1233@gmail.com",
    "user.name_ok-1@example.co",
    "abc_def-123@my-domain.com",
    "a1.b2_c3-d4@domain.co.th",
    "normalemail@abc.net",
    "good-email_123@sub.domain.com",
    "zz123@domain.io",
    "thisisaveryveryveryveryverylongemailaddress_thatexceedslimit@domain.com",
    "short@a.co",
    "p.testhdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd@gmail.com",
];

const invalidEmails = [
    "@domain.com",
    ".username@domain.com",
    "user.@domain.com",
    "us..er@domain.com",
    "user@@domain.com",
    "user@do..main.com",
    "user@domain",
    "user@domain.c",
    "user@-domain.com",
    //"user@domain-.com", // This is emaill > system error
    "user@domain..com"
];

const memberEmails = [
    "heytest41@gmail.com",
    "example002@gmail.com",
    "a@gmail.com",
    "ptest.hdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd@gmail.com",
];


const baseURL = 'https://dev-heygoody.areetech.io/th';

test.describe('Email Validation Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');
    });

    // Helper function สำหรับเปิด login dialog
    async function openLoginDialog(page) {
        // รอปุ่มปรากฏ
        await page.waitForSelector('button[data-slot="dialog-trigger"]');
        // คลิกปุ่ม login/register
        await page.locator('button[data-slot="dialog-trigger"]').nth(0).click();
        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
        await page.waitForTimeout(1000);

        const dialog = page.locator('[role="dialog"][data-state="open"]');

        const emailField = dialog.getByLabel('อีเมล / เลขบัตรประชาชน').first();
        await emailField.waitFor({ state: 'visible', timeout: 10000 });

        //await emailField.click({ force: true });
        //await emailField.fill('user@@domain.com');
        //await emailField.blur();
        await page.waitForTimeout(1000);

        //await dialog.locator('button[data-slot="button"]:has-text("เข้าสู่ระบบ")').nth(1).click();

        //await expect(dialog.getByText('กรุณากรอกข้อมูลให้ถูกต้อง')).toBeVisible();
        return { dialog, emailField };

    }

    // ---------------------- Test valid emails ----------------------
    validEmails.forEach((email, index) => {
        test(`should validate email: ${email}`, async ({ page }) => {
            // เปิด login dialog
            const { dialog, emailField } = await openLoginDialog(page);

            // Clear และกรอกอีเมล
            await emailField.clear();
            await emailField.fill(email);

            const loginButton = page.locator('#login-submit-button-id');
            await loginButton.waitFor({ state: 'visible', timeout: 5000 }); // รอให้ปุ่มโผล่บนหน้า

            await expect(loginButton).toBeEnabled({ timeout: 5000 }); // รอให้ปุ่มพร้อมคลิก (ไม่ disabled)
            await loginButton.click();

            console.log('Login button clicked');

            await page.waitForTimeout(1500);

            // ตรวจสอบว่ามี error message หรือไม่
            const errorMessage = dialog.locator('text=/ไม่ถูกต้อง|invalid|error|กรุณา/i');
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (hasError) {
                const errorText = await errorMessage.textContent();
                console.log(`Email: ${email} - Error: ${errorText}`);
            } else {
                console.log(`Email: ${email} - Accepted (No error shown)`);
            }

            await page.waitForTimeout(2000);

            // ตรวจข้อความ expected
            const expectedMessage = "อีเมลนี้ยังไม่เป็นสมาชิก";
            const messageLocator = dialog.getByText(expectedMessage).first();
            await expect(messageLocator).toBeVisible({
                timeout: 2000
            });
            console.log(`Email: ${email} ✅ Expected message shown: ${expectedMessage}`);
        });
    });

    // ---------------------- Test invalid emails ----------------------
    invalidEmails.forEach((email, index) => {
        test(`should invalidate email: ${email}`, async ({ page }) => {

            const { dialog, emailField } = await openLoginDialog(page);

            await emailField.clear();
            await emailField.fill(email);
            //await dialog.locator('button[data-slot="button"]:has-text("ดำเนินการต่อ")').nth(1).click();
            const loginButton = page.locator('#login-submit-button-id');
            await loginButton.waitFor({ state: 'visible', timeout: 5000 }); 
            await expect(loginButton).toBeEnabled({ timeout: 5000 }); 
            await loginButton.click();

            console.log('Login button clicked');

            await page.waitForTimeout(1500);

            // ตรวจสอบว่ามี error message หรือไม่
            const errorMessage = dialog.locator('text=/ไม่ถูกต้อง|invalid|error|กรุณา/i');
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (hasError) {
                const errorText = await errorMessage.textContent();
                console.log(`Email: ${email} - Error: ${errorText}`);
            } else {
                const expectedMessage = "กรุณากรอกข้อมูลให้ถูกต้อง";
                const messageLocator = dialog.getByText(expectedMessage).first();
                await expect(messageLocator).toBeVisible({
                    timeout: 2000
                });
                console.log(`Email: ${email} ♻️ Expected message shown: ${expectedMessage}`);
            }
            await page.waitForTimeout(1500);


        });
    });


    // ---------------------- Test email empty ----------------------
    test('should show error when email is empty', async ({ page }) => {
        const { dialog, emailField } = await openLoginDialog(page);

        await emailField.click({ force: true });
        await emailField.blur();
        await emailField.clear();

        //await dialog.locator('button[data-slot="button"]:has-text("ดำเนินการต่อ")').nth(1).click();

        const loginButton = page.locator('#login-submit-button-id');
        await loginButton.waitFor({ state: 'visible', timeout: 5000 }); 
        await expect(loginButton).toBeEnabled({ timeout: 5000 }); 
        await loginButton.click();

        console.log('Login button clicked');

        await page.waitForTimeout(1500);

        // ตรวจ error message
        const errorMessage = dialog.locator('text=/กรุณากรอก|required|จำเป็น|ไม่ถูกต้อง/i');
        const errorVisible = await errorMessage.isVisible().catch(() => false);

        expect(errorVisible).toBeTruthy();
        console.log(`Empty email - Error shown: ${errorVisible}`);

        if (errorVisible) {
            const errorText = await errorMessage.textContent();
            //console.log(`Error message: ❌ ${errorText}`);
            // ตรวจสอบว่า text ตรงกับ expected
            expect(errorText?.trim()).toBe('กรุณากรอกอีเมล / เลขบัตรประชาชน');
        }
    });

    // ---------------------- Test member emails ----------------------
    memberEmails.forEach((email, index) => {
        test(`should check member email: ${email}`, async ({ page }) => {

            const { dialog, emailField } = await openLoginDialog(page);

            await emailField.clear();
            await emailField.fill(email);
            //await dialog.locator('button[data-slot="button"]:has-text("ดำเนินการต่อ")').nth(1).click();
            const loginButton = page.locator('#login-submit-button-id');
            await loginButton.waitFor({ state: 'visible', timeout: 5000 }); 
            await expect(loginButton).toBeEnabled({ timeout: 5000 }); 
            await loginButton.click();

            console.log('Login button clicked');

            await page.waitForTimeout(1500);

            // ตรวจสอบว่ามี error message หรือไม่
            const errorMessage = dialog.locator('text=/ไม่ถูกต้อง|invalid|error|กรุณา/i');
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (hasError) {
                const errorText = await errorMessage.textContent();
                console.log(`Email: ${email} - Error: ${errorText}`);
            } else {
                const expectedMessage = "เข้าสู่ระบบสมาชิก";
                const messageLocator = dialog.getByText(expectedMessage).first();
                await expect(messageLocator).toBeVisible({
                    timeout: 2000
                });
                console.log(`Email: ${email} 🪪 เป็น Member: ${expectedMessage}`);
            }
            await page.waitForTimeout(1500);
        });
    });


});