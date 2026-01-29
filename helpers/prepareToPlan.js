import { expect, test } from '@playwright/test';
const {
    selectSedanCarType,
    selectRandomBrand,
    selectRandomModel,
    selectRandomYear,
    selectRandomSubmodel,
    selectRandomProvince,
    selectRandomInsurer,
    selectRandomBirthYear,
    selectStartDate,
    submitQuote
} = require('./quote-helper-random');

export async function prepareToPlans(page) {
    await test.step('Go to landing page', async () => {
        //await page.goto('https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote');
        await page.goto('https://uat-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote');
        await page.waitForLoadState('networkidle');

        // ---------- Quote Flow ----------
        await selectSedanCarType(page);
        // await selectRandomBrand(page);
        // await selectRandomModel(page);
        // await selectRandomYear(page);
        // await selectRandomSubmodel(page);

        //----------------- Fig Brand-------------------

        // Select brand 
        await page.click('text=TOYOTA');
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', { name: 'ยี่ห้อรถ TOYOTA' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'COROLLA CROSS' })).toBeVisible();

        // Select model
        await page.click('text=COROLLA CROSS');
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', { name: 'รุ่นรถ COROLLA CROSS' })).toBeVisible();
        await expect(page.getByRole('button', { name: '2023 (2566)' })).toBeVisible();

        // Select year
        await page.click('text=2023 (2566)');
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', { name: 'ปีที่ผลิต 2023 (2566)' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'COROLLA CROSS Hybrid Premium Safety 1.8' })).toBeVisible();

        // Select submodel
        await page.click('text=COROLLA CROSS Hybrid Premium Safety 1.8');
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', { name: 'รุ่นย่อย COROLLA CROSS Hybrid Premium Safety 1.8' })).toBeVisible();
        //----------------- Fig Brand-------------------

        await selectRandomProvince(page);
        await selectRandomInsurer(page);
        await selectRandomBirthYear(page);
        await selectStartDate(page);
        await submitQuote(page);

        const closeBtn = page.locator('button[data-slot="dialog-close"]');
        await expect(closeBtn).toBeVisible();
        await closeBtn.click();


    });


}

export async function goToComparePage(page) {
    await test.step('Go to compare page', async () => {
        // ปรับ viewport ให้เป็น desktop แน่ ๆ
        await page.setViewportSize({ width: 1280, height: 800 });

        const compareButton = page.locator('#compare-button-id');

        await expect(compareButton).toBeVisible();
        await expect(compareButton).toBeEnabled();

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            compareButton.click(),
        ]);

        await expect(page).toHaveURL(/compare/);
    });
}

export async function scrollComparePage(page) {
    await test.step('Scroll compare page vertically & horizontally', async () => {
        // 🔽 scroll แนวตั้ง
        await page.evaluate(async () => {
            await new Promise(resolve => {
                let totalHeight = 0;
                const distance = 400;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // ▶️ scroll แนวนอน (กรณี plan เยอะ)
        await page.evaluate(async () => {
            const container =
                document.querySelector('[data-testid="compare-table"]') ||
                document.scrollingElement;

            if (!container) return;

            await new Promise(resolve => {
                let totalWidth = 0;
                const distance = 300;
                const timer = setInterval(() => {
                    const scrollWidth = container.scrollWidth;
                    container.scrollBy(distance, 0);
                    totalWidth += distance;

                    if (totalWidth >= scrollWidth) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
    });
}
