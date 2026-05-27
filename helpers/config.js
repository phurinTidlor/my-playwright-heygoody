/**
 * Test environment config
 *
 * เลือก env ผ่าน env var TEST_ENV (default = uat)
 *   TEST_ENV=dev npx playwright test
 *   TEST_ENV=uat npx playwright test
 *   TEST_ENV=pre npx playwright test
 */

const ENV = process.env.TEST_ENV || 'dev';

const HOSTS = {
    dev: 'https://dev-heygoody.areetech.io',
    uat: 'https://uat-heygoody.areetech.io',
    pre: 'https://securecart.pre.heygoody.com',
};

if (!HOSTS[ENV]) {
    throw new Error(
        `Unknown TEST_ENV "${ENV}". Available: ${Object.keys(HOSTS).join(', ')}`
    );
}

const HOST = HOSTS[ENV];

const urls = {
    home: `${HOST}/th`,

    // Long-term individual
    ltIndividualQuote: `${HOST}/th/auto-insurance/lt-individual/new/quote`,
    ltIndividualPlan: `${HOST}/th/auto-insurance/lt-individual/new/plan`,

    // Long-term juristic
    ltJuristicQuote: `${HOST}/th/auto-insurance/lt-juristic/new/quote`,
    ltJuristicCar: `${HOST}/th/auto-insurance/lt-juristic/new/quote/car`,

    // Short-term individual
    stIndividualQuote: `${HOST}/th/auto-insurance/st-individual/new/quote`,

    // Affiliate (LT) — ส่งพารามิเตอร์ qs (string) เข้าไปได้
    affiliateLTCar: (qs = 'sale_channel=areegator&sale_code=A123456789&sale_action=share') =>
        `${HOST}/th/auto-insurance/lt-individual/new/quote/car?${qs}`,
    affiliateLTEvCar: (qs = 'sale_channel=areegator&sale_code=A123456789&sale_action=share') =>
        `${HOST}/th/auto-insurance/lt-individual/new/quote/ev-car?${qs}`,
};

console.log(`[config] TEST_ENV=${ENV} HOST=${HOST}`);

module.exports = {
    ENV,
    HOST,
    urls,
};