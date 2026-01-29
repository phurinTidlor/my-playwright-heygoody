const { test, expect } = require('@playwright/test');

test.describe('Insurance Quote URL Navigation Tests', () => {

    const baseURL = 'https://securecart.pre.heygoody.com/th/auto-insurance/lt-individual/new/quote';

    // Test data mapping from the table
    const urlTestCases = [
        {
            description: 'New-Quote-longterm individual - Default ยังไม่เลือกประเภทรถ',
            expectedURL: `${baseURL}`,
            testName: 'default_no_car_type'
        },
        {
            description: 'เลือกประเภทรถสันดาป',
            expectedURL: `${baseURL}/car`,
            testName: 'sedan_car_type'
        },
        {
            description: 'เลือกประเภทรถไฟฟ้า',
            expectedURL: `${baseURL}/ev-car`,
            testName: 'electric_car_type'
        },
        {
            description: 'เช็คเบี้ยประกันรถกระบะ 2 ประตู',
            expectedURL: `${baseURL}/pick-up`,
            testName: 'pickup_car_type'
        },
        {
            description: 'เลือกประเภทรถตู้',
            expectedURL: `${baseURL}/van`,
            testName: 'van_car_type'
        }
    ];

    test.beforeEach(async ({ page }) => {
        // Navigate to the starting page
        await page.goto('https://pre.heygoody.com');
        await page.waitForLoadState('networkidle');
    });

    test('should navigate to default quote page', async ({ page }) => {
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');

        expect(page.url()).toBe(baseURL);// Verify we're on the correct default page

        await expect(page.locator('text=ยังไม่เลือกประเภทรถ, text=เลือกประเภทรถ')).toBeVisible();// Verify page content for default state
    });

    test('should navigate to sedan car quote page', async ({ page }) => {
        const expectedURL = `${baseURL}/car`;

        await page.goto(baseURL);

        await page.click('text=รถเก๋ง, text=กระบะ 4 ประตู, text=รถตู้ไม่เกิน 7 ที่นั่ง, [data-car-type="car"]');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toBe(expectedURL); // Verify URL changed to /car
        await expect(page.locator('text=รถเก๋ง, text=กระบะ 4 ประตู, text=รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible(); // Verify page content
    });

    test('should navigate to electric car quote page', async ({ page }) => {
        const expectedURL = `${baseURL}/ev-car`;

        await page.goto(baseURL);

        await page.click('text=รถไฟฟ้า EV ไม่เกิน 7 ที่นั่ง, text=EV, [data-car-type="ev-car"]');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toBe(expectedURL);
        await expect(page.locator('text=รถไฟฟ้า EV ไม่เกิน 7 ที่นั่ง, text=EV')).toBeVisible();
    });

    test('should navigate to pickup truck quote page', async ({ page }) => {
        const expectedURL = `${baseURL}/pick-up`;

        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');

        await page.click('text=รถกระบะ 2 ประตู');
        expect(page.url()).toBe(expectedURL);
        await expect(page.locator('text=รถกระบะ 2 ประตู')).toBeVisible();
        
    });

    test('should navigate to van quote page', async ({ page }) => {
        const expectedURL = `${baseURL}/van`;

        await page.goto(baseURL);

        await page.click('text=รถตู้เกิน 7 ที่นั่ง, [data-car-type="van"]');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toBe(expectedURL);

        await expect(page.locator('text=รถตู้เกิน 7 ที่นั่ง')).toBeVisible();
    });

    // Dynamic test for all URL mappings
    urlTestCases.forEach(({ description, expectedURL, testName }) => {
        test(`should have correct URL for ${testName}`, async ({ page }) => {
            await page.goto(expectedURL);
            await page.waitForLoadState('networkidle');

            expect(page.url()).toBe(expectedURL); // Verify the URL matches exactly

            await expect(page.locator('body')).toBeVisible(); //page loads successfully (no 404 or error)

            await expect(page.locator('text=404, text=Error, text=ไม่พบหน้า')).toHaveCount(0);
        });
    });

    test('should handle URL parameters correctly', async ({ page }) => {
        // Test with query parameters
        const urlWithParams = `${baseURL}/car?brand=toyota&model=camry`;

        await page.goto(urlWithParams);
        await page.waitForLoadState('networkidle');
        // Verify URL includes parameters
        expect(page.url()).toContain('/car');
        expect(page.url()).toContain('brand=toyota');
        expect(page.url()).toContain('model=camry');
    });

    test('should redirect invalid URLs correctly', async ({ page }) => {

        const invalidURL = `${baseURL}/invalid-car-type`;

        await page.goto(invalidURL);
        await page.waitForLoadState('networkidle');
        // Should either redirect to valid URL or show 404
        const currentURL = page.url();
        const isValidRedirect = currentURL.includes(baseURL) && !currentURL.includes('invalid-car-type');
        const is404 = await page.locator('text=404, text=ไม่พบหน้า').count() > 0;

        expect(isValidRedirect || is404).toBe(true);
    });

    test('should maintain URL state during navigation', async ({ page }) => {
        await page.goto(`${baseURL}/car`);
        await page.waitForLoadState('networkidle');

        await page.goBack(); // Navigate to another section and back
        await page.waitForLoadState('networkidle');

        await page.goForward(); // Navigate forward
        await page.waitForLoadState('networkidle');

        expect(page.url()).toBe(`${baseURL}/car`);
    });

    test('should handle deep linking correctly', async ({ page }) => {
        // Test direct access to specific car type pages
        const deepLinkTests = [
            `${baseURL}/car`,
            `${baseURL}/ev-car`,
            `${baseURL}/pick-up`,
            `${baseURL}/van`
        ];

        for (const url of deepLinkTests) {
            await page.goto(url);
            await page.waitForLoadState('networkidle');

            expect(page.url()).toBe(url); // Verify page loads correctly
            await expect(page.locator('body')).toBeVisible();

            await expect(page.locator('text=Error, text=404')).toHaveCount(0);
        }
    });

    test('should handle URL encoding correctly', async ({ page }) => {

        const encodedURL = `${baseURL}/car?search=${encodeURIComponent('รถยนต์')}`;

        await page.goto(encodedURL);
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/car');
        expect(page.url()).toContain('search=');
    });

    test('should validate SSL and security', async ({ page }) => {
        // Verify HTTPS is used
        for (const testCase of urlTestCases) {
            expect(testCase.expectedURL).toMatch(/^https:/);
        }
        // Test secure connection
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');
        // Check for security indicators (varies by browser)
        const isSecure = page.url().startsWith('https://');
        expect(isSecure).toBe(true);
    });

    test('should handle concurrent URL changes', async ({ page }) => {
        await page.goto(baseURL);

        // Simulate rapid navigation
        await page.click('text=รถเก๋ง, [data-car-type="car"]');
        await page.click('text=รถไฟฟ้า, [data-car-type="ev-car"]');
        await page.click('text=รถตู้, [data-car-type="van"]');
        await page.click('text=รถกระบะ, [data-car-type="pick-up"]');

        await page.waitForLoadState('networkidle');

        // Verify final URL state
        expect(page.url()).toBe(`${baseURL}/pick-up`);
    });

    test('should preserve URL structure consistency', async ({ page }) => {
        const urlPattern = /^https:\/\/securecart\.heygoody\.com\/th\/auto-insurance\/lt-individual\/new\/quote(\/[a-z-]+)?$/;

        for (const testCase of urlTestCases) {
            expect(testCase.expectedURL).toMatch(urlPattern);
        }
    });

    test('should handle mobile URL navigation', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto(`${baseURL}/car`);
        await page.waitForLoadState('networkidle');

        expect(page.url()).toBe(`${baseURL}/car`);
        await expect(page.locator('body')).toBeVisible();
    });

    test('should validate URL accessibility', async ({ page }) => {
        const urls = urlTestCases.map(tc => tc.expectedURL);

        for (const url of urls) {
            const response = await page.goto(url);
            expect(response.status()).toBeLessThan(400); // No 4xx or 5xx errors

            await page.waitForLoadState('networkidle');
            expect(page.url()).toBe(url);
        }
    });

    test('should handle URL bookmark functionality', async ({ page }) => {
        await page.goto(`${baseURL}/ev-car`);
        await page.waitForLoadState('networkidle');

        await page.reload();// Reload page to simulate bookmark access
        await page.waitForLoadState('networkidle');

        expect(page.url()).toBe(`${baseURL}/ev-car`);    //Page state is restored correctly
        await expect(page.locator('text=รถไฟฟ้า, text=EV')).toBeVisible();
    });

});