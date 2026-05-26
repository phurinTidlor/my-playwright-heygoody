/**
 * Helper สำหรับดัก/assert API response ของ heygoody
 */

const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * รอ API response ของ login (OTP verify) แล้ว assert ว่าสำเร็จ
 * @param {import('@playwright/test').Page} page
 * @param {() => Promise<void>} triggerAction - action ที่จะ trigger request เช่น click ปุ่มยืนยัน
 * @param {{ timeout?: number }} options
 * @returns {Promise<object>} response body
 */
async function awaitLoginSuccess(page, triggerAction, { timeout = 15000 } = {}) {
    const [response] = await Promise.all([
        page.waitForResponse(async (r) => {
            if (r.request().method() !== 'POST') return false;
            try {
                const body = await r.json();
                return body?.resp_code === 'HG200001' && !!body?.data?.access_token;
            } catch {
                return false;
            }
        }, { timeout }),
        triggerAction(),
    ]);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.resp_code).toBe('HG200001');
    expect(body.message).toBe('success');
    expect(body.data).toHaveProperty('access_token');
    expect(body.data).toHaveProperty('refresh_token');
    expect(body.trace_id).toMatch(/^req_/);

    return body;
}

/**
 * รอ API response ของ check-member (ส่งหลังกรอก email) แล้ว assert เป็น/ไม่เป็นสมาชิก
 * @param {import('@playwright/test').Page} page
 * @param {() => Promise<void>} triggerAction
 * @param {{ isMember?: boolean, timeout?: number }} options - isMember=true → expect เป็นสมาชิก, false → ไม่ใช่
 * @returns {Promise<object>} response body
 */
async function awaitCheckMember(page, triggerAction, { isMember, timeout = 15000 } = {}) {
    const [response] = await Promise.all([
        page.waitForResponse(async (r) => {
            if (r.request().method() !== 'POST') return false;
            try {
                const body = await r.json();
                return body?.resp_code === 'HG200001'
                    && typeof body?.data?.is_member === 'boolean';
            } catch {
                return false;
            }
        }, { timeout }),
        triggerAction(),
    ]);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.resp_code).toBe('HG200001');
    expect(body.message).toBe('success');

    if (typeof isMember === 'boolean') {
        expect(body.data.is_member).toBe(isMember);
    }

    return body;
}

/** สุ่ม email สำหรับ test signup non-member */
function generateRandomEmail(prefix = 'autotest') {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}_${ts}_${rand}@gmail.com`;
}

/**
 * Bypass OTP — รอ OTP input + กรอกค่า (default "123456") + (optional) คลิกยืนยัน + ดัก response
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} options
 * @param {string} [options.otp='123456']        - ค่า OTP ที่จะกรอก
 * @param {boolean} [options.autoConfirm=true]   - คลิกปุ่มยืนยันให้อัตโนมัติ
 * @param {boolean} [options.expectLogin=false]  - ดัก API login success หลังคลิกยืนยัน
 * @param {number}  [options.timeout=10000]      - timeout รอ OTP input ปรากฏ
 * @returns {Promise<object|undefined>} login response body (ถ้า expectLogin=true)
 */
async function bypassOTP(page, options = {}) {
    const {
        otp = '123456',
        autoConfirm = true,
        expectLogin = false,
        timeout = 10000,
    } = options;

    const dialog = page.getByRole('dialog');

    // 1. หา OTP input — textbox แรกใน dialog
    const otpInput = dialog.getByRole('textbox').first();
    await expect(otpInput).toBeVisible({ timeout });

    // 2. กรอก OTP — 3 ชั้นป้องกัน
    await otpInput.click();
    await otpInput.fill('');
    await otpInput.pressSequentially(otp, { delay: 100 });

    // ชั้น 3: dispatch native input/change events (กัน React-controlled ไม่ตอบสนอง)
    await otpInput.evaluate((el, value) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }, otp);
    await page.waitForTimeout(500);

    if (!autoConfirm) return;

    // 3. คลิกยืนยัน — แต่ระบบอาจ auto-submit เมื่อกรอก OTP ครบ 6 หลัก
    //    ถ้าปุ่ม/dialog หายไปแล้ว ถือว่าสำเร็จ ไม่ต้องคลิก
    const confirmBtn = page.locator('#confirm-otp-button-id');
    const stillVisible = await confirmBtn.isVisible().catch(() => false);

    if (expectLogin) {
        if (stillVisible) {
            return await awaitLoginSuccess(page, () => confirmBtn.click({ force: true }));
        }
        // auto-submit แล้ว — รอ login response แบบไม่ trigger เพิ่ม
        return await awaitLoginSuccess(page, async () => { });
    }

    if (stillVisible) {
        await confirmBtn.click({ force: true });
    }
}

/**
 * หน้า summary — ติ๊กยอมรับเงื่อนไข + กด "ชำระเลย" + ดึง order_no จาก API response
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ timeout?: number }} options
 * @returns {Promise<{ orderNo: string, body: object }>} order_no + response body เต็ม
 */
async function acceptConsentAndPay(page, { timeout = 20000 } = {}) {
    // 1. ติ๊ก "ยอมรับทั้งหมด" — checkbox จะ propagate ไปยังรายการย่อยทั้งหมด
    const acceptAll = page.locator('#summary-consent-accept-all-checkbox-id');
    await expect(acceptAll).toBeVisible({ timeout: 10000 });
    await acceptAll.click();
    await expect(acceptAll).toHaveAttribute('data-state', 'checked');

    // 2. กด "ชำระเลย" + ดัก API response ที่มี order_no
    const payBtn = page.locator('#pay-now-button-id');
    await expect(payBtn).toBeEnabled({ timeout: 10000 });

    // หน่วงเวลา 10 วินาที ก่อนกด "ชำระเลย"
    await page.waitForTimeout(10000);

    // capture ภาพหน้า summary เพื่อใช้ตรวจสอบข้อมูล (full page)
    const screenshotsDir = path.resolve(process.cwd(), 'test-results', 'summary-screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotsDir, `summary-${ts}.png`);

    // ปิด position: sticky/fixed ชั่วคราว กัน header ลอยกลางรูปตอนถ่าย fullPage
    const styleTag = await page.addStyleTag({
        content: `
            *, *::before, *::after {
                position: static !important;
                transition: none !important;
                animation: none !important;
            }
        `,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('✓ Summary screenshot saved →', screenshotPath);

    // เอา style override ออก กลับเป็น layout ปกติก่อนกดชำระเลย
    await styleTag.evaluate((el) => el.remove());
    await page.waitForTimeout(200);

    const [response] = await Promise.all([
        page.waitForResponse(async (r) => {
            if (r.request().method() !== 'POST') return false;
            if (!/order/i.test(r.url())) return false;
            try {
                const body = await r.json();
                return body?.resp_code === 'HG200001' && !!body?.data?.order_no;
            } catch {
                return false;
            }
        }, { timeout }),
        payBtn.click(),
    ]);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.resp_code).toBe('HG200001');
    expect(body.data).toHaveProperty('order_no');

    const orderNo = body.data.order_no;
    console.log('✓ Order created — order_no:', orderNo);

    return { orderNo, body };
}

/**
 * หน้าเลือกวิธีชำระเงิน — เลือก "ชำระเต็มผ่าน QR Code" + หน่วง 5 วิ + กด "ชำระเงิน"
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ method?: string, waitBeforePay?: number, timeout?: number }} options
 *   - method: ข้อความระบุวิธีชำระเงิน (default: 'ชำระเต็มผ่าน QR Code')
 *   - waitBeforePay: หน่วงเวลาก่อนกดปุ่ม (ms, default 5000)
 */
async function selectPaymentMethodAndConfirm(page, options = {}) {
    const {
        method = 'ชำระเต็มผ่าน QR Code',
        waitBeforePay = 5000,
        timeout = 15000,
    } = options;

    // 1. เลือกวิธีชำระเงิน — div role=button ที่มี text ระบุวิธี
    const paymentOption = page.getByRole('button').filter({ hasText: method }).first();
    await expect(paymentOption).toBeVisible({ timeout });
    await paymentOption.click();

    // ยืนยันว่า checkbox ภายใน option ถูกเลือก
    const optionCheckbox = paymentOption.locator('button[role="checkbox"]');
    await expect(optionCheckbox).toHaveAttribute('data-state', 'checked', { timeout: 5000 });

    // 2. หน่วงเวลาก่อนกด "ชำระเงิน"
    await page.waitForTimeout(waitBeforePay);

    // 3. กด "ชำระเงิน"
    const payBtn = page.locator('#pay-now-button-id');
    await expect(payBtn).toBeEnabled({ timeout: 10000 });
    await payBtn.click();
}

/**
 * เปิดหน้า webhook payment (tab ใหม่) → กรอก order_no ลง #referenceOrderNo → กด "ส่งข้อมูล"
 * ใช้ trigger payment callback หลัง test สร้าง order เสร็จ
 *
 * @param {import('@playwright/test').Page} page - page ปัจจุบัน (ใช้ context เดิมเปิด tab ใหม่)
 * @param {string} orderNo - order_no ที่ได้จาก acceptConsentAndPay
 * @param {object} [options]
 * @param {string} [options.webhookUrl='http://webhookpayment.kube-uat.ntl.co.th/index']
 * @param {boolean} [options.submit=true] - กดปุ่ม "ส่งข้อมูล" ให้อัตโนมัติ
 * @param {boolean} [options.keepOpen=false] - ไม่ปิด tab หลังเสร็จ (ไว้ debug)
 * @param {boolean} [options.pause=false] - หยุด (page.pause) ที่หน้า webhook เพื่อตรวจผล (บังคับ keepOpen)
 * @param {number} [options.timeout=15000]
 * @returns {Promise<import('@playwright/test').Page>} webhook page (ถ้า keepOpen/pause จะยังเปิดอยู่)
 */
async function triggerPaymentWebhook(page, orderNo, options = {}) {
    const {
        webhookUrl = 'http://webhookpayment.kube-uat.ntl.co.th/index',
        submit = true,
        pause = false,
        timeout = 15000,
    } = options;
    // pause บังคับให้ keepOpen เสมอ (ไม่งั้น pause หน้าที่ปิดไปแล้วไม่ได้)
    const keepOpen = options.keepOpen ?? pause;

    if (!orderNo) {
        throw new Error('triggerPaymentWebhook: ต้องส่ง orderNo (ได้จาก acceptConsentAndPay)');
    }

    // 1. เปิด tab ใหม่ใน context เดิม (คงหน้า qrcode ของ heygoody ไว้)
    const webhookPage = await page.context().newPage();
    await webhookPage.goto(webhookUrl, { waitUntil: 'domcontentloaded', timeout });
    await webhookPage.bringToFront();

    // 2. กรอก order_no ลงช่อง ReferenceOrderNo
    const refInput = webhookPage.locator('#referenceOrderNo');
    await expect(refInput).toBeVisible({ timeout });
    await refInput.fill(orderNo);
    await expect(refInput).toHaveValue(orderNo);
    console.log('✓ Webhook ReferenceOrderNo filled:', orderNo);

    // 3. กดปุ่ม "ส่งข้อมูล" (submit)
    if (submit) {
        const submitBtn = webhookPage.getByRole('button', { name: /ส่งข้อมูล/ })
            .or(webhookPage.locator('button[type="submit"]'))
            .first();
        await expect(submitBtn).toBeVisible({ timeout });
        await submitBtn.click();
        await webhookPage.waitForLoadState('networkidle').catch(() => { });
        console.log('✓ Webhook submitted for order_no:', orderNo);
    }

    // 4. pause ที่หน้า webhook เพื่อตรวจผล (ต้องรันแบบ headed)
    if (pause) {
        await webhookPage.pause();
    }

    if (!keepOpen) {
        await webhookPage.close();
    }
    return webhookPage;
}

module.exports = {
    awaitLoginSuccess,
    awaitCheckMember,
    generateRandomEmail,
    bypassOTP,
    acceptConsentAndPay,
    selectPaymentMethodAndConfirm,
    triggerPaymentWebhook,
};