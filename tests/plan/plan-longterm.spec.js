/* const { test, expect } = require('@playwright/test');

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/plan'; 

test('Load Plan Page and Check env', async ({ page }) => {

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`Network ${response.status()} - ${response.url()}`);
    }
  });
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  console.log('หน้าโหลดเสร็จ:', baseURL);

  const title = await page.title();
  console.log('Title:', title);
  expect(title.toLowerCase()).toContain('heygoody');

  const planSection = page.locator('section');
  await expect(planSection.first()).toBeVisible({ timeout: 5000 });
  console.log('พบ section แสดงผลในหน้า');

  //ถ่าย screenshot 
  await page.screenshot({ path: 'plan_page_loaded.png', fullPage: true });
  console.log('Screenshot บันทึกไว้ที่: plan_page_loaded.png');

  //(Performance timing)
  const perf = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);
  console.log(`Page Load Time: ${perf} ms`);

  console.log('การทดสอบโหลดหน้า Plan Page เสร็จสมบูรณ์');
}); */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/plan';

// สร้างโฟลเดอร์ screenshot
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

test('Responsive layout & screenshot', async ({ page, browserName }) => {
  console.log(`\n====================`);
  console.log(`Device: ${browserName}`);
  console.log(`====================`);

  await page.goto(baseURL, { waitUntil: 'load' });

  // ตรวจสอบ viewport
  const viewportSize = page.viewportSize();
  console.log(`[${browserName}] Viewport:`, viewportSize);

  // ตรวจสอบ element หลัก
  const elements = {
    header: page.locator('header'),
    navigation: page.locator('nav'),
    mainContent: page.locator('main, section'),
    footer: page.locator('footer'),
  };

  for (const [elementName, locator] of Object.entries(elements)) {
    try {
      const count = await locator.count();
      if (count === 0) {
        console.log(`[${browserName}] ⚠️ ${elementName} ไม่พบใน DOM`);
        continue;
      }

      const visible = await locator.first().isVisible();
      console.log(visible
        ? `[${browserName}] ✓ ${elementName} แสดงผล`
        : `[${browserName}] ⚠️ ${elementName} ไม่แสดงผล`);
    } catch (err) {
      console.log(`[${browserName}] ✗ Error ตรวจสอบ ${elementName}:`, err.message);
    }
  }

  // ตรวจสอบ Horizontal Scroll
  const hasHorizontalScroll = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  console.log(hasHorizontalScroll
    ? `[${browserName}] ⚠️ พบ Horizontal Scroll Bar`
    : `[${browserName}] ✅ ไม่มี Horizontal Scroll Bar`);

  // ซ่อน __next-route-announcer__ ก่อน screenshot
  await page.evaluate(() => {
    const announcer = document.getElementById('__next-route-announcer__');
    if (announcer) announcer.style.display = 'none';
  });

  // Screenshot
  const screenshotName = path.join(
    screenshotDir,
    `${browserName.replace(/\s+/g, '_')}.png`
  );
  await page.screenshot({ path: screenshotName, fullPage: true });
  console.log(`[${browserName}] Screenshot captured: ${screenshotName}`);
});
