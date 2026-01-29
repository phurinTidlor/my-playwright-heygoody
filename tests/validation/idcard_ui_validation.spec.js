import { test, expect } from '@playwright/test';

const validIDcard = [
    "1919900230281",
    "1100702074397",
    "3100900155331",
    "1234567890121",
    "0000000000001",
    "9999999999994",
];

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

const memberexitIDcard = [
    "1308461143651",
];

const memberIDcard = [
    "5458024756029",
];


const baseURL = 'https://dev-heygoody.areetech.io/th';

test.describe('Email Validation Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');
    });

    async function openLoginDialog(page) {

        await page.waitForSelector('button[data-slot="dialog-trigger"]');

        await page.locator('button[data-slot="dialog-trigger"]').nth(0).click();
        await page.waitForTimeout(1000);
        //await page.locator('button#login-button-id',{ name: 'เข้าสู่ระบบ' }).nth(1).click({force : true});
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

    // ---------------------- Test valid ID Card ----------------------
    validIDcard.forEach((email, index) => {
        test(`should validate idcard: ${email}`, async ({ page }) => {

            const { dialog, emailField } = await openLoginDialog(page);

            await emailField.clear();
            await emailField.click({ force: true });
            await emailField.fill(email);
            //await dialog.locator('button[data-slot="button"]:has-text("เข้าสู่ระบบ")').nth(1).click();

            const loginButton = page.locator('#login-submit-button-id');
            await loginButton.waitFor({ state: 'visible', timeout: 5000 }); // รอให้ปุ่มโผล่บนหน้า

            await expect(loginButton).toBeEnabled({ timeout: 5000 }); // รอให้ปุ่มพร้อมคลิก (ไม่ disabled)
            await loginButton.click();

            console.log('Login button clicked');

            await page.waitForTimeout(1500);

            const errorMessage = dialog.locator('text=/ไม่ถูกต้อง|invalid|error|กรุณา/i');
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (hasError) {
                const errorText = await errorMessage.textContent();
                console.log(`idcard: ${email} - Error: ${errorText}`);
            } else {
                console.log(`idcard: ${email} - Accepted (No error shown)`);
            }

            await page.waitForTimeout(1500);
            await expect(dialog).toBeVisible({ timeout: 5000 });

            // รอให้ data-state="open" ปรากฏ (บาง UI เปลี่ยนช้า)
            await page.locator('[role="dialog"][data-state="open"]').waitFor({ timeout: 5000 });

            // ตรวจข้อความ
            const expectedMessage = "คุณยังไม่ได้เป็นสมาชิกกับ heygoody";
            const messageLocator = page.getByText(expectedMessage);
            await expect(messageLocator).toBeVisible({ timeout: 5000 });

            console.log(`idcard: ${email} ✅ Expected message shown: ${expectedMessage}`);
        });
    });

    // ---------------------- Test invalid ID Card ----------------------
    invalidIDcard.forEach((email, index) => {
        test(`should invalidate idcard: ${email}`, async ({ page }) => {

            const { dialog, emailField } = await openLoginDialog(page);

            await emailField.clear();
            await emailField.fill(email);
            //await dialog.locator('button[data-slot="button"]:has-text("เข้าสู่ระบบ")').nth(1).click();
            const loginButton = page.locator('#login-submit-button-id');
            await loginButton.waitFor({ state: 'visible', timeout: 5000 }); // รอให้ปุ่มโผล่บนหน้า

            await expect(loginButton).toBeEnabled({ timeout: 5000 }); // รอให้ปุ่มพร้อมคลิก (ไม่ disabled)
            await loginButton.click();

            console.log('Login button clicked');

            await page.waitForTimeout(1500);

            const errorMessage = dialog.locator('text=/ไม่ถูกต้อง|invalid|error|กรุณา/i');
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (hasError) {
                const errorText = await errorMessage.textContent();
                console.log(`idcard: ${email} - Error: ${errorText}`);
            } else {
                const expectedMessage = "กรุณากรอกข้อมูลให้ถูกต้อง";
                const messageLocator = dialog.getByText(expectedMessage).first();
                await expect(messageLocator).toBeVisible({
                    timeout: 2000
                });
                console.log(`idcard: ${email} ♻️ Expected message shown: ${expectedMessage}`);
            }
            await page.waitForTimeout(1500);


        });
    });


    // ---------------------- Test ID Card empty ----------------------
    test('should show error when idcard is empty', async ({ page }) => {
        const { dialog, emailField } = await openLoginDialog(page);

        //await emailField.click({ force: true });
        await emailField.blur();
        //await emailField.clear();
        await page.waitForTimeout(1000);

        //await dialog.locator('button[data-slot="button"]:has-text("เข้าสู่ระบบ")').nth(1).click();
        //await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

        const loginButton = page.locator('#login-submit-button-id');
        await loginButton.waitFor({ state: 'visible', timeout: 5000 }); // รอให้ปุ่มโผล่บนหน้า

        await expect(loginButton).toBeEnabled({ timeout: 5000 }); // รอให้ปุ่มพร้อมคลิก (ไม่ disabled)
        await loginButton.click();

        console.log('Login button clicked');

        await page.waitForTimeout(1500);

        const errorMessage = dialog.locator('text=/กรุณากรอก|required|จำเป็น|ไม่ถูกต้อง/i');
        const errorVisible = await errorMessage.isVisible().catch(() => false);

        expect(errorVisible).toBeTruthy();
        console.log(`Empty ID Card - Error shown: ${errorVisible}`);

        if (errorVisible) {
            const errorText = await errorMessage.textContent();
            expect(errorText?.trim()).toBe('กรุณากรอกอีเมล / เลขบัตรประชาชน');
        }
    });

    // ---------------------- Test member ID Card ----------------------
    memberIDcard.forEach((email, index) => {
        test(`should check member idcard: ${email}`, async ({ page }) => {

            const { dialog, emailField } = await openLoginDialog(page);

            await emailField.clear();
            await emailField.fill(email);
            //await dialog.locator('button[data-slot="button"]:has-text("เข้าสู่ระบบ")').nth(1).click();
            const loginButton = page.locator('#login-submit-button-id');
            await loginButton.waitFor({ state: 'visible', timeout: 5000 }); // รอให้ปุ่มโผล่บนหน้า

            await expect(loginButton).toBeEnabled({ timeout: 5000 }); // รอให้ปุ่มพร้อมคลิก (ไม่ disabled)
            await loginButton.click();

            console.log('Login button clicked');

            await page.waitForTimeout(1500);

            const errorMessage = dialog.locator('text=/ไม่ถูกต้อง|invalid|error|กรุณา/i');
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (hasError) {
                const errorText = await errorMessage.textContent();
                console.log(`idcard: ${email} - Error: ${errorText}`);
            } else {
                const expectedMessage = "เข้าสู่ระบบสมาชิก";
                const messageLocator = dialog.getByText(expectedMessage).first();
                await expect(messageLocator).toBeVisible({
                    timeout: 2000
                });
                console.log(`idcard: ${email} 🪪 เป็น Member: ${expectedMessage}`);
            }
            await page.waitForTimeout(1500);
        });
    });

     // ---------------------- Test member Exit ID Card ----------------------
    memberexitIDcard.forEach((email, index) => {
        test(`should check member idcard: ${email}`, async ({ page }) => {

            const { dialog, emailField } = await openLoginDialog(page);

            await emailField.clear();
            await emailField.fill(email);
            //await dialog.locator('button[data-slot="button"]:has-text("เข้าสู่ระบบ")').nth(1).click();
            const loginButton = page.locator('#login-submit-button-id');
            await loginButton.waitFor({ state: 'visible', timeout: 5000 }); // รอให้ปุ่มโผล่บนหน้า

            await expect(loginButton).toBeEnabled({ timeout: 5000 }); // รอให้ปุ่มพร้อมคลิก (ไม่ disabled)
            await loginButton.click();

            console.log('Login button clicked');

            await page.waitForTimeout(1500);

            const errorMessage = dialog.locator('text=/ไม่ถูกต้อง|invalid|error|กรุณา/i');
            const hasError = await errorMessage.isVisible().catch(() => false);

            if (hasError) {
                const errorText = await errorMessage.textContent();
                console.log(`idcard: ${email} - Error: ${errorText}`);
            } else {
                const expectedMessage = "คุณยังไม่ได้เป็นสมาชิกกับ heygoody";
                const messageLocator = dialog.getByText(expectedMessage).first();
                await expect(messageLocator).toBeVisible({
                    timeout: 2000
                });
                console.log(`idcard: ${email} 🪪 คุณยังไม่ได้เป็นสมาชิกกับ heygoody : ${expectedMessage}`);
            }
            await page.waitForTimeout(1500);
        });
    });


});