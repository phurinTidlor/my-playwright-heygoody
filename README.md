# Heygoody E2E Test Suite

Playwright-based end-to-end test suite สำหรับ heygoody.com — ทดสอบ flow การซื้อประกันรถยนต์ครอบคลุม long-term, short-term, ทั้งบุคคลธรรมดา (individual) และนิติบุคคล (juristic)

---

## 📁 โครงสร้างโปรเจกต์

```
my-playwright-heygoody/
├── helpers/                          # Shared helpers ใช้ร่วมในทุก test
│   ├── config.js                     # URL config (dev/uat/pre)
│   ├── test-data.js                  # ข้อมูลทดสอบ (insured/driver/address/juristic)
│   ├── quote-helper-random.js        # quote selection (brand/model/year/...) + retry logic
│   ├── orferinfo-form-helpers.js     # form filling helpers (driver/address/etc.)
│   └── prepareToPlan.js              # legacy helper (ก่อน refactor)
│
├── tests/
│   ├── e2e/
│   │   ├── longterm/                 # LT individual: non-ev, ev, pickup, van + affiliate
│   │   ├── shortterm/                # ST individual: non-ev
│   │   └── juristic/                 # LT juristic: non-ev, ev
│   ├── lt-individual/                # legacy quote tests
│   ├── lt-juristic/                  # legacy juristic tests
│   ├── st-individual/                # legacy ST tests
│   ├── validate-OCR/                 # OCR validation tests
│   ├── validate-orderInfo/           # order info validation tests
│   ├── validation/                   # email/idcard validation tests
│   ├── plan/                         # plan display tests
│   ├── api/                          # API tests
│   └── fixtures/                     # test data files (images, JSON)
│
├── runner/                           # Custom web UI runner
│   ├── server.js                     # Node.js HTTP server
│   └── index.html                    # Dashboard UI
│
├── playwright.config.ts              # Playwright config
└── package.json
```

---

## 🚀 การตั้งค่าเริ่มต้น

```bash
npm install
npx playwright install chromium     # ติดตั้ง browser (ครั้งแรก)
```

### Environment variables

เลือก env ผ่าน `TEST_ENV`:
```bash
TEST_ENV=dev npx playwright test    # default
TEST_ENV=uat npx playwright test
TEST_ENV=pre npx playwright test
```

URL host ต่อ env (ดูใน [helpers/config.js](helpers/config.js)):
| ENV | Host |
|---|---|
| `dev` | https://dev-heygoody.areetech.io |
| `uat` | https://uat-heygoody.areetech.io |
| `pre` | https://securecart.pre.heygoody.com |

---

## 🧪 การรัน Test

### รันทั้งหมด
```bash
npx playwright test
```

### รันเฉพาะไฟล์
```bash
npx playwright test tests/e2e/longterm/longterm-e2e-non-ev.spec.js
```

### รันเฉพาะ test name
```bash
npx playwright test --grep "bymyself flow"
```

### Project (browser)
จาก [playwright.config.ts](playwright.config.ts):
- `chromium` (Desktop Chrome)
- `iPhone 13 Safari`

```bash
npx playwright test --project=chromium
```

### UI Mode (Playwright official UI)
```bash
npx playwright test --ui
```

### Custom Web Runner
```bash
npm run runner
# เปิด http://localhost:3333
```

ดูรายละเอียดใน [Web Runner](#web-runner) ด้านล่าง

---

## 🎯 Test Flow มาตรฐาน

แต่ละ spec file (ของ longterm/shortterm/juristic) มี **5 tests มาตรฐาน**:

| # | Test | คำอธิบาย |
|---|---|---|
| 1 | `bymyself flow` | ซื้อให้ตัวเอง — driver = ผู้เอาประกัน |
| 2 | `by for others flow` | ซื้อให้คนอื่น + manual driver 1 คน |
| 3 | `add 5 drivers flow` | for-others + เพิ่ม driver เป็นไทย 5 คน |
| 4 | `add 5 foreign drivers flow` | for-others + เพิ่ม driver ต่างชาติ 5 คน |
| 5 | `bymyself add Thai+foreign drivers flow` | bymyself + driver 1 ไทย + 1 ต่างชาติ |

ครอบคลุม edge cases:
- ✅ ซื้อให้ตัวเอง vs คนอื่น
- ✅ จำนวน driver 1 → 5 คน (max)
- ✅ สัญชาติไทย/ต่างชาติ
- ✅ Mixed (ไทย + ต่างชาติ)

---

## 📂 Test Files

### Long-term Individual ([tests/e2e/longterm/](tests/e2e/longterm/))
| ไฟล์ | รถ | หมายเหตุ |
|---|---|---|
| `longterm-e2e-non-ev.spec.js` | รถเก๋ง/กระบะ 4 ประตู/ตู้ ≤7 ที่นั่ง | flow มาตรฐาน |
| `longterm-e2e-ev.spec.js` | EV ≤7 ที่นั่ง | + engine number, test 2 มี CMI selection |
| `longterm-e2e-pickup.spec.js` | กระบะ 2 ประตู | + custom accordion หลัง submodel |
| `longterm-e2e-van.spec.js` | รถตู้ >7 ที่นั่ง | flow มาตรฐาน |
| `affiliateLT-e2e-*.spec.js` | (legacy) | affiliate flow with sale_channel param |

### Short-term Individual ([tests/e2e/shortterm/](tests/e2e/shortterm/))
| ไฟล์ | หมายเหตุ |
|---|---|
| `shortterm-e2e-non-ev.spec.js` | ST flow: ไม่มี car type, province, birth year — ต้องเลือก province จดทะเบียนรถเอง |

### Juristic ([tests/e2e/juristic/](tests/e2e/juristic/))
| ไฟล์ | หมายเหตุ |
|---|---|
| `lt-juristic-e2e-non-ev.spec.js` | นิติบุคคล: ต้องกรอกข้อมูลบริษัท + ผู้เซ็นรับรอง (signatory) |
| `lt-juristic-e2e-ev.spec.js` | นิติบุคคล EV |

---

## 🛠️ Shared Helpers

### [helpers/config.js](helpers/config.js)
Environment config + URLs

```js
const { urls } = require('./helpers/config');
const baseURL = urls.ltIndividualQuote;   // → https://<host>/th/auto-insurance/lt-individual/new/quote
```

URLs ที่มี: `home`, `ltIndividualQuote`, `ltIndividualPlan`, `ltJuristicQuote`, `ltJuristicCar`, `stIndividualQuote`, `affiliateLTCar(qs)`, `affiliateLTEvCar(qs)`

### [helpers/test-data.js](helpers/test-data.js)
ข้อมูลทดสอบทั้งหมด — ปรับครั้งเดียว ส่งผลทุก test

```js
const { insured, driver, foreignDriver, address, juristic } = require('./helpers/test-data');
```

| หมวด | Fields |
|---|---|
| `insured` | email, phone |
| `driver` | email, phone, idCard, license, name, lastName |
| `foreignDriver` | email, phone, passport, license, name, lastName |
| `address` | houseNo, village, moo, alley, street, zipcode |
| `juristic` | companyName, branch |

### [helpers/quote-helper-random.js](helpers/quote-helper-random.js)
Quote form selection + retry logic

| Function | คำอธิบาย |
|---|---|
| `goToQuoteWithRetry(page, baseURL, options)` | **หลัก** — quote flow ครบ + retry สูงสุด 5 รอบเมื่อไม่เจอแผน |
| `selectSedanCarType(page)` | เลือก sedan (id0) |
| `selectSedanCarTypeEV(page)` | เลือก EV (id1) |
| `selectSedanCarTypePickup(page)` | เลือก pickup (id2) |
| `selectSedanCarTypeVan(page)` | เลือก van (id3) |
| `selectSedanCarTypeJuristic(page)` | เลือก sedan (juristic — text-based) |
| `selectSedanCarTypeEVJuristic(page)` | เลือก EV (juristic — text-based) |
| `selectCustomAccordionPickup(page)` | accordion ของ pickup หลัง submodel |
| `selectRandomBrand/Model/Year/Submodel/Province/Insurer/BirthYear` | สุ่มเลือกจาก list |
| `selectStartDate(page, date)` | เลือกวันเริ่มคุ้มครอง (default `'2026-05-28'`) |
| `submitQuote(page)` | กดปุ่ม "ดูแผนประกันของคุณ" |
| `generatePlateAdvanced()` | สุ่มทะเบียนรถ format `1เฮ้xxx${time}` |

#### `goToQuoteWithRetry` options
```js
await goToQuoteWithRetry(page, baseURL, {
    maxAttempts: 5,
    selectCarType: selectSedanCarType,    // null = ข้าม (เช่น ST)
    afterSubmodel: null,                  // hook (เช่น pickup ใช้ selectCustomAccordionPickup)
    beforeSubmit: null,                   // hook ก่อนกด "ดูแผน" (เช่น EV เลือก CMI)
    skipProvince: false,                  // ST: true
    skipBirthYear: false,                 // ST/juristic: true
    skipStartDate: false,                 // (เผื่อ flow ที่ auto-fill)
    welcomeText: 'เปรียบเทียบประกันรถง่ายๆ กับ heygoody',  // ST/juristic ใช้ข้อความต่าง
});
```

#### Retry logic
- ถ้าเจอ "เรายังไม่มีแผนประกันสำหรับรถคุณ" → กด "กลับสู่หน้าหลัก" → retry สุ่มใหม่
- ถ้า form filling fail (เช่น list ว่าง) → retry
- ถ้า "ตัวกรอง" ขึ้นแต่ไม่มี "แผนแนะนำ" → retry
- Throw error เมื่อครบ `maxAttempts`

### [helpers/orferinfo-form-helpers.js](helpers/orferinfo-form-helpers.js)
Form filling helpers สำหรับหน้า order info

#### หมวด: Tab/Buy
| Function | คำอธิบาย |
|---|---|
| `selectBuyForMyself(page)` | คลิกแท็บ "ซื้อให้ตัวเอง" + รอ field พร้อม |
| `selectBuyForOthers(page)` | คลิกแท็บ "ซื้อให้คนอื่น" |

#### หมวด: Popup handling (graceful — ไม่ fail ถ้าไม่มี popup)
| Function | คำอธิบาย |
|---|---|
| `closeLoginPopup(page)` | ปิด login popup (ใช้ `data-slot="dialog-close"`) |
| `closeEmailPopup(page)` | ปิด email signup popup (รองรับ 2 รูปแบบ) |

#### หมวด: Field filling
| Function | คำอธิบาย |
|---|---|
| `humanFillText(input, value, options)` | พิมพ์ทีละตัวอักษร (simulate user) — รองรับ delay, normalize, blur |
| `fillAndBlur(input, value, delay)` | กรอก + blur (พื้นฐาน) |
| `selectRandomTitleName(page)` | สุ่มคำนำหน้าชื่อ |
| `selectRadioByLabel(page, forId)` | คลิก radio ตาม label |
| `selectAddressOption(page, triggerId)` | เลือก option จาก combobox (ที่อยู่) |
| `randomSelectColor(page, selectId)` | สุ่มเลือกสีรถ |
| `maybeSelectCarColor(page)` | เลือกสีถ้ามี — ข้ามถ้าไม่มี (EV/ST flow) |
| `maybeFillRegisteredProvince(page)` | เลือกจังหวัดจดทะเบียนถ้ามี (ST flow) |
| `pickDateOfBirth(page)` | เปิด date picker → เลือกวันที่ enabled → ยืนยัน (รองรับทั้ง LT data-day และ ST aria-label) |

#### หมวด: Composite forms (กรอกทั้ง section)
| Function | คำอธิบาย |
|---|---|
| `fillAddressInfo(page, address, openButtonId)` | เปิด accordion → กรอก 6 fields → save |
| `fillDriverInfoManual(page, driver, options)` | driver แรก: open accordion + manual radio + กรอก dialog |
| `addAdditionalDriver(page, driver, options)` | driver 2-5: คลิก "เพิ่มผู้ขับขี่" + กรอก dialog |
| `fillJuristicCompanyInfo(page, data)` | ข้อมูลบริษัท: เลขนิติ + คำนำหน้า + ชื่อบริษัท + สาขา + วันจดทะเบียน |
| `fillJuristicSignatory(page, data)` | ผู้เซ็นรับรอง: เลขบัตร + คำนำหน้า + ชื่อ + นามสกุล + วันเกิด |

#### หมวด: Generators (สุ่มข้อมูลทดสอบ)
| Function | คำอธิบาย |
|---|---|
| `generateRandomThaiName(prefix)` | ชื่อไทย (default prefix `'ทดสอบ'`) |
| `generateRandomThaiLastName(prefix)` | นามสกุลไทย |
| `generateThaiIDCard()` | เลขบัตรไทย 13 หลัก (มี checksum) |
| `generateUniqueThaiIDCard()` | เลขบัตรไทยไม่ซ้ำในรอบ run |
| `generateUniqueLicense()` | เลขใบขับขี่ 13 หลัก ไม่ซ้ำ |
| `generateUniquePassport()` | passport: 2 ตัวอักษร + 7 ตัวเลข ไม่ซ้ำ |
| `generateUniqueJuristicId()` | เลขนิติบุคคล 13 หลัก (checksum) ไม่ซ้ำ |
| `generateChassisNumber()` | เลขตัวถัง: `AUTOHEY${YYYYMMDD}${SS}` |
| `generateEngineNumber()` | เลขเครื่องยนต์ EV: `EVENG${YYYYMMDD}${SS}` |

#### Driver options (สำหรับ `fillDriverInfoManual` / `addAdditionalDriver`)
```js
await fillDriverInfoManual(page, driverData, { foreign: true });
// foreign: true → คลิกแท็บ "ต่างชาติ" + กรอก passport แทน idCard
```

---

## 📝 ตัวอย่าง Test (LT individual non-ev — bymyself)

```js
const { test, expect } = require('@playwright/test');
const {
    goToQuoteWithRetry,
    generatePlateAdvanced,
} = require('../../../helpers/quote-helper-random');
const { insured, driver, address } = require('../../../helpers/test-data');
const { urls } = require('../../../helpers/config');
import {
    selectBuyForMyself,
    closeLoginPopup,
    closeEmailPopup,
    testValidValues,
    selectRandomTitleName,
    generateRandomThaiName,
    generateRandomThaiLastName,
    generateUniqueThaiIDCard,
    generateUniqueLicense,
    generateChassisNumber,
    humanFillText,
    selectRadioByLabel,
    openAccordionByText,
    fillAddressInfo,
    randomSelectColor,
    pickDateOfBirth,
} from '../../../helpers/orferinfo-form-helpers';

const baseURL = urls.ltIndividualQuote;

test('heygoody longterm e2e non-ev bymyself flow', async ({ page }) => {
    test.setTimeout(120_000);

    // 1. quote selection (พร้อม retry ถ้าไม่เจอแผน)
    await goToQuoteWithRetry(page, baseURL);

    // 2. ปิด popups
    await closeLoginPopup(page);

    // 3. เลือกแผนแนะนำ + checkout
    const recommendedCard = page.locator('#insurance-coverage-head-component-id')
        .filter({ hasText: 'แผนแนะนำ' }).locator('..');
    await recommendedCard.locator('#choose-plan-button-id').click();
    await page.locator('#checkout-button-id').click();

    // 4. ปิด email popup + เลือกซื้อให้ตัวเอง
    await closeEmailPopup(page);
    await selectBuyForMyself(page);

    // 5. กรอกข้อมูลผู้เอาประกัน
    await testValidValues(page, page.locator('#insured-id-card-input-id'),
        [generateUniqueThaiIDCard()]);
    await selectRandomTitleName(page);
    await humanFillText(page.locator('#insured-name-input-id'), generateRandomThaiName());
    await humanFillText(page.locator('#insured-last-name-input-id'),
        generateRandomThaiLastName('เฮกู้ดดี้'));
    await pickDateOfBirth(page);
    await humanFillText(page.locator('#insured-email-input-id'), insured.email);
    await humanFillText(page.locator('#insured-confirm-email-input-id'), insured.email);
    // ... phone

    // 6. driver = ตัวเอง
    await selectRadioByLabel(page, 'driver1-insured-radio-id');
    await humanFillText(page.locator('#driver1-license-input-id'), generateUniqueLicense());

    // 7. ที่อยู่ + ข้อมูลรถ
    await fillAddressInfo(page, address, 'address-information-header-id');
    await openAccordionByText(page, 'ข้อมูลรถ');
    await humanFillText(page.locator('#license-plate-id'), await generatePlateAdvanced());
    await humanFillText(page.locator('#chassis-number-id'), generateChassisNumber());
    await randomSelectColor(page, 'car-color-id');

    // 8. Next + assert OTP dialog
    await page.locator('#next-button-id').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
});
```

---

## 🌐 Web Runner

UI สำหรับเลือก/รัน test ผ่าน browser

```bash
npm run runner
# เปิด http://localhost:3333
```

### Features
- 📋 Cards แยกตามประเภท (LT Individual / LT Juristic / Short Term)
- ▶️ Run ทั้งไฟล์ หรือ test เดี่ยวๆ ได้
- 📊 Sidebar แสดง history + pass/fail per test
- 📡 Real-time output ผ่าน Server-Sent Events
- ⏹ Stop button kill child process
- 🎨 Light theme (white-green minimal)

### API endpoints (server.js)
| Endpoint | คำอธิบาย |
|---|---|
| `GET /` | UI page |
| `GET /api/tests` | รายการ test ของแต่ละ spec file |
| `GET /api/run?file=X&test=Y&project=Z` | SSE stream — รัน test |

---

## ➕ การเพิ่ม Test ใหม่

### Pattern: เพิ่ม spec file ใหม่ตาม flow มาตรฐาน

1. **เลือก template** ที่ใกล้เคียงที่สุด เช่น clone `longterm-e2e-non-ev.spec.js`
2. **ปรับ option** ของ `goToQuoteWithRetry`:
   - **EV**: `{ selectCarType: selectSedanCarTypeEV }` + `beforeSubmit` (ถ้ามี CMI)
   - **Pickup**: `{ selectCarType: selectSedanCarTypePickup, afterSubmodel: selectCustomAccordionPickup }`
   - **Van**: `{ selectCarType: selectSedanCarTypeVan }`
   - **ST**: `{ selectCarType: null, skipProvince: true, skipBirthYear: true, welcomeText: 'เช็คเบี้ยประกันรถยนต์ระยะสั้น' }`
   - **Juristic**: `{ selectCarType: selectSedanCarTypeJuristic, skipBirthYear: true, welcomeText: 'เช็คเบี้ยประกันรถนิติบุคคล' }`
3. **เพิ่ม test data ใหม่** ใน `helpers/test-data.js` ถ้าต้องการ
4. **อัปเดต `runner/index.html`** เพิ่ม card ใน TESTS map (ถ้าใช้ runner)

### Pattern: ทำ flow ใหม่ที่ต่างจาก 5 tests มาตรฐาน

- ใช้ helper เดิมเท่าที่ใช้ได้
- ถ้าต้องเพิ่ม helper ใหม่ ใส่ใน `orferinfo-form-helpers.js` (form-related) หรือ `quote-helper-random.js` (quote-related)
- ตั้งชื่อ helper ตาม convention: `fill*`, `select*`, `close*`, `pick*`, `maybe*` (optional fields)

---

## 🔧 Troubleshooting

### Test fail ที่ `data-day*="/28/"`
- **อาการ**: timeout เลือกวันที่ในปฏิทิน
- **สาเหตุ**: วันที่ใกล้ปัจจุบันอาจ disabled (อายุไม่ถึงเกณฑ์ใน DOB picker)
- **แก้**: ใช้ helper `pickDateOfBirth(page)` แทน inline locator — มี `:not([disabled])` filter + fallback aria-label

### Test fail ที่ `#title-name-select-id` (juristic flow)
- **สาเหตุ**: juristic personal title ใช้ ID อื่น (`getByRole('combobox', { name: 'คำนำหน้าชื่อ' })`)
- **แก้**: helper `fillJuristicSignatory` ใช้ accessible name แล้ว

### Popup ไม่ปิด → typing ไม่เข้า field
- **สาเหตุ**: popup login/email ขึ้นช้ากว่า timeout ของ closer
- **แก้**: `closeLoginPopup` / `closeEmailPopup` เป็น graceful — เรียกซ้ำได้ ไม่มี side effect
- ทั้ง `fillJuristicCompanyInfo` / `fillJuristicSignatory` มี defensive `closeEmailPopup` ที่ต้นแล้ว

### "เรายังไม่มีแผนประกันสำหรับรถคุณ"
- **อาการ**: ไม่มีแผนสำหรับ brand/model ที่สุ่มได้
- **แก้**: `goToQuoteWithRetry` retry อัตโนมัติ (max 5 ครั้ง) — สุ่มใหม่หรือกดกลับหน้าหลัก

### `generateUniqueXxx` ซ้ำในรอบ run ยาวๆ
- **สาเหตุ**: Set tracking ไม่ persist ข้าม test files
- **ผลกระทบ**: น้อยมาก (random space กว้างพอ) — ถ้าเจอเพิ่ม retry logic ใน generator

### Field auto-format (เช่น เลขบัตร ปชช ใส่ขีด)
- **อาการ**: typed `"1234567890123"` แต่ value กลายเป็น `"1-2345-67890-12-3"`
- **แก้**: ส่ง `normalize: v => v.replace(/\D/g, '')` ใน `humanFillText`

### Multiple inputs id เดียวกัน (juristic page)
- **อาการ**: strict mode violation
- **แก้**: filter ด้วย `name` attribute (เช่น `input[name="juristicId"]`) แทน `#id`

---

## 📦 Tech stack

- **Playwright** ~1.56.0
- **Node.js** (commonjs + ES module imports mixed)
- **เบราว์เซอร์**: Chromium + iPhone 13 Safari (configurable)

ดู `package.json` สำหรับ dependencies ทั้งหมด

---

## 📜 Scripts

```bash
npm run runner          # web UI runner
npx playwright test     # รัน Playwright ปกติ
npx playwright test --ui   # Playwright UI mode
npx playwright show-report  # ดู report ครั้งล่าสุด
```

---

## 🤝 การ contribute

1. ทำ branch แยก
2. เพิ่ม/แก้ test
3. รัน `npx playwright test` ให้ผ่านก่อน push
4. Commit แล้ว create PR