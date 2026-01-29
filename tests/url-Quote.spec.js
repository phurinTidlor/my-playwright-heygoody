const { test, expect, devices } = require('@playwright/test');


// ตั้งค่า device เป็น iPhone 12
/* test.use({
  ...devices['iPhone 12'],
  viewport: { width: 390, height: 844 },
  userAgent: devices['iPhone 12'].userAgent,
}); */


test.describe('Insurance Quote URL Navigation Tests', () => {

  const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

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
      description: 'เลือกประเภทรถกระบะ 2 ประตู',
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
    await page.goto('https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to default quote page', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(baseURL);// Verify we're on the correct default page

    //await expect(page.locator('text=เช็คเบี้ยประกันรถยนต์ชั้นนำ, text=เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();// Verify page content for default state
    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();

  });

  test('should navigate to sedan car quote page CAR', async ({ page }) => {
    const expectedURL = `${baseURL}/car`;

    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await page.locator('text=รถเก๋ง, กระบะ 4 ประตู').click();
    await expect(page).toHaveURL(expectedURL);
    await expect(page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible();
  });

  test('should handle mobile URL navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${baseURL}/car`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(`${baseURL}/car`);
    await expect(page.locator('body')).toBeVisible();
  });


  test('should navigate to default quote page (mobile)', async ({ page }) => {
    expect(page.url()).toBe(baseURL);
    await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
    await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
  });

  test('should navigate to sedan car quote page (mobile)', async ({ page }) => {
    const expectedURL = `${baseURL}/car`;

    // คลิก text สำหรับรถเก๋ง
    await page.locator('text=รถเก๋ง, กระบะ 4 ประตู').click();

    // รอให้ URL เปลี่ยน
    await expect(page).toHaveURL(expectedURL);

    // ตรวจสอบว่าข้อความแสดงผล
    await expect(page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible();
  });

  test('should navigate to electric car quote page EV', async ({ page }) => {
    const expectedURL = `${baseURL}/ev-car`;

    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await page.locator('text=รถไฟฟ้า EV ไม่เกิน 7 ที่นั่ง').click();
    await expect(page).toHaveURL(expectedURL);
    await expect(page.getByText('รถไฟฟ้า EV ไม่เกิน 7 ที่นั่ง')).toBeVisible();
  });

  test('should navigate to pickup truck quote page', async ({ page }) => {
    const expectedURL = `${baseURL}/pick-up`;

    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await page.getByText('รถกระบะ 2 ประตู', { exact: true }).click();
    await expect(page).toHaveURL(expectedURL);

    // ตรวจสอบ Heading โดยเจาะจงด้วย role
    await expect(
      page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถกระบะ 2 ประตู' })
    ).toBeVisible();

  });

  test('should navigate to van quote page', async ({ page }) => {
    const expectedURL = `${baseURL}/van`;

    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    await page.locator('text=รถตู้เกิน 7 ที่นั่ง').click();
    await expect(page).toHaveURL(expectedURL);
    await expect(page.getByText('รถตู้เกิน 7 ที่นั่ง')).toBeVisible();
  });

  // Dynamic test for all URL mappings
  /* urlTestCases.forEach(({ description, expectedURL, testName }) => {
    test(`should have correct URL for ${testName}`, async ({ page }) => {
      await page.goto(expectedURL);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toBe(expectedURL); // Verify the URL matches exactly

      await expect(page.locator('body')).toBeVisible(); //page loads successfully (no 404 or error)

      await expect(page.locator('text=404, text=Error, text=ไม่พบหน้า')).toHaveCount(0);
    });
  }); */


  /* test('should redirect invalid URLs correctly', async ({ page }) => {

    const invalidURL = `${baseURL}/invalid-car-type`;

    await page.goto(invalidURL);
    await page.waitForLoadState('networkidle');
    // Should either redirect to valid URL or show 404
    const currentURL = page.url();
    const isValidRedirect = currentURL.includes(baseURL) && !currentURL.includes('invalid-car-type');
    const is404 = await page.locator('text=404, text=ไม่พบหน้า').count() > 0;

    expect(isValidRedirect || is404).toBe(true);
  }); */

  test('should maintain URL state during navigation CAR', async ({ page }) => {
    await page.goto(`${baseURL}/car`);
    await page.waitForLoadState('networkidle');

    await page.goBack(); // Navigate to another section and back
    await page.waitForLoadState('networkidle');

    await page.goForward(); // Navigate forward
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(`${baseURL}/car`);
  });

  test('should maintain URL state during navigation EV', async ({ page }) => {
    await page.goto(`${baseURL}/ev-car`);
    await page.waitForLoadState('networkidle');

    await page.goBack(); // Navigate to another section and back
    await page.waitForLoadState('networkidle');

    await page.goForward(); // Navigate forward
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(`${baseURL}/ev-car`);
  });

  test('should maintain URL state during navigation Pick up', async ({ page }) => {
    await page.goto(`${baseURL}/pick-up`);
    await page.waitForLoadState('networkidle');

    await page.goBack(); // Navigate to another section and back
    await page.waitForLoadState('networkidle');

    await page.goForward(); // Navigate forward
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(`${baseURL}/pick-up`);
  });

  test('should maintain URL state during navigation Van', async ({ page }) => {
    await page.goto(`${baseURL}/van`);
    await page.waitForLoadState('networkidle');

    await page.goBack(); // Navigate to another section and back
    await page.waitForLoadState('networkidle');

    await page.goForward(); // Navigate forward
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(`${baseURL}/van`);
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

  /* test('should handle URL encoding correctly', async ({ page }) => {

    const encodedURL = `${baseURL}/car?search=${encodeURIComponent('รถยนต์')}`;

    await page.goto(encodedURL);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/car');
    expect(page.url()).toContain('search=');
  }); */

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

    const buttonMap = [
      { id: '#ltIndividualQuoteCarTypeLabelId0', url: `${baseURL}/car` },
      { id: '#ltIndividualQuoteCarTypeLabelId1', url: `${baseURL}/ev-car` },
      { id: '#ltIndividualQuoteCarTypeLabelId2', url: `${baseURL}/pick-up` },
      { id: '#ltIndividualQuoteCarTypeLabelId3', url: `${baseURL}/van` },
    ];

    for (const { id, url } of buttonMap) {
      await Promise.all([
        page.waitForURL(url),
        page.locator(id).click(),
      ]);
      await expect(page.locator('body')).toBeVisible();
    }
    expect(page.url()).toBe(`${baseURL}/van`);
  });

  test('should preserve URL structure consistency', async () => {
    // ยืดหยุ่นสำหรับ dev / prod / staging
    const urlPattern = /^https:\/\/(?:dev-heygoody\.areetech\.io|securecart\.heygoody\.com)\/th\/auto-insurance\/lt-individual\/new\/quote(\/[a-z-]+)?$/;

    for (const testCase of urlTestCases) {
      expect(testCase.expectedURL).toMatch(urlPattern);
    }
  });


  /* test('should handle mobile URL navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${baseURL}/car`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(`${baseURL}/car`);
    await expect(page.locator('body')).toBeVisible();
  }); */

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

    await page.reload(); // simulate bookmark access
    await page.waitForLoadState('networkidle');

    // รอ URL ถูกต้อง
    expect(page.url()).toBe(`${baseURL}/ev-car`);

    // รอ element ปรากฏแบบ dynamic
    const evCarLocator = page.locator('text="รถไฟฟ้า EV ไม่เกิน 7 ที่นั่ง"');
    await expect(evCarLocator).toBeVisible({ timeout: 10000 }); // เพิ่ม timeout
  });

});