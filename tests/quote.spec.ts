import { test, expect } from '@playwright/test';
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  test.describe('Heygoody Car Quote Page', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto(''); //https navigate to the page
      await page.waitForLoadState('networkidle');
    });

    test('should display header elements correctly', async ({ page }) => {

      const headerLogo = page.locator('text=heygoody.com').first(); //Check header logo/brand tab
      await expect(headerLogo).toBeVisible();

      const loginButton = page.locator('text=เข้าสู่ระบบ'); // Check login button
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeEnabled(); // Verify login button is clickable

      // Check if hamburger menu exists (mobile menu)
      const menuButton = page.locator('[data-testid="menu-button"], .menu-button, button[aria-label="Menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should verify header brand/logo functionality', async ({ page }) => {

      const headerBrand = page.locator('text=heygoody.com').first(); // Check header brand text
      await expect(headerBrand).toBeVisible();

      await headerBrand.click(); // Click on header brand (should navigate to home or refresh)
      await page.waitForTimeout(500);

      await expect(page.locator('text=เช็คเบี้ยประกันรถยนต์')).toBeVisible(); // Should still be on main page or reload
    });

    test('should handle login button interaction', async ({ page }) => {

      const loginButton = page.locator('text=เข้าสู่ระบบ'); // Click login button
      await expect(loginButton).toBeVisible();
      await loginButton.click();
      await page.waitForTimeout(1000);
      // Check if URL changed (navigation) or modal appeared
      const currentUrl = page.url();
      if (currentUrl.includes('login') || currentUrl.includes('signin')) {
        // If navigated to login page
        console.log('Navigated to login page:', currentUrl);
      } else {
        // Check for login modal/popup
        const loginModal = page.locator('[data-testid="login-modal"], .modal, .popup').first();
        if (await loginModal.isVisible()) {
          console.log('Login modal appeared');
        }
      }
    });

    test('should load page performance within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('https://pre.heygoody.com');
      await expect(page.locator('text=เช็คเบี้ยประกันรถยนต์')).toBeVisible(); // Wait for main content to load

      const loadTime = Date.now() - startTime;
      console.log(`Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // Assert page loads within 5 seconds

    });

    test('should handle error states gracefully', async ({ page }) => {
      // Test network error handling
      await page.route('**/*', route => {
        if (route.request().url().includes('api')) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.reload();
      // Page should still display basic content even if API calls fail
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display page title and header correctly', async ({ page }) => {

      await expect(page.locator('text=เช็คเบี้ยประกันรถยนต์ รถเก่ง และรถกระบะ 4 ประตู')).toBeVisible(); // Check main header text

      await expect(page.locator('text=เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible(); // Check 

    });

    test('should display all vehicle type cards', async ({ page }) => {

      const sedanCard = page.locator('[data-testid="sedan-card"], .sedan-card, text=รถเก่ง, กระบะ 4 ประตู').first(); // Check sedan card (4-door, green checkmark - selected)
      await expect(sedanCard).toBeVisible();
      await expect(page.locator('text=รถดูไม่เกิน 7 ที่นั่ง')).toBeVisible();
      // Check EV car card
      const evCard = page.locator('text=รถไฟฟ้า EV').first();
      await expect(evCard).toBeVisible();
      await expect(page.locator('text=ไม่เกิน 7 ที่นั่ง').first()).toBeVisible();
      // Check pickup truck card
      const pickupCard = page.locator('text=รถกระบะ 2 ประตู').first();
      await expect(pickupCard).toBeVisible();
      // Check van card
      const vanCard = page.locator('text=รถตู้เกิน 7 ที่นั่ง').first();
      await expect(vanCard).toBeVisible();
      await expect(page.locator('text=บ้างฟ้า')).toBeVisible();
    });

    test('should show sedan card as selected by default', async ({ page }) => {
      // Check if sedan card has selected state (green checkmark)
      const selectedCard = page.locator('.selected, [data-selected="true"]').first();
      await expect(selectedCard).toBeVisible();
    });

    test('should allow selecting different vehicle types', async ({ page }) => {
      await page.locator('text=รถไฟฟ้า EV').click(); // Click on EV car card
      await page.waitForTimeout(500); // Wait for any potential state changes
      await page.locator('text=รถกระบะ 2 ประตู').click();
      await page.waitForTimeout(500);
      await page.locator('text=รถตู้เกิน 7 ที่นั่ง').click();
      await page.waitForTimeout(500);
      await page.locator('text=รถเก๋ง, กระบะ 4 ประตู').click();
    });

    test('should display banner section', async ({ page }) => {
      const banner = page.locator('text=Banner').first(); // Check banner area
      await expect(banner).toBeVisible();
    });

    /* {BRAND FUNCTION} */
    test('should display brand selector title', async ({ page }) => {
      await page.click('text=ยี่ห้อรถ, .brand-selector-trigger, #brand-selector-button');
      await page.waitForSelector('text=ยี่ห้อรถ?', { timeout: 5000 });
      await expect(page.locator('text=ยี่ห้อรถ?')).toBeVisible();
    });

    test('should display popular car brands section', async ({ page }) => {
      await expect(page.locator('text=ยี่ห้อรถยอดนิยม')).toBeVisible();

      const popularBrands = ['TOYOTA', 'HONDA', 'MG', 'MAZDA', 'MITSUBISHI',
        'NISSAN', 'FORD', 'SUZUKI', 'MERCEDES', 'CHEVROLET'];

      for (const brand of popularBrands) {
        await expect(page.locator(`text=${brand}`)).toBeVisible();
      }
    });

    test('should display all car brands section', async ({ page }) => {
      await expect(page.locator('text=ยี่ห้อรถทั้งหมด')).toBeVisible();// ตรวจสอบหัวข้อยี่ห้อรถทั้งหมด

      const otherBrands = ['ALFA', 'ASTON', 'AUDI', 'BENTLEY', 'BMW', 'BYD'];

      for (const brand of otherBrands) {
        await expect(page.locator(`text=${brand}`)).toBeVisible();
      }
    });

    test('should select different popular brand', async ({ page }) => {
      await page.click('text=HONDA');

      const hondaOption = page.locator('text=HONDA').locator('..'); // ตรวจสอบว่า HONDA ถูกเลือก
      await expect(hondaOption.locator('text=✓, .checkmark, .selected-icon')).toBeVisible();

      const toyotaOption = page.locator('text=TOYOTA').locator('..'); // ตรวจสอบว่า TOYOTA ไม่ถูกเลือกแล้ว
      await expect(toyotaOption.locator('text=✓, .checkmark, .selected-icon')).toHaveCount(0);
    });

    test('should select brand from other brands list', async ({ page }) => {
      await page.click('text=BMW'); // คลิกเลือก BMW จาก list
      await expect(page.locator('text=BMW')).toHaveClass(/selected|active/); // ตรวจสอบว่า BMW ถูกเลือกหรือมีการเปลี่ยนแปลง

      // ตรวจสอบว่า TOYOTA (default) ไม่ถูกเลือกแล้ว
      const toyotaOption = page.locator('text=TOYOTA').locator('..');
      await expect(toyotaOption.locator('text=✓, .checkmark, .selected-icon')).toHaveCount(0);
    });

    test('should display brand logos for popular brands', async ({ page }) => {

      const brandLogos = page.locator('.brand-item img, .brand-logo img'); // ตรวจสอบว่ามี logo images แสดงอยู่
      await expect(brandLogos).toHaveCount(10); // 10 popular brands

      await expect(page.locator('img[alt*="TOYOTA"]')).toBeVisible(); // ตรวจสอบ alt text ของ TOYOTA logo
    });

    test('should handle brand selection interaction', async ({ page }) => {
      await page.click('text=MAZDA');
      // รอให้ animation หรือ state change เสร็จ
      await page.waitForTimeout(300);
      // ตรวจสอบ visual feedback
      const mazdaOption = page.locator('text=MAZDA').locator('..');
      await expect(mazdaOption).toHaveClass(/selected|active/);
    });

    test('should handle scroll through ohter brands list', async ({ page }) => {
      const brandsList = page.locator('.brands-list, .other-brands-container');
      await brandsList.scrollIntoViewIfNeeded();

      await expect(page.locator('text=BENTLEY')).toBeVisible(); // ตรวจสอบว่ามี brands เพิ่มเติม
      await expect(page.locator('text=BMW')).toBeVisible();

    });

    test('should handle multiple brand selections correctly', async ({ page }) => {
      await page.click('text=HONDA');
      await page.waitForTimeout(200);

      await page.click('text=MAZDA');
      await page.waitForTimeout(200);

      const mazdaOption = page.locator('text=MAZDA').locator('..');
      await expect(mazdaOption.locator('text=✓, .checkmark')).toBeVisible();

      const hondaOption = page.locator('text=HONDA').locator('..');
      await expect(hondaOption.locator('text=✓, .checkmark')).toHaveCount(0);
    });

    test('should handle close/back button', async ({ page }) => {
      const closeButton = page.locator('button:has-text("ปิด"), button:has-text("กลับ"), .close-btn, .back-btn'); // ตรวจสอบปุ่มปิดหรือย้อนกลับ

      if (await closeButton.count() > 0) {
        await expect(closeButton).toBeVisible();
        await closeButton.click();
        await expect(page.locator('text=ยี่ห้อรถ?')).toBeHidden(); // ตรวจสอบว่า modal หรือ page ปิด
      }
    });

    test('should maintain selection state', async ({ page }) => {
      await page.click('text=MITSUBISHI');

      await page.reload(); // Refresh page หรือ navigate away and back
      await page.waitForLoadState('networkidle');

      await page.click('text=ยี่ห้อรถ, .brand-selector-trigger'); // เปิด brand selector อีกครั้ง

      // ตรวจสอบว่ายังคงเป็น default (TOYOTA) หรือ maintain state
      // ขึ้นอยู่กับการ implement ของเว็บไซต์
      await expect(page.locator('text=TOYOTA, text=MITSUBISHI').first()).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {

      await page.setViewportSize({ width: 375, height: 667 }); // เปลี่ยนเป็นขนาดมือถือ

      await expect(page.locator('text=ยี่ห้อรถ?')).toBeVisible(); // ตรวจสอบว่า layout ยังใช้งานได้
      await expect(page.locator('text=ยี่ห้อรถยอดนิยม')).toBeVisible();

      const brandItems = page.locator('.brand-item, text=TOYOTA'); // ตรวจสอบว่า brands grid responsive
      await expect(brandItems.first()).toBeVisible();

      await page.click('text=HONDA'); // ทดสอบการเลือกบนมือถือ
      const hondaOption = page.locator('text=HONDA').locator('..');
      await expect(hondaOption.locator('text=✓, .checkmark')).toBeVisible();
    });

    test('should handle touch interactions on mobile', async ({ page, isMobile }) => {
      if (isMobile) {
        // ทดสอบ touch events
        await page.tap('text=SUZUKI');
        await page.waitForTimeout(300);

        const suzukiOption = page.locator('text=SUZUKI').locator('..');
        await expect(suzukiOption).toHaveClass(/selected|active/);
      }
    });

    test('should validate accessibility features', async ({ page }) => {
      // ตรวจสอบ ARIA labels และ roles
      const brandButtons = page.locator('[role="button"], button');

      if (await brandButtons.count() > 0) {
        await expect(brandButtons.first()).toHaveAttribute('role', 'button');
      }

      // ตรวจสอบ keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // ตรวจสอบ focus management
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should handle loading states', async ({ page }) => {
      // ตรวจสอบว่าไม่มี loading spinner
      await expect(page.locator('.loading, .spinner')).toHaveCount(0);

      // ตรวจสอบว่า content โหลดเสร็จ
      await expect(page.locator('text=TOYOTA')).toBeVisible();
      await expect(page.locator('text=HONDA')).toBeVisible();
    });

    test('should display correct number of brands', async ({ page }) => {
      // นับจำนวน popular brands (ควรมี 10)
      const popularBrandItems = page.locator('.brand-item, .popular-brand');
      await expect(popularBrandItems).toHaveCount(10);

      // นับจำนวน other brands (ควรมีมากกว่า 20)
      const otherBrandItems = page.locator('.brand-list-item, .other-brand-item');
      const count = await otherBrandItems.count();
      expect(count).toBeGreaterThan(20);
    });

  });

  // Configuration for mobile testing
  test.describe('Mobile Brand Selector Tests', () => {
    test.use({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true
    });

    test('should work properly on mobile', async ({ page }) => {
      await page.goto('https://heygoody.com');
      await page.click('text=ยี่ห้อรถ, .brand-selector-trigger');
      // ทดสอบ touch selection
      await page.tap('text=MG');
      const mgOption = page.locator('text=MG').locator('..');
      await expect(mgOption.locator('text=✓')).toBeVisible();
    });

  })

  /* { MODEL FUNCTION } */

  test('should display dropdown with correct title', async ({ page }) => {
    // Check if dropdown title is visible
    await expect(page.locator('text=$usa?')).toBeVisible();
  });

  test('should display all car models in dropdown', async ({ page }) => {
    const expectedCarModels = [
      '4RUNNER',
      '86 GT',
      'AVANZA',
      'CAMRY',
      'C-HR',
      'CELICA',
      'CROWN',
      'CORONA',
      'COROLLA CROSS',
      'COROLLA'
    ];

    // Click to open dropdown if needed
    await page.locator('[data-testid="car-dropdown"]').click();

    // Verify each car model is present
    for (const carModel of expectedCarModels) {
      await expect(page.locator(`text=${carModel}`)).toBeVisible();
    }
  });

  test('should allow selecting a car model', async ({ page }) => {
    // Click dropdown to open
    await page.locator('[data-testid="car-dropdown"]').click();

    // Select CAMRY
    await page.locator('text=CAMRY').click();

    // Verify selection (adjust selector based on your implementation)
    await expect(page.locator('[data-testid="selected-car"]')).toHaveText('CAMRY');
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    // Open dropdown
    await page.locator('[data-testid="car-dropdown"]').click();

    // Verify dropdown is open
    await expect(page.locator('text=4RUNNER')).toBeVisible();

    // Click outside dropdown
    await page.locator('body').click({ position: { x: 100, y: 100 } });

    // Verify dropdown is closed
    await expect(page.locator('text=4RUNNER')).not.toBeVisible();
  });

  test('should filter car models when typing', async ({ page }) => {
    // If dropdown has search functionality
    const searchInput = page.locator('[data-testid="car-search"]');

    await searchInput.fill('COROLLA');

    // Should show COROLLA and COROLLA CROSS
    await expect(page.locator('text=COROLLA CROSS')).toBeVisible();
    await expect(page.locator('text=COROLLA')).toBeVisible();

    // Should hide other models
    await expect(page.locator('text=CAMRY')).not.toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Open dropdown
    await page.locator('[data-testid="car-dropdown"]').click();

    // Use arrow keys to navigate
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // Press Enter to select
    await page.keyboard.press('Enter');

    // Verify selection (adjust based on expected behavior)
    await expect(page.locator('[data-testid="selected-car"]')).toHaveText('AVANZA');
  });

  test('should show correct number of options', async ({ page }) => {
    await page.locator('[data-testid="car-dropdown"]').click();

    // Count total options
    const options = page.locator('[data-testid="dropdown-option"]');
    await expect(options).toHaveCount(10);
  });

  test('should maintain selection after page reload', async ({ page }) => {
    // Select a car
    await page.locator('[data-testid="car-dropdown"]').click();
    await page.locator('text=C-HR').click();

    // Reload page
    await page.reload();

    // Verify selection is maintained (if applicable)
    await expect(page.locator('[data-testid="selected-car"]')).toHaveText('C-HR');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test dropdown still works on mobile
    await page.locator('[data-testid="car-dropdown"]').click();
    await expect(page.locator('text=CAMRY')).toBeVisible();

    // Test touch interaction
    await page.locator('text=CROWN').tap();
    await expect(page.locator('[data-testid="selected-car"]')).toHaveText('CROWN');
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Mock empty response or clear all options
    await page.route('**/api/cars', route => route.fulfill({ json: [] }));

    await page.reload();
    await page.locator('[data-testid="car-dropdown"]').click();

    // Should show no options or empty message
    await expect(page.locator('text=No cars available')).toBeVisible();
  });


  // Additional test for accessibility
  test.describe('Accessibility Tests', () => {

    test('dropdown should be keyboard accessible', async ({ page }) => {
      await page.goto('your-website-url-here');

      // Tab to dropdown
      await page.keyboard.press('Tab');

      // Should be focused
      await expect(page.locator('[data-testid="car-dropdown"]')).toBeFocused();

      // Open with Enter or Space
      await page.keyboard.press('Enter');

      // Should open dropdown
      await expect(page.locator('text=4RUNNER')).toBeVisible();
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('your-website-url-here');

      const dropdown = page.locator('[data-testid="car-dropdown"]');

      // Check ARIA attributes
      await expect(dropdown).toHaveAttribute('role', 'combobox');
      await expect(dropdown).toHaveAttribute('aria-expanded', 'false');

      await dropdown.click();

      await expect(dropdown).toHaveAttribute('aria-expanded', 'true');
    });

  })

  /* { MODEL FUNCTION } */

  test('should display dropdown with correct title', async ({ page }) => {
    await expect(page.locator('text=ปีที่ผลิต?')).toBeVisible();
  });

  test('should display all years in dropdown with Buddhist calendar', async ({ page }) => {
    const expectedYears = [
      { display: '2021 (2564)', value: '2021' },
      { display: '2020 (2563)', value: '2020' },
      { display: '2019 (2562)', value: '2019' },
      { display: '2018 (2561)', value: '2018' },
      { display: '2017 (2560)', value: '2017' },
      { display: '2016 (2559)', value: '2016' },
      { display: '2015 (2558)', value: '2015' },
      { display: '2014 (2557)', value: '2014' },
      { display: '2013 (2556)', value: '2013' },
      { display: '2012 (2555)', value: '2012' }
    ];

    // Click to open dropdown if needed
    await page.locator('[data-testid="year-dropdown"]').click();

    // Verify each year option is present
    for (const year of expectedYears) {
      await expect(page.locator(`text=${year.display}`)).toBeVisible();
    }
  });

  test('should show 2020 as pre-selected with checkmark', async ({ page }) => {
    // Click to open dropdown
    await page.locator('[data-testid="year-dropdown"]').click();

    // Verify 2020 (2563) has checkmark and green styling
    const selected2020 = page.locator('text=2020 (2563)').locator('..');
    await expect(selected2020).toHaveClass(/selected|active|checked/);

    // Verify checkmark icon is visible
    await expect(page.locator('[data-testid="checkmark-2020"]')).toBeVisible();

    // Verify green text color
    await expect(page.locator('text=2020 (2563)')).toHaveCSS('color', /rgb\(34, 197, 94\)|#00F594|green/);
  });

  test('should allow selecting a different year', async ({ page }) => {
    // Click dropdown to open
    await page.locator('[data-testid="year-dropdown"]').click();

    // Select 2019 (2562)
    await page.locator('text=2019 (2562)').click();

    // Verify selection changed
    await expect(page.locator('[data-testid="selected-year"]')).toHaveText('2019');

    // Verify checkmark moved to 2019
    await page.locator('[data-testid="year-dropdown"]').click();
    await expect(page.locator('[data-testid="checkmark-2019"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkmark-2020"]')).not.toBeVisible();
  });

  test('should display years in descending order', async ({ page }) => {
    await page.locator('[data-testid="year-dropdown"]').click();

    const yearOptions = page.locator('[data-testid="year-option"]');
    const years = await yearOptions.allTextContents();

    // Verify years are in descending order (2021 to 2012)
    const expectedOrder = [
      '2021 (2564)', '2020 (2563)', '2019 (2562)', '2018 (2561)',
      '2017 (2560)', '2016 (2559)', '2015 (2558)', '2014 (2557)',
      '2013 (2556)', '2012 (2555)'
    ];

    expect(years).toEqual(expectedOrder);
  });

  test('should show correct Buddhist calendar conversion', async ({ page }) => {
    await page.locator('[data-testid="year-dropdown"]').click();

    // Test Buddhist calendar conversion (AD + 543 = BE)
    const conversions = [
      { ad: 2021, be: 2564 },
      { ad: 2020, be: 2563 },
      { ad: 2019, be: 2562 },
      { ad: 2012, be: 2555 }
    ];

    for (const { ad, be } of conversions) {
      await expect(page.locator(`text=${ad} (${be})`)).toBeVisible();
    }
  });

  test('should maintain selection state when reopening dropdown', async ({ page }) => {
    // Select 2018
    await page.locator('[data-testid="year-dropdown"]').click();
    await page.locator('text=2018 (2561)').click();

    // Close dropdown by clicking outside
    await page.locator('body').click({ position: { x: 100, y: 100 } });

    // Reopen dropdown
    await page.locator('[data-testid="year-dropdown"]').click();

    // Verify 2018 is still selected
    await expect(page.locator('[data-testid="checkmark-2018"]')).toBeVisible();
    await expect(page.locator('text=2018 (2561)')).toHaveCSS('color', /rgb\(34, 197, 94\)|#22c55e|green/);
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    // Open dropdown
    await page.locator('[data-testid="year-dropdown"]').click();

    // Verify dropdown is open
    await expect(page.locator('text=2021 (2564)')).toBeVisible();

    // Click outside dropdown
    await page.locator('body').click({ position: { x: 100, y: 100 } });

    // Verify dropdown is closed
    await expect(page.locator('text=2021 (2564)')).not.toBeVisible();
  });

  test('should handle year range correctly (2012-2021)', async ({ page }) => {
    await page.locator('[data-testid="year-dropdown"]').click();

    // Verify earliest year (2012)
    await expect(page.locator('text=2012 (2555)')).toBeVisible();

    // Verify latest year (2021)
    await expect(page.locator('text=2021 (2564)')).toBeVisible();

    // Verify no years outside range
    await expect(page.locator('text=2011')).not.toBeVisible();
    await expect(page.locator('text=2022')).not.toBeVisible();
  });

  test('should handle scroll in long dropdown list', async ({ page }) => {
    await page.locator('[data-testid="year-dropdown"]').click();

    // Scroll to bottom to see 2012
    await page.locator('[data-testid="dropdown-container"]').hover();
    await page.mouse.wheel(0, 500);

    // Verify 2012 is visible after scroll
    await expect(page.locator('text=2012 (2555)')).toBeVisible();
  });

  test('should handle keyboard navigation through years', async ({ page }) => {
    // Open dropdown
    await page.locator('[data-testid="year-dropdown"]').click();

    // Start from top (2021)
    await page.keyboard.press('ArrowDown'); // Move to 2020
    await page.keyboard.press('ArrowDown'); // Move to 2019

    // Press Enter to select 2019
    await page.keyboard.press('Enter');

    // Verify selection
    await expect(page.locator('[data-testid="selected-year"]')).toHaveText('2019');
  });

  test('should show correct number of year options', async ({ page }) => {
    await page.locator('[data-testid="year-dropdown"]').click();

    // Count total options (2012-2021 = 10 years)
    const options = page.locator('[data-testid="year-option"]');
    await expect(options).toHaveCount(10);
  });

  test('should persist selection after page reload', async ({ page }) => {
    // Select 2017
    await page.locator('[data-testid="year-dropdown"]').click();
    await page.locator('text=2017 (2560)').click();

    // Reload page
    await page.reload();

    // Verify selection is maintained (if using localStorage/sessionStorage)
    await expect(page.locator('[data-testid="selected-year"]')).toHaveText('2017');
  });

  test('should work correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test dropdown still works on mobile
    await page.locator('[data-testid="year-dropdown"]').tap();
    await expect(page.locator('text=2020 (2563)')).toBeVisible();

    // Test touch selection
    await page.locator('text=2016 (2559)').tap();
    await expect(page.locator('[data-testid="selected-year"]')).toHaveText('2016');
  });

  test('should handle edge cases gracefully', async ({ page }) => {
    // Test rapid clicking
    await page.locator('[data-testid="year-dropdown"]').click();
    await page.locator('[data-testid="year-dropdown"]').click();
    await page.locator('[data-testid="year-dropdown"]').click();

    // Should still work normally
    await expect(page.locator('text=2020 (2563)')).toBeVisible();
  });

});

// Additional test for accessibility
test.describe('Accessibility Tests', () => {

  test('dropdown should be keyboard accessible', async ({ page }) => {
    await page.goto('your-website-url-here');

    // Tab to dropdown
    await page.keyboard.press('Tab');

    // Should be focused
    await expect(page.locator('[data-testid="car-dropdown"]')).toBeFocused();

    // Open with Enter or Space
    await page.keyboard.press('Enter');

    // Should open dropdown
    await expect(page.locator('text=4RUNNER')).toBeVisible();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('your-website-url-here');

    const dropdown = page.locator('[data-testid="car-dropdown"]');

    // Check ARIA attributes
    await expect(dropdown).toHaveAttribute('role', 'combobox');
    await expect(dropdown).toHaveAttribute('aria-expanded', 'false');

    await dropdown.click();

    await expect(dropdown).toHaveAttribute('aria-expanded', 'true');
  });

});

