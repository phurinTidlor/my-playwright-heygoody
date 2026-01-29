import { test, expect } from '@playwright/test';

const validEmails = [
    "test123@gmail.com",
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
    "user@domain-.com",
    "user@domain..com"
];

const API_URL =
    "https://dev-heygoody-api-selling.areetech.io/v3/selling/member/hg-check-member";

test.describe("Email validation - hg-check-member API", () => {

    // VALID EMAIL TESTS (ตรวจแค่ status + message)

    for (const email of validEmails) {
        test(`VALID EMAIL → ${email}`, async ({ request }) => {

            const response = await request.post(API_URL, {
                headers: { "Content-Type": "application/json" },
                data: {
                    email,
                    verify_type: "email"
                }
            });

            const body = await response.json();
            console.log("VALID RESPONSE:", body);

            // ✔ Check only status = 200
            /*  expect(response.status()).toBe(200);
       
             // ✔ Check only message = success
             expect(body.message).toBe("success"); */

            expect([200, 201]).toContain(response.status());
            expect(body.message).toBe("success");

        });
    }

    // INVALID EMAIL TESTS
    for (const email of invalidEmails) {
        test(`INVALID EMAIL → ${email}`, async ({ request }) => {

            const response = await request.post(API_URL, {
                headers: { "Content-Type": "application/json" },
                data: {
                    email,
                    verify_type: "email"
                }
            });

            const body = await response.json();

            // แสดง response เต็ม
            console.log("INVALID EMAIL RESPONSE:", body);

            // ถ้า response.message = "success" = ผิดปกติ
            expect(body.message === "success").toBeFalsy();
        });
    }
});



