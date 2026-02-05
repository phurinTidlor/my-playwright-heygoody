import { test, expect } from '@playwright/test';
import {
    selectRandomBrand,
    selectRandomModel,
    selectRandomYear,
    selectRandomSubmodel,
    selectStartDate,
    selectRandomInsurer,
    submitQuote
} from '../../helpers/quote-helper-random';


test.describe('Heygoody Short Term Quote short term', () => {
    const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/st-individual/new/quote';

    test.beforeEach(async ({ page }) => {
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');
    });
    /* test.afterEach(async ({ context }) => {
        await context.clearCookies();
        console.log('Cleared cookies after test');
    }); */

    test('heygoody e2e motor short term', async ({ page }) => {
        await page.goto(baseURL);

        expect(page.url()).toBe(baseURL);
        await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ระยะสั้น' })).toBeVisible();
        await page.waitForTimeout(1000);

        await selectRandomBrand(page);
        await selectRandomModel(page);
        await selectRandomYear(page);
        await selectRandomSubmodel(page);
        await selectRandomInsurer(page);
        await selectStartDate(page);
        await submitQuote(page);
        await page.waitForTimeout(1000);

    });


});




