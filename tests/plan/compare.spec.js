import { test, expect } from '@playwright/test';
import { prepareToPlans, goToComparePage, scrollComparePage } from '../../helpers/prepareToPlan';

export async function selectRandomPlansForCompare(page, count = 2) {
    await test.step(`Select ${count} random plans for compare`, async () => {
        const selector = 'button[role="checkbox"][id^="compare-"]';

        // ✅ รอจนกว่าจะมี checkbox อย่างน้อย count ตัว
        await page.waitForFunction(
            ({ selector, count }) => {
                return document.querySelectorAll(selector).length >= count;
            },
            { selector, count },
            { timeout: 15000 }
        );

        const compareCheckboxes = page.locator(selector);
        const total = await compareCheckboxes.count();

        console.log(`Found ${total} compare checkboxes`);

        // safety check
        expect(total).toBeGreaterThanOrEqual(count);

        const indexes = shuffle([...Array(total).keys()]).slice(0, count);

        for (const index of indexes) {
            const checkbox = compareCheckboxes.nth(index);
            await checkbox.click();
            await expect(checkbox).toHaveAttribute('aria-checked', 'true');
        }
    });
}

export async function filterRepairCenter(page) {
    await test.step('Filter repair type: ซ่อมศูนย์', async () => {
        const repairCenterFilter = page.locator(
            'label:has(span:text("ซ่อมศูนย์")) button[role="checkbox"]'
        );

        await expect(repairCenterFilter).toBeVisible();

        const checked = await repairCenterFilter.getAttribute('aria-checked');
        if (checked !== 'true') {
            await repairCenterFilter.click();
            await expect(repairCenterFilter).toHaveAttribute('aria-checked', 'true');
        }

        console.log('🔍 Filtered by repair center (ซ่อมศูนย์)');
    });
}


export async function selectOneRandomRepairCenterPlan(page) {
    await test.step('Select 1 random repair center plan (ซ่อมศูนย์)', async () => {
        const checkboxSelector = 'button[role="checkbox"][id^="compare-"]';
        const repairRowSelector = '#insurance-compare-row-ประเภทการซ่อม-id';

        await page.waitForSelector(checkboxSelector, { timeout: 15000 });

        const checkboxes = page.locator(checkboxSelector);
        const total = await checkboxes.count();

        console.log(`Found ${total} compare checkboxes`);
        if (total === 0) {
            console.log('ℹ️ No compare plans found → skip');
            return;
        }

        const repairTexts = await page
            .locator(repairRowSelector)
            .locator('#compare-with-star-component-id')
            .allTextContents();

        console.log('repairTexts:', repairTexts);

        const repairCenterIndexes = repairTexts
            .map((text, i) => (text?.includes('ซ่อมศูนย์') ? i : null))
            .filter(i => i !== null);

        // ✅ ไม่มีซ่อมศูนย์ = ผ่าน
        if (repairCenterIndexes.length === 0) {
            console.log('ℹ️ No repair center plan found (this is acceptable)');
            return;
        }

        // 🎯 สุ่ม 1 แผน
        const randomIndex =
            repairCenterIndexes[Math.floor(Math.random() * repairCenterIndexes.length)];

        const checkbox = checkboxes.nth(randomIndex);
        await checkbox.click();
        await expect(checkbox).toHaveAttribute('aria-checked', 'true');

        console.log(`⭐ Selected repair center plan at index ${randomIndex}`);
    });
}



function shuffle(array) {
    return array.sort(() => 0.5 - Math.random());
}

function parseBaht(text) {
    if (!text) return 0;

    // ดึงเฉพาะตัวเลขออกมา
    const match = text.match(/\d+/g);

    if (!match) return 0;

    // รวมตัวเลข เช่น ["560", "000"] → "560000"
    return Math.round(Number(match.join('')));
}

function parseCoverageValue(text) {
    if (!text) return 0;

    const cleaned = text.replace(/[^\d.]/g, '');
    if (cleaned === '') return 0;

    return Math.round(Number(cleaned));
}

const COVERAGE_ROWS = [
    { name: 'รถเสียหาย', rowId: 'รถเสียหาย' },
    { name: 'รถสูญหาย', rowId: 'รถสูญหาย' },
    { name: 'รถไฟไหม้', rowId: 'รถไฟไหม้' },
    { name: 'รถน้ำท่วม', rowId: 'รถน้ำท่วม' },
];

/* function getExpectedStarIndexes(values) {
    const totalPlans = values.length;
    const maxValue = Math.max(...values);

    const maxIndexes = values
        .map((v, i) => (v === maxValue ? i : null))
        .filter(i => i !== null);

    // ❌ ทุกแผนมีค่าสูงสุดเท่ากัน → ไม่แสดงดาว
    if (maxIndexes.length === totalPlans) {
        return [];
    }

    return maxIndexes;
} */

function logCoverageStarResult({ name, values, expectedStarIndexes }) {
    const maxValue = Math.max(...values);

    console.log(
        `\n────────── ⭐ Coverage: ${name} ──────────`
    );
    console.log(`Plans count : ${values.length}`);
    console.log(`Values      : [${values.join(', ')}]`);
    console.log(`Max value   : ฿${maxValue.toLocaleString()}`);

    if (expectedStarIndexes.length === 0) {
        console.log(
            'ℹ️ Result   : No star (all plans have the same max value)'
        );
    } else {
        expectedStarIndexes.forEach(i => {
            console.log(
                `⭐ Expected  : plan[${i}] = ⭐฿${values[i].toLocaleString()}`
            );
        });
    }

    console.log('──────────────────────────────────────────');
}

const LIABILITY_ROWS = [
    {
        name: 'ชีวิตบุคคลภายนอกต่อคน',
        rowId: 'ชีวิตบุคคลภายนอกต่อคน',
    },
    {
        name: 'ชีวิตบุคคลภายนอกต่อครั้ง',
        rowId: 'ชีวิตบุคคลภายนอกต่อครั้ง',
    },
    {
        name: 'ทรัพย์สินบุคคลภายนอก',
        rowId: 'ทรัพย์สินบุคคลภายนอก',
    },
];

function getExpectedStarIndexes(values) {
    const maxValue = Math.max(...values);

    const maxIndexes = values
        .map((v, i) => (v === maxValue ? i : null))
        .filter(i => i !== null);

    // ⭐ แสดงดาวก็ต่อเมื่อ "ไม่ใช่ทุกแผน" มีค่าเท่ากัน
    return maxIndexes.length === values.length ? [] : maxIndexes;
}


function logStarResult({ name, values, expectedStarIndexes }) {
    const maxValue = Math.max(...values);

    console.log(`\n────────── ⭐ ${name} ──────────`);
    console.log(`Plans count : ${values.length}`);
    console.log(`Values      : [${values.join(', ')}]`);
    console.log(`Max value   : ฿${maxValue.toLocaleString()}`);

    if (expectedStarIndexes.length === 0) {
        console.log('ℹ️ Result   : No star');
    } else {
        expectedStarIndexes.forEach(i => {
            console.log(
                `⭐ Expected  : plan[${i}] = ⭐฿${values[i].toLocaleString()}`
            );
        });
    }

    console.log('────────────────────────────────────');
}

const EXTERNAL_EXCESS_ROW = {
    name: 'ความเสียหายต่อทรัพย์สินของคู่กรณี',
    rowId: 'ความเสียหายต่อทรัพย์สินของคู่กรณี',
};

function getExpectedStarIndexesByMin(values) {
    const minValue = Math.min(...values);

    const minIndexes = values
        .map((v, i) => (v === minValue ? i : null))
        .filter(i => i !== null);

    // ⭐ ถ้าทุกแผนค่าเท่ากัน → ไม่แสดงดาว
    return minIndexes.length === values.length ? [] : minIndexes;
}

function logMinStarResult({ name, values, expectedStarIndexes }) {
    const minValue = Math.min(...values);

    console.log(`\n────────── ⭐ ${name} ──────────`);
    console.log(`Plans count : ${values.length}`);
    console.log(`Values      : [${values.join(', ')}]`);
    console.log(`Min value   : ฿${minValue.toLocaleString()}`);

    if (expectedStarIndexes.length === 0) {
        console.log('ℹ️ Result   : No star');
    } else {
        expectedStarIndexes.forEach(i => {
            console.log(
                `⭐ Expected  : plan[${i}] = ⭐฿${values[i].toLocaleString()}`
            );
        });
    }

    console.log('────────────────────────────────────');
}

function parseMoneyOnly(text = '') {
    const clean = text
        .replace('⭐', '')
        .replace(/\(.*?\)/g, '') // 🔑 ตัด (x+x คน)
        .replace(/[฿,]/g, '')
        .trim();

    if (!clean) return 0;

    const num = Number(clean);
    return Number.isNaN(num) ? 0 : Math.round(num);
}

function getExpectedStarIndexesByMax(values) {
    const maxValue = Math.max(...values);

    const maxIndexes = values
        .map((v, i) => (v === maxValue ? i : null))
        .filter(i => i !== null);

    // ทุกแผนเท่ากัน → ไม่แสดงดาว
    return maxIndexes.length === values.length ? [] : maxIndexes;
}

function logMaxStarResult({ name, values, expectedStarIndexes }) {
    const maxValue = Math.max(...values);

    console.log(`\n────────── ⭐ ${name} ──────────`);
    console.log(`Plans count : ${values.length}`);
    console.log(`Values      : [${values.join(', ')}]`);
    console.log(`Max value   : ฿${maxValue.toLocaleString()}`);

    if (expectedStarIndexes.length === 0) {
        console.log('ℹ️ Result   : No star');
    } else {
        expectedStarIndexes.forEach(i => {
            console.log(
                `⭐ Expected  : plan[${i}] = ⭐฿${values[i].toLocaleString()}`
            );
        });
    }

    console.log('────────────────────────────────────');
}



// ----------------------- TEST CASE ---------------------

test('Insurance compare star logic validation sumInsurance', async ({ page }) => {

    await prepareToPlans(page);
    await selectRandomPlansForCompare(page, 3);
    await goToComparePage(page);
    await scrollComparePage(page);

    const sumRow = page.locator('#insurance-compare-row-ทุนประกัน-id');

    const sumTexts = await sumRow
        .locator('#compare-with-star-component-id')
        .allTextContents();

    const totalPlans = sumTexts.length;

    // 1️⃣ แปลงเป็นตัวเลข
    const sumValues = sumTexts.map(parseBaht);

    // 2️⃣ หา max
    const maxValue = Math.max(...sumValues);

    // 3️⃣ หา index ที่เป็น max
    const maxIndexes = sumValues
        .map((v, i) => (v === maxValue ? i : null))
        .filter(i => i !== null);

    console.log('sumValues:', sumValues);
    console.log('maxIndexes:', maxIndexes);

    // 🔔 บอกล่วงหน้าว่าควรมีดาวหรือไม่
    if (maxIndexes.length === totalPlans) {
        console.log(
            `ℹ️ No should be shown because all ${totalPlans} plans have the same max sum insured: ฿${maxValue.toLocaleString()}`
        );
    } else {
        maxIndexes.forEach(i => {
            console.log(
                `⭐ Star expected at plan index ${i} with sum insured ⭐${sumValues[i].toLocaleString()}`
            );
        });
    }

    // 4️⃣ assert ดาว
    for (let i = 0; i < totalPlans; i++) {
        const text = sumTexts[i] ?? '';
        const hasStar = text.includes('⭐');

        if (maxIndexes.length < totalPlans && maxIndexes.includes(i)) {
            expect(hasStar).toBeTruthy();
        } else {
            expect(hasStar).toBeFalsy();
        }
    }

});

test('Insurance compare star logic - repair type (ซ่อมศูนย์)', async ({ page }) => {
    await prepareToPlans(page);
    await filterRepairCenter(page);
    await selectRandomPlansForCompare(page, 3);
    await goToComparePage(page);
    await scrollComparePage(page);

    const repairRow = page.locator('#insurance-compare-row-ประเภทการซ่อม-id');

    const repairTexts = await repairRow
        .locator('#compare-with-star-component-id')
        .allTextContents();

    console.log('repairTexts:', repairTexts);

    for (let i = 0; i < repairTexts.length; i++) {
        const text = repairTexts[i] ?? '';
        const hasStar = text.includes('⭐');
        const isRepairCenter = text.includes('ซ่อมศูนย์');

        if (isRepairCenter) {
            console.log(`⭐ Plan ${i}: ซ่อมศูนย์ → should have star`);
            expect(hasStar).toBeTruthy();
        } else {
            console.log(`❌ Plan ${i}: ${text} → should NOT have star`);
            expect(hasStar).toBeFalsy();
        }
    }
});

test('Insurance compare star logic validation excess', async ({ page }) => {
    await prepareToPlans(page);
    await selectRandomPlansForCompare(page, 4);
    await goToComparePage(page);
    await scrollComparePage(page);

    // 🔽 เปลี่ยน row เป็น ค่าเสียหายส่วนแรก
    const excessRow = page.locator('#insurance-compare-row-ค่าเสียหายส่วนแรก-id');

    const excessTexts = await excessRow
        .locator('#compare-with-star-component-id')
        .allTextContents();

    const totalPlans = excessTexts.length;

    // 1️⃣ แปลงเป็นตัวเลข (0 / decimal → round)
    const excessValues = excessTexts.map(parseBaht);

    // 2️⃣ หา min
    const minValue = Math.min(...excessValues);

    // 3️⃣ หา index ที่เป็น min
    const minIndexes = excessValues
        .map((v, i) => (v === minValue ? i : null))
        .filter(i => i !== null);

    console.log('excessValues:', excessValues);
    console.log('minIndexes:', minIndexes);

    // 🔔 log ว่าควรมีดาวหรือไม่
    if (minIndexes.length === totalPlans) {
        console.log(
            `ℹ️ No star should be shown because all ${totalPlans} plans have the same excess: ฿${minValue.toLocaleString()}`
        );
    } else {
        minIndexes.forEach(i => {
            console.log(
                `⭐ Star expected at plan index ${i} with excess ⭐฿${excessValues[i].toLocaleString()}`
            );
        });
    }

    // 4️⃣ assert ดาว
    for (let i = 0; i < totalPlans; i++) {
        const text = excessTexts[i] ?? '';
        const hasStar = text.includes('⭐');

        if (minIndexes.length < totalPlans && minIndexes.includes(i)) {
            expect(hasStar).toBeTruthy();
        } else {
            expect(hasStar).toBeFalsy();
        }
    }
});

// Run test Coverage ทีเดียวพร้อมกัน
test.describe('Insurance compare star logic - coverage (max value)', () => {
    for (const coverage of COVERAGE_ROWS) {
        test(`⭐ ${coverage.name} star logic validation`, async ({ page }) => {
            await prepareToPlans(page);
            await selectRandomPlansForCompare(page, 3);
            await goToComparePage(page);
            await scrollComparePage(page);

            const row = page.locator(
                `#insurance-compare-row-${coverage.rowId}-id`
            );

            const texts = await row
                .locator('#compare-with-star-component-id')
                .allTextContents();

            const values = texts.map(parseCoverageValue);
            const expectedStarIndexes = getExpectedStarIndexes(values);

            // ✅ log แบบสรุปเคสเดียว
            logCoverageStarResult({
                name: coverage.name,
                values,
                expectedStarIndexes,
            });

            // ✅ assert
            for (let i = 0; i < values.length; i++) {
                const hasStar = (texts[i] ?? '').includes('⭐');

                if (expectedStarIndexes.includes(i)) {
                    expect(hasStar).toBeTruthy();
                } else {
                    expect(hasStar).toBeFalsy();
                }
            }
        });
    }
});

test.describe('Insurance compare star logic - liability (max value)', () => {
    for (const row of LIABILITY_ROWS) {
        test(`⭐ ${row.name} star logic validation`, async ({ page }) => {
            await prepareToPlans(page);
            await selectRandomPlansForCompare(page, 4);
            await goToComparePage(page);
            await scrollComparePage(page);

            const rowLocator = page.locator(
                `#insurance-compare-row-${row.rowId}-id`
            );

            const texts = await rowLocator
                .locator('#compare-with-star-component-id')
                .allTextContents();

            const values = texts.map(parseCoverageValue);
            const expectedStarIndexes = getExpectedStarIndexes(values);

            // 🔍 log ให้ตรงเคส
            logStarResult({
                name: row.name,
                values,
                expectedStarIndexes,
            });

            // ✅ assert ดาว
            for (let i = 0; i < values.length; i++) {
                const hasStar = (texts[i] ?? '').includes('⭐');

                if (expectedStarIndexes.includes(i)) {
                    expect(hasStar).toBeTruthy();
                } else {
                    expect(hasStar).toBeFalsy();
                }
            }
        });
    }
});

test('Insurance compare star logic - external excess (min value)', async ({ page }) => {
    await prepareToPlans(page);
    await selectRandomPlansForCompare(page, 4);
    await goToComparePage(page);
    await scrollComparePage(page);

    const row = EXTERNAL_EXCESS_ROW;

    const rowLocator = page.locator(
        `#insurance-compare-row-${row.rowId}-id`
    );

    const texts = await rowLocator
        .locator('#compare-with-star-component-id')
        .allTextContents();

    const values = texts.map(parseBaht);

    const expectedStarIndexes = getExpectedStarIndexesByMin(values);

    // 🔍 log
    logMinStarResult({
        name: row.name,
        values,
        expectedStarIndexes,
    });

    // ✅ assert ดาว
    for (let i = 0; i < values.length; i++) {
        const hasStar = (texts[i] ?? '').includes('⭐');

        if (expectedStarIndexes.includes(i)) {
            expect(hasStar).toBeTruthy();
        } else {
            expect(hasStar).toBeFalsy();
        }
    }
});

test('Insurance compare star logic - personal accident (max per person)', async ({ page }) => {
    await prepareToPlans(page);
    await selectRandomPlansForCompare(page, 4);
    await goToComparePage(page);
    await scrollComparePage(page);

    const rowName = 'อุบัติเหตุส่วนบุคคล';
    const rowId = 'อุบัติเหตุส่วนบุคคล';

    const row = page.locator(
        `#insurance-compare-row-${rowId}-id`
    );

    const texts = await row
        .locator('#compare-with-star-component-id')
        .allTextContents();

    const values = texts.map(parseMoneyOnly);

    const expectedStarIndexes = getExpectedStarIndexesByMax(values);

    // 🔍 log
    logMaxStarResult({
        name: rowName,
        values,
        expectedStarIndexes,
    });

    // ✅ assert ดาว
    for (let i = 0; i < values.length; i++) {
        const hasStar = (texts[i] ?? '').includes('⭐');

        if (expectedStarIndexes.includes(i)) {
            expect(hasStar).toBeTruthy();
        } else {
            expect(hasStar).toBeFalsy();
        }
    }
});


test('Insurance compare star logic - hospital fee per person (max)', async ({ page }) => {
    await prepareToPlans(page);
    await selectRandomPlansForCompare(page, 4);
    await goToComparePage(page);
    await scrollComparePage(page);

    const rowName = 'ค่ารักษาพยาบาลต่อคน';
    const rowId = 'ค่ารักษาพยาบาลต่อคน';

    const row = page.locator(
        `#insurance-compare-row-${rowId}-id`
    );

    const texts = await row
        .locator('#compare-with-star-component-id')
        .allTextContents();

    const values = texts.map(parseMoneyOnly);
    const expectedStarIndexes = getExpectedStarIndexesByMax(values);

    logMaxStarResult({
        name: rowName,
        values,
        expectedStarIndexes,
    });

    for (let i = 0; i < values.length; i++) {
        const hasStar = (texts[i] ?? '').includes('⭐');
        expect(hasStar).toBe(expectedStarIndexes.includes(i));
    }
});

test('Insurance compare star logic - driver bail bond (max)', async ({ page }) => {
    await prepareToPlans(page);
    await selectRandomPlansForCompare(page, 4);
    await goToComparePage(page);
    await scrollComparePage(page);

    const rowName = 'ประกันตัวผู้ขับขี่';
    const rowId = 'ประกันตัวผู้ขับขี่';

    const row = page.locator(
        `#insurance-compare-row-${rowId}-id`
    );

    const texts = await row
        .locator('#compare-with-star-component-id')
        .allTextContents();

    const values = texts.map(parseMoneyOnly);
    const expectedStarIndexes = getExpectedStarIndexesByMax(values);

    logMaxStarResult({
        name: rowName,
        values,
        expectedStarIndexes,
    });

    for (let i = 0; i < values.length; i++) {
        const hasStar = (texts[i] ?? '').includes('⭐');
        expect(hasStar).toBe(expectedStarIndexes.includes(i));
    }
});


