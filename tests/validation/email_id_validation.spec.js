import { test, expect } from '@playwright/test';

test.describe('Validation: Email / ID Field', () => {
  const fieldSelector = '#_r_1u_-form-item'; // 👈 เปลี่ยน selector ตามจริง
  const loginButton = '#loginButton'; // 👈 เปลี่ยน selector ตามจริง
  const inlineError = '.error-inline'; // 👈 เปลี่ยน selector ตามจริง

  const baseURL = 'https://dev-heygoody.areetech.io/th';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
  });

  test('click login/register button', async ({ page }) => {
    await page.goto(baseURL);

    // รอปุ่มปรากฏ
    await page.waitForSelector('button[data-slot="dialog-trigger"]');

    // คลิกปุ่ม login/register
    await page.locator('button[data-slot="dialog-trigger"]').nth(0).click();
    await page.waitForTimeout(1000);
    await page.locator('button#login-button-id').nth(1).click();
    await page.waitForTimeout(1000);
    // await page.locator('button[data-slot="dialog-trigger"]').first().click();
    // await page.waitForTimeout(1000);
    // โค้ดแนะนำ
    const dialog = page.locator('[role="dialog"][data-state="open"]');

    // หาเฉพาะ input ช่องแรกที่อยู่ใน dialog เปิดอยู่
    const emailField = dialog.locator('input[name="email"]').first();
    await emailField.waitFor({ state: 'visible', timeout: 10000 });

    // Click then fill (no chaining)
    await emailField.click({ force: true });
    await emailField.fill('user@@domain.com');
    await emailField.blur();

    // คลิกปุ่ม “ดำเนินการต่อ”
    await dialog.locator('button[data-slot="button"]:has-text("ดำเนินการต่อ")').nth(1).click();

    // ตรวจข้อความ error
    await expect(dialog.getByText('กรุณากรอกข้อมูลให้ถูกต้อง')).toBeVisible();

    // // รอปุ่ม "ดำเนินการต่อ" visible และคลิก
    // const continueBtn = dialog.locator('button[data-slot="button"]:has-text("ดำเนินการต่อ")');
    // await continueBtn.waitFor({ state: 'visible', timeout: 10000 });
    // await continueBtn.click();

  });



  /*  test('should show error when field is empty', async ({ page }) => {
     //await page.click(loginButton);
     await page.locator('button[data-slot="button"]:has-text("ดำเนินการต่อ")').click();
     await page.waitForTimeout(1000);
     await expect(page.locator(inlineError)).toHaveText('กรุณากรอกอีเมล / เลขบัตรประชาชน');
     await page.waitForTimeout(1000);
   }); */

  /*  test('should validate invalid email formats', async ({ page }) => {
     const invalidEmails = [
       'abc',                // ไม่มี @
       'abc@',               // ไม่มี domain
       '@domain.com',        // ไม่มี username
       'a@b',                // ไม่มี TLD
       'user@@domain.com',   // มี @ สองตัว
       'user..name@mail.com',// .. ซ้ำ
       '.user@mail.com',     // ขึ้นต้นด้วย .
       'user-@mail.com',     // ลงท้ายด้วย -
       'user@mail',          // ไม่มี TLD
       'user@mail.c'         // TLD สั้นกว่า 2 ตัวอักษร
     ];
 
     for (const email of invalidEmails) {
       await page.fill(fieldSelector, email);
       await page.click(loginButton);
       await expect(page.locator(inlineError)).toHaveText('รูปแบบอีเมลไม่ถูกต้อง');
     }
   });
 
   test('should accept valid email formats', async ({ page }) => {
     const validEmails = [
       'user@mail.com',
       'user.name@mail.co.th',
       'user_name@mail.net',
       'user-name@mail.org'
     ];
 
     for (const email of validEmails) {
       await page.fill(fieldSelector, email);
       await page.click(loginButton);
       await expect(page.locator(inlineError)).toBeHidden();
     }
   });
 
   test('should validate ID card format (13 digits)', async ({ page }) => {
     const invalidIds = [
       '123456789012',   // 12 digits
       '12345678901234', // 14 digits
       'abcdefghijklm',  // ตัวอักษร
       '1234567890123'   // จะ fail checksum (สมมุติ)
     ];
 
     for (const id of invalidIds) {
       await page.fill(fieldSelector, id);
       await page.click(loginButton);
       await expect(page.locator(inlineError)).toHaveText('เลขบัตรประชาชนไม่ถูกต้อง');
     }
   });
 
   test('should accept valid ID card format (with checksum)', async ({ page }) => {
     // ตัวอย่างเลขบัตรที่ผ่าน checksum (ตัวอย่างสมมติ)
     const validId = '1101700230701';
 
     await page.fill(fieldSelector, validId);
     await page.click(loginButton);
     await expect(page.locator(inlineError)).toBeHidden();
   }); */
});
