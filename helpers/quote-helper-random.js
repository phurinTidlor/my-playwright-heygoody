import { test, expect } from '@playwright/test';

// Helper Functions
async function selectRandomFromListItems(page, description = '') {
    const buttons = page.getByRole('listitem').locator('button');
    const items = await buttons.allTextContents();
    const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';


    if (items.length === 0) {
        try {
            await page.goto(baseURL);
            await page.waitForLoadState('networkidle');
        } catch (err) {
            console.error("Navigation failed:", err.message);
            return null;
        }
    }

    const randomIndex = Math.floor(Math.random() * items.length);
    const randomItem = items[randomIndex];
    const selectedButton = buttons.filter({ hasText: randomItem }).first();

    console.log(`${description}: Selected "${randomItem}" (${randomIndex + 1}/${items.length})`);

    await selectedButton.click({force: true});
    await page.waitForTimeout(1000);

    return randomItem;
}


/* async function selectSedanCarType(page) {
    const sedanCard = page.locator('#lt-individual-quote-car-type-label-id0');
    await expect(sedanCard).toBeVisible();
    await sedanCard.waitFor({ state: 'attached' });
    await sedanCard.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible();
    await page.waitForTimeout(1000);
} */
async function selectSedanCarType(page) {
    const sedanCard = page.locator('#lt-individual-quote-car-type-label-id0');
    await expect(sedanCard).toBeVisible();
    await sedanCard.waitFor({ state: 'attached' });  // รอจน DOM stable
    await sedanCard.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible();
    await page.waitForTimeout(500);
}
async function selectSedanCarTypeEV(page) {
    const evCard = page.locator('#lt-individual-quote-car-type-label-id1');
    await expect(evCard).toBeVisible();
    await evCard.waitFor({ state: 'attached' });
    await evCard.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(page.getByText('รถไฟฟ้า EV ไม่เกิน 7 ที่นั่ง')).toBeVisible();
    await page.waitForTimeout(1000);
}
async function selectSedanCarTypePickup(page) {
    const pickupCard = page.locator('#lt-individual-quote-car-type-item-id2');
    await expect(pickupCard).toBeVisible();
    await pickupCard.waitFor({ state: 'attached' });
    await pickupCard.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(
        page.getByText('รถกระบะ 2 ประตู', { exact: true })
    ).toBeVisible();
    await page.waitForTimeout(1000);
}
async function selectCustomAccordionPickup(page, customId = 'ltIndividualQuotePickUpCustomBoxButtonId') {
    const accordionTrigger = page.locator('#lt-individual-quote-pick-up-custom-none-button-id');
    const triggerCount = await accordionTrigger.count();
    if (triggerCount > 0) {
        await accordionTrigger.waitFor({ state: 'visible', timeout: 5000 });
        await accordionTrigger.click();
        console.log('Accordion opened');
        await page.waitForTimeout(500);
    } else {
        console.warn('Accordion trigger not found');
    }
    const customButton = page.locator(`#${customId}`);
    const count = await customButton.count();
    if (count === 0) {
        console.warn(`Button with id "${customId}" not found, skipping click`);
        return null;
    }
    await customButton.waitFor({ state: 'visible', timeout: 10000 });
    await customButton.click();
    console.log(`Clicked button with id "${customId}"`);

    await page.waitForTimeout(1000);

    return customId;
}

async function selectSedanCarTypeVan(page) {
    const vanCard = page.locator('#lt-individual-quote-car-type-label-id3');
    await expect(vanCard).toBeVisible();
    await vanCard.waitFor({ state: 'attached' });
    await vanCard.click({ force: true });
    await page.waitForTimeout(1000);
    await expect(
        page.getByText('รถตู้เกิน 7 ที่นั่ง', { exact: true })
    ).toBeVisible();
    await page.waitForTimeout(1000);
}

async function selectRandomBrand(page) {
    const selectedBrand = await selectRandomFromListItems(page, 'Brand');
    //await expect(page.getByRole('heading', { name: `ยี่ห้อรถ ${selectedBrand}` })).toBeVisible();
    return selectedBrand;
}

async function selectRandomModel(page) {
    return await selectRandomFromListItems(page, 'Model');
}

async function selectRandomYear(page) {
    return await selectRandomFromListItems(page, 'Year');
}

async function selectRandomSubmodel(page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    return await selectRandomFromListItems(page, 'Submodel');
}

async function selectRandomProvince(page) {
    return await selectRandomFromListItems(page, 'Province');
}

async function selectRandomInsurer(page) {
    return await selectRandomFromListItems(page, 'Insurer');
}

async function selectRandomBirthYear(page) {
    return await selectRandomFromListItems(page, 'Birth Year');
}

// async function selectStartDate(page) {
//     // const day = page.locator('[data-day="2025-10-23"] > .focus-visible\\:border-ring');//.focus-visible\\:border-ring , .rdp-selected > .shrink-0
//     // await day.click({ force : true });
//     // await page.waitForTimeout(2000);
//     // await page.locator('.rdp').waitFor({ state: 'visible', timeout: 10000 });
//     // console.log('Start Date: Selected 2025-10-23');

//     /* await page.locator('input[name="2025-10-23"]').getByText({ force: true }); // แก้เป็น selector ของคุณจริง
//     await page.waitForTimeout(10000);
//     const day = page.locator('td[data-day="2025-10-23"] button.rdp-day_button');
//     await day.waitFor({ state: 'visible' });

//     await day.click(); */

//     const selector = page.locator(':nth-child(2) > .rdp-month_grid > .rdp-weeks > :nth-child(3)');
//     await selector.click(`[data-day="2025-10-23"]`);
// }

async function selectStartDate(page) {
    const selector = '[data-day="2026-02-28"]:visible';
    await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });

    const day = page.locator(selector);
    await day.click({ force: true });
    await page.waitForTimeout(2000);

    console.log('Start Date: Selected 2026-02-28');
}

/* async function submitQuote1(page) {
    const submitButton = page.locator('#quote-document-submit-button-id');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    console.log('Quote submitted successfully');
} */

async function submitQuote(page) {
    const btnByRole = page.getByRole('button', { name: 'ดูแผนประกันของคุณ' });
    // รอให้ปุ่มปรากฏ และรอให้ไม่ถูก disabled
    await expect(btnByRole).toBeVisible();
    await expect(btnByRole).toBeEnabled();
    // ถ้าการคลิกจะนำไปสู่ navigation:
    await Promise.all([
        page.waitForNavigation(/*{ waitUntil: 'networkidle' }*/),
        btnByRole.click()
    ]);
    // ตรวจสอบผลลัพธ์บางอย่างหลังคลิก 
    await expect(page.locator('text=ตัวกรอง')).toBeVisible();

}

async function completeRandomQuoteFlow(page) {
    console.log('Starting random quote selection process...');

    try {
        // Car type selection
        await selectSedanCarType(page);

        // Random selections
        const brand = await selectRandomBrand(page);
        const model = await selectRandomModel(page);
        const year = await selectRandomYear(page);
        const submodel = await selectRandomSubmodel(page);
        const province = await selectRandomProvince(page);
        const insurer = await selectRandomInsurer(page);
        const birthYear = await selectRandomBirthYear(page);

        // Date and submission
        await selectStartDate(page);
        await submitQuote(page);

        console.log('Random quote flow completed successfully');
        console.log(`Final selection: ${brand} ${model} ${year} ${submodel}, Province: ${province}, Insurer: ${insurer}, Birth Year: ${birthYear}`);

        return {
            brand,
            model,
            year,
            submodel,
            province,
            insurer,
            birthYear
        };
    } catch (error) {
        console.error('Error in random quote flow:', error);
        throw error;
    }
}

// test.describe('Heygoody Short Term Quote Page', () => {
//     const baseURL = 'https://dev-heygoody.areetech.io/th/auto-insurance/lt-individual/new/quote';

//     // Helper Functions
//     async function selectRandomFromListItems(page, description = '') {
//         const buttons = page.getByRole('listitem').locator('button');
//         const items = await buttons.allTextContents();

//         if (items.length === 0) {
//             throw new Error(`No items found for ${description}`);
//         }

//         const randomIndex = Math.floor(Math.random() * items.length);
//         const randomItem = items[randomIndex];
//         const selectedButton = buttons.filter({ hasText: randomItem }).first();

//         console.log(`${description}: Selected "${randomItem}" (${randomIndex + 1}/${items.length})`);

//         await selectedButton.click();
//         await page.waitForTimeout(1000);

//         return randomItem;
//     }

//     async function selectSedanCarType(page) {
//         const sedanCard = page.locator('#ltIndividualQuoteCarTypeItemId0');
//         await expect(sedanCard).toBeVisible();
//         await sedanCard.click();
//         await page.waitForTimeout(1000);
//         await expect(page.getByText('รถเก๋ง, กระบะ 4 ประตู, รถตู้ไม่เกิน 7 ที่นั่ง')).toBeVisible();
//         await page.waitForTimeout(1000);
//     }

//     async function selectRandomBrand(page) {
//         const selectedBrand = await selectRandomFromListItems(page, 'Brand');
//         await expect(page.getByRole('heading', { name: `ยี่ห้อรถ ${selectedBrand}` })).toBeVisible();
//         return selectedBrand;
//     }

//     async function selectRandomModel(page) {
//         return await selectRandomFromListItems(page, 'Model');
//     }

//     async function selectRandomYear(page) {
//         return await selectRandomFromListItems(page, 'Year');
//     }

//     async function selectRandomSubmodel(page) {
//         return await selectRandomFromListItems(page, 'Submodel');
//     }

//     async function selectRandomProvince(page) {
//         return await selectRandomFromListItems(page, 'Province');
//     }

//     async function selectRandomInsurer(page) {
//         return await selectRandomFromListItems(page, 'Insurer');
//     }

//     async function selectRandomBirthYear(page) {
//         return await selectRandomFromListItems(page, 'Birth Year');
//     }

//     async function selectStartDate(page) {
//         const day = page.locator('[data-day="2025-09-27"] > .focus-visible\\:border-ring');
//         await day.click();
//         await page.waitForTimeout(2000);
//         console.log('Start Date: Selected 2025-09-27');
//     }

//     async function submitQuote(page) {
//         const submitButton = page.locator('#quoteDocumentSubmitButtonId');
//         await expect(submitButton).toBeVisible();
//         await expect(submitButton).toBeEnabled();
//         await submitButton.click();
//         console.log('Quote submitted successfully');
//     }

//     async function completeRandomQuoteFlow(page) {
//         console.log('Starting random quote selection process...');

//         try {
//             // Car type selection
//             await selectSedanCarType(page);

//             // Random selections
//             const brand = await selectRandomBrand(page);
//             const model = await selectRandomModel(page);
//             const year = await selectRandomYear(page);
//             const submodel = await selectRandomSubmodel(page);
//             const province = await selectRandomProvince(page);
//             const insurer = await selectRandomInsurer(page);
//             const birthYear = await selectRandomBirthYear(page);

//             // Date and submission
//             await selectStartDate(page);
//             await submitQuote(page);

//             console.log('Random quote flow completed successfully');
//             console.log(`Final selection: ${brand} ${model} ${year} ${submodel}, Province: ${province}, Insurer: ${insurer}, Birth Year: ${birthYear}`);

//             return {
//                 brand,
//                 model,
//                 year,
//                 submodel,
//                 province,
//                 insurer,
//                 birthYear
//             };
//         } catch (error) {
//             console.error('Error in random quote flow:', error);
//             throw error;
//         }
//     }

//     test.beforeEach(async ({ page }) => {
//         await page.goto(baseURL);
//         await page.waitForLoadState('networkidle');
//     });

//     /* test('heygoody motor longterm e2e sedan - Random Selection', async ({ page }) => {
//         await page.goto(baseURL);

//         expect(page.url()).toBe(baseURL);
//         await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
//         await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
//         await page.waitForTimeout(1000);

//         // Execute complete random quote flow
//         const selections = await completeRandomQuoteFlow(page);

//         // Additional assertions can be added here if needed
//         expect(selections.brand).toBeDefined();
//         expect(selections.model).toBeDefined();
//     }); */

//     // Multiple random tests
//     /* for (let i = 1; i <= 1; i++) {
//         test(`heygoody motor longterm e2e sedan - Random Test ${i}`, async ({ page }) => {
//             await page.goto(baseURL);

//             expect(page.url()).toBe(baseURL);
//             await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
//             await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
//             await page.waitForTimeout(1000);

//             console.log(`\n=== Starting Random Test ${i} ===`);

//             // Execute complete random quote flow
//             const selections = await completeRandomQuoteFlow(page);

//             console.log(`=== Random Test ${i} Completed Successfully ===\n`);

//             // Verify that selections were made
//             expect(selections.brand).toBeDefined();
//             expect(selections.model).toBeDefined();
//             expect(selections.year).toBeDefined();
//             expect(selections.submodel).toBeDefined();
//             expect(selections.province).toBeDefined();
//             expect(selections.insurer).toBeDefined();
//             expect(selections.birthYear).toBeDefined();
//         });
//     } */

//     // Test with specific flow steps (for debugging)
//     /* test('heygoody motor longterm e2e sedan - Step by Step Random', async ({ page }) => {
//         await page.goto(baseURL);

//         expect(page.url()).toBe(baseURL);
//         await expect(page.getByRole('heading', { name: 'เช็คเบี้ยประกันรถยนต์ชั้นนำ' })).toBeVisible();
//         await expect(page.getByText('เปรียบเทียบประกันรถง่ายๆ กับ heygoody')).toBeVisible();
//         await page.waitForTimeout(1000);

//         console.log('\n=== Step by Step Random Test ===');

//         // Step 1: Select car type
//         console.log('Step 1: Selecting car type...');
//         await selectSedanCarType(page);

//         // Step 2: Select brand
//         console.log('Step 2: Selecting brand...');
//         const brand = await selectRandomBrand(page);

//         // Step 3: Select model
//         console.log('Step 3: Selecting model...');
//         const model = await selectRandomModel(page);

//         // Step 4: Select year
//         console.log('Step 4: Selecting year...');
//         const year = await selectRandomYear(page);

//         // Step 5: Select submodel
//         console.log('Step 5: Selecting submodel...');
//         const submodel = await selectRandomSubmodel(page);

//         // Step 6: Select province
//         console.log('Step 6: Selecting province...');
//         const province = await selectRandomProvince(page);

//         // Step 7: Select insurer
//         console.log('Step 7: Selecting insurer...');
//         const insurer = await selectRandomInsurer(page);

//         // Step 8: Select birth year
//         console.log('Step 8: Selecting birth year...');
//         const birthYear = await selectRandomBirthYear(page);

//         // Step 9: Select date
//         console.log('Step 9: Selecting start date...');
//         await selectStartDate(page);

//         // Step 10: Submit
//         console.log('Step 10: Submitting quote...');
//         await submitQuote(page);

//         console.log('=== Step by Step Test Completed ===\n');

//         // Final verification
//         expect(brand).toBeDefined();
//         expect(model).toBeDefined();
//         expect(year).toBeDefined();
//         expect(submodel).toBeDefined();
//         expect(province).toBeDefined();
//         expect(insurer).toBeDefined();
//         expect(birthYear).toBeDefined();
//     }); */


// });

module.exports = {
    selectSedanCarType,
    selectSedanCarTypeEV,
    selectSedanCarTypePickup,
    selectSedanCarTypeVan,
    selectCustomAccordionPickup,
    selectRandomBrand,
    selectRandomModel,
    selectRandomYear,
    selectRandomSubmodel,
    selectRandomProvince,
    selectRandomInsurer,
    selectRandomBirthYear,
    selectStartDate,
    submitQuote
};