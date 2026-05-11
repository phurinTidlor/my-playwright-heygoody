const { test, expect } = require('@playwright/test');
const { urls } = require('../../helpers/config');
const {
    awaitLoginSuccess,
    awaitCheckMember,
    generateRandomEmail,
} = require('../../helpers/api-helpers');
import { humanFillText } from '../../helpers/orferinfo-form-helpers';

test('non-member: signup ด้วย email ใหม่ + OTP → สมัครสมาชิก', async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto(urls.home);
    await page.waitForLoadState('networkidle');

    // 1. คลิก "เข้าสู่ระบบ/สมัคร" ที่ header
    const headerLoginBtn = page.getByRole('button', { name: 'เข้าสู่ระบบ/สมัคร' });
    await expect(headerLoginBtn).toBeVisible({ timeout: 10000 });
    await headerLoginBtn.click();

    // 2. assert popup เปิด
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    console.log('✓ Popup เปิดแล้ว');

    // 3. คลิก "เข้าสู่ระบบ" ใน popup (สลับไป form กรอก email)
    const modalLoginBtn = dialog.getByRole('button', { name: 'เข้าสู่ระบบ' });
    await expect(modalLoginBtn).toBeVisible({ timeout: 5000 });
    await modalLoginBtn.click();

    // 4. สุ่ม email ใหม่ (ยังไม่เคยสมัคร) แล้วกรอก
    const email = generateRandomEmail();
    console.log('📧 Generated email:', email);

    const emailInput = dialog.getByRole('textbox', { name: /อีเมล/ });
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await humanFillText(emailInput, email, { delay: 60 });

    // 5. กดส่ง + ดัก API check-member → expect is_member === false
    const submitBtn = page.locator('#login-submit-button-id');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });

    const checkBody = await awaitCheckMember(
        page,
        () => submitBtn.click(),
        { isMember: false }
    );
    console.log('✓ Check member — is_member:', checkBody.data.is_member, '(ยังไม่เป็นสมาชิก)');

    // 6. รอ popup "ยังไม่เป็นสมาชิก" แล้วกดต่อเพื่อสร้างบัญชี
    await expect(dialog.getByText(/ยังไม่เป็นสมาชิก/)).toBeVisible({ timeout: 10000 });
    console.log('✓ Popup "ยังไม่เป็นสมาชิก" ปรากฏ');

    // กดปุ่มต่อ — ลองหลายชื่อปุ่มที่อาจมี
    const continueBtn = dialog.getByRole('button', {
        name: /สร้างบัญชี|สมัครสมาชิก|ดำเนินการต่อ|ต่อไป|ยืนยัน|ตกลง/
    }).first();
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

    // 7. รอหน้า OTP โผล่ (text สำหรับสร้างบัญชี)
    await expect(dialog.getByText('กรอกรหัส OTP เพื่อสร้างบัญชี')).toBeVisible({ timeout: 10000 });

    // 8. กรอก OTP "123456"
    const otpInput = dialog.getByRole('textbox').first();
    await expect(otpInput).toBeVisible();
    await otpInput.click();
    await otpInput.fill('');
    await otpInput.pressSequentially('123456', { delay: 100 });

    // ชั้นป้องกันสำหรับ React-controlled input
    await otpInput.evaluate((el, value) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }, '123456');
    await page.waitForTimeout(500);

    // 9. กดยืนยัน + ดัก API signup → expect access_token
    const confirmBtn = page.locator('#confirm-otp-button-id');
    const body = await awaitLoginSuccess(page, () => confirmBtn.click({ force: true }));

    // 10. assert UI: avatar menu ปรากฏ (สมัครสำเร็จ → กลายเป็น member)
    const userMenu = page.locator('#navbar-user-menu-button-id');
    await expect(userMenu).toBeVisible({ timeout: 15000 });

    console.log('✓ Signup pass — สมัครสมาชิกใหม่สำเร็จ');
    console.log('  access_token:', body.data.access_token.slice(0, 30) + '...');
    console.log('  email:', email);

    await page.pause();
});