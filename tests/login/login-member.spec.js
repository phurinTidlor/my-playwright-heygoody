const { test, expect } = require('@playwright/test');
const { urls } = require('../../helpers/config');
const { awaitLoginSuccess } = require('../../helpers/api-helpers');
import { humanFillText } from '../../helpers/orferinfo-form-helpers';

test('login member: เข้าสู่ระบบ ด้วย email + OTP', async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto(urls.home);
    await page.waitForLoadState('networkidle');

    // 1. คลิก "เข้าสู่ระบบ/สมัคร" ที่ header
    const headerLoginBtn = page.getByRole('button', { name: 'เข้าสู่ระบบ/สมัคร' });
    await expect(headerLoginBtn).toBeVisible({ timeout: 10000 });
    await headerLoginBtn.click();

    // 2. assert ว่า popup เปิดสำเร็จ
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    console.log('✓ Popup เข้าสู่ระบบเปิดแล้ว');

    // 3. คลิก "เข้าสู่ระบบ" ใน popup (สลับไป login form)
    const modalLoginBtn = dialog.getByRole('button', { name: 'เข้าสู่ระบบ' });
    await expect(modalLoginBtn).toBeVisible({ timeout: 5000 });
    await modalLoginBtn.click();

    // 4. กรอก email แบบพิมพ์จริง
    const emailInput = dialog.getByRole('textbox', { name: /อีเมล/ });
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await humanFillText(emailInput, 'example002@gmail.com', { delay: 60 });

    // 5. กดปุ่ม "เข้าสู่ระบบ" submit เพื่อส่ง OTP
    const submitBtn = page.locator('#login-submit-button-id');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    // 6. รอหน้า OTP โผล่
    await expect(dialog.getByText('กรอกรหัส OTP เพื่อเข้าสู่ระบบ')).toBeVisible({ timeout: 10000 });

    // 7. กรอก OTP "123456" — focus + pressSequentially + fallback dispatch events
    const otpInput = dialog.getByRole('textbox').first();
    await expect(otpInput).toBeVisible();
    await otpInput.click();
    await otpInput.fill('');
    await otpInput.pressSequentially('123456', { delay: 100 });

    // กัน React-controlled input ไม่ตอบสนอง — dispatch input/change events เผื่อ
    await otpInput.evaluate((el, value) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }, '123456');
    await page.waitForTimeout(500);

    // 8. กดยืนยัน — รอ API success + avatar menu ขึ้น (login success indicator)
    const confirmBtn = page.locator('#confirm-otp-button-id');
    const body = await awaitLoginSuccess(page, () => confirmBtn.click({ force: true }));

    // 9. assert UI: avatar menu ของ user ปรากฏแทนปุ่ม "เข้าสู่ระบบ/สมัคร"
    const userMenu = page.locator('#navbar-user-menu-button-id');
    await expect(userMenu).toBeVisible({ timeout: 15000 });

    console.log('✓ Login pass — access_token:', body.data.access_token.slice(0, 30) + '...');
    console.log('✓ Avatar menu ปรากฏ — login UI สำเร็จ');

    await page.pause();
});