import { test, expect } from '@playwright/test';

test.describe('Heygoody Short Term Quote Page', () => {
    const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

    test.beforeEach(async ({ page }) => {
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');
    });

    test('heygoody motor longterm e2e sedan', async ({ page }) => {
        await page.goto(baseURL);

        expect(page.url()).toBe(baseURL);
        await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
        await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
        await page.waitForTimeout(1000);

        // Click Select sedan
        const sedanCard = page.locator('#lt-individual-quote-car-type-label-id0');
        await expect(sedanCard).toBeVisible();
        await sedanCard.waitFor({ state: 'attached' });
        await sedanCard.click({ force: true });
        await page.waitForTimeout(1000);
        await expect(page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible();
        await page.waitForTimeout(1000);

        // Select brand 
        await page.click('text=BMW');
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', { name: 'ยี่ห้อรถ BMW' })).toBeVisible();
        await expect(page.getByRole('button', { name: '118I' })).toBeVisible();

        // Select model
        await page.click('text=118I');
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', { name: 'รุ่นรถ 118I' })).toBeVisible();
        await expect(page.getByRole('button', { name: '2020 (2563)' })).toBeVisible();

        // Select year
        await page.click('text=2020 (2563)');
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', { name: 'ปีที่ผลิต 2020 (2563)' })).toBeVisible();
        await expect(page.getByRole('button', { name: '118I M Sport 1.5' })).toBeVisible();

        // Select submodel
        await page.click('text=118I M Sport 1.5');
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', { name: 'รุ่นย่อย 118I M Sport 1.5' })).toBeVisible();

        // Select province
        await page.click('#ltIndividualQuoteCarProvincePopularButtonId0');
        await page.waitForTimeout(1000);

        const provinceHeading = page.getByRole('heading', { name: /กรุงเทพมหานคร/ });
        await provinceHeading.waitFor({ state: 'visible', timeout: 10000 });
        await expect(provinceHeading).toBeVisible();

        // Select insure
        await page.click('#ltIndividualQuoteCarInsurerButtonId0');
        await page.waitForTimeout(1000);

        //await expect(page.getByRole('heading', { name: 'บริษัทประกันล่าสุด ประกันเดิมหมดอายุ/ไม่มีประกันรถยนต์' })).toBeVisible();

        // Select year of birth
        await page.click('text=1998 (2541)');
        await page.waitForTimeout(1000);

        // Date start
        const day = page.locator('[data-day="2025-09-27"] > .focus-visible\\:border-ring');
        await day.click();
        await page.waitForTimeout(2000);

        const submitButton = page.locator('#quote-document-submit-button-id');

        // ตรวจสอบว่าปุ่มมองเห็นและคลิกได้
        await expect(submitButton).toBeVisible();
        await expect(submitButton).toBeEnabled();

        // คลิกปุ่ม
        await submitButton.click();

    });




});




