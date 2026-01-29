import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  // use: {
  //   /* Base URL to use in actions like `await page.goto('/')`. */
  //   // baseURL: 'http://localhost:3000',

  //   /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
  //   trace: 'on-first-retry',
  // },

  use: {
    headless: false, // เปิดเบราว์เซอร์
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    navigationTimeout: 100000,
    screenshot: 'only-on-failure',
    video: 'on',//retain-on-failure run เฉพาะอันที่ล้ม
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'iPhone 13 Safari',
      use: { ...devices['iPhone 13'] }, // <-- WebKit automatically
    },

    /* {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    }, */

    /* {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    }, */
    /* {
      name: 'Mobile iPhone 12',
      use: { ...devices['iPhone 12'] },
    }, */
    /* {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    /* Test against mobile viewports. */
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    }, */
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});


// import { defineConfig, devices } from '@playwright/test';

// export default defineConfig({
//   testDir: './tests',
//   fullyParallel: true,
//   forbidOnly: !!process.env.CI,
//   retries: process.env.CI ? 2 : 0,
//   workers: process.env.CI ? 1 : undefined,
//   reporter: 'html',
//   use: {
//     headless: false,
//     actionTimeout: 10000,
//     navigationTimeout: 100000,
//     screenshot: 'only-on-failure',
//     video: 'retain-on-failure',
//     trace: 'on-first-retry',
//   },
//   projects: [
//     // Desktop
//     { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },

//     // iPhone 14 Pro Max
//     { name: 'iPhone 14 Pro Max Portrait', use: { ...devices['iPhone 14 Pro Max'] } },
//     { name: 'iPhone 14 Pro Max Landscape', use: { ...devices['iPhone 14 Pro Max'], viewport: { width: 932, height: 430 } } },

//     // Samsung Galaxy S21
//     { name: 'Samsung Galaxy S21 Portrait', use: { ...devices['Galaxy S9+'] } },
//     { name: 'Samsung Galaxy S21 Landscape', use: { ...devices['Galaxy S9+'], viewport: { width: 740, height: 360 } } },

//     // OPPO N5
//     { name: 'OPPO N5 Portrait', use: { viewport: { width: 674, height: 841 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
//     { name: 'OPPO N5 Landscape', use: { viewport: { width: 841, height: 674 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
//   ],
// });

