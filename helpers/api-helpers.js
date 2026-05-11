/**
 * Helper สำหรับดัก/assert API response ของ heygoody
 */

const { expect } = require('@playwright/test');

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

module.exports = {
    awaitLoginSuccess,
    awaitCheckMember,
    generateRandomEmail,
};