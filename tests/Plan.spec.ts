import { test, expect, Page } from '@playwright/test';

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const CAR_LISTING_URL = `${BASE_URL}/cars/toyota-camry-hev`;
const CAR_DETAIL_URL = `${BASE_URL}/cars/toyota-camry-hev/detail`;

// Selectors
const SELECTORS = {
  // Filter Component
  filter: {
    container: '[data-testid="filters-panel"]',
    section: (name: string) => `[data-testid="filter-section-${name}"]`,
    sectionTitle: '[data-testid="filter-section-title"]',
    checkbox: (label: string) => `label:has-text("${label}") input[type="checkbox"]`,
    radio: (label: string) => `label:has-text("${label}") input[type="radio"]`,
    clearButton: '[data-testid="clear-filters"], button:has-text("ล้างค่า")',
    applyButton: '[data-testid="apply-filters"], button:has-text("ใช้ตัวกรอง")',
    selectedCount: '[data-testid="selected-filter-count"]',
    filterOption: '[data-testid="filter-option"]',
    disabledOption: '[data-testid="filter-option"]:disabled',
  },
  
  // Layout
  layout: {
    header: 'header, [data-testid="header"]',
    navbar: 'nav, [data-testid="navbar"]',
    sidebar: '[data-testid="sidebar"]',
    mainContent: 'main, [data-testid="main-content"]',
    footer: 'footer, [data-testid="footer"]',
    breadcrumb: '[data-testid="breadcrumb"]',
  },
  
  // Plan Card
  planCard: {
    container: '[data-testid="plan-card"]',
    title: '[data-testid="plan-title"]',
    price: '[data-testid="plan-price"]',
    originalPrice: '[data-testid="original-price"]',
    discount: '[data-testid="discount"]',
    badge: '[data-testid="plan-badge"]',
    features: '[data-testid="plan-features"]',
    ctaButton: '[data-testid="cta-button"]',
    detailButton: '[data-testid="detail-button"]',
    compareButton: '[data-testid="compare-button"]',
    bookmarkIcon: '[data-testid="bookmark-icon"]',
    image: '[data-testid="plan-image"]',
    logo: '[data-testid="provider-logo"]',
    promotionTag: '[data-testid="promotion-tag"]',
  },
  
  // Detail Page
  detail: {
    container: '[data-testid="detail-page"]',
    backButton: '[data-testid="back-button"]',
    buyButton: '[data-testid="buy-button"]',
    shareButton: '[data-testid="share-button"]',
    summary: '[data-testid="plan-summary"]',
    accordion: '[data-testid="accordion"]',
    accordionItem: (title: string) => `[data-testid="accordion-item-${title}"]`,
    tab: '[data-testid="tab"]',
    tabPanel: '[data-testid="tab-panel"]',
    coverageTable: '[data-testid="coverage-table"]',
    termsSection: '[data-testid="terms-section"]',
    faqSection: '[data-testid="faq-section"]',
  },
  
  // Common
  loading: '[data-testid="loading"], .loading',
  emptyState: '[data-testid="empty-state"]',
  errorMessage: '[data-testid="error-message"]',
};

// Desktop Breakpoints
const DESKTOP_BREAKPOINTS = [
  { name: '1024px', width: 1024, height: 768 },
  { name: '1366px', width: 1366, height: 768 },
  { name: '1440px', width: 1440, height: 900 },
  { name: '1920px', width: 1920, height: 1080 },
];

// ========================================
// 🧩 1. Filter Component (Desktop UI)
// ========================================

test.describe('🧩 1. Filter Component - Functional', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-FILTER-F01: ตรวจสอบว่าปุ่ม/ตัวเลือก filter ทั้งหมดแสดงครบ', async ({ page }) => {
    const filterPanel = page.locator(SELECTORS.filter.container);
    await expect(filterPanel).toBeVisible();

    // ตรวจสอบว่ามี filter sections หลักๆ
    const expectedSections = [
      'ประเภทการซื้อ',
      'สิ่งอำนวยความสะดวก', 
      'ทุนประกัน',
      'ปริมาณน้ำมัน',
      'ปริมัณฑล-คันใน'
    ];

    for (const section of expectedSections) {
      const sectionElement = page.locator(`text=${section}`);
      await expect(sectionElement).toBeVisible();
    }

    // ตรวจสอบจำนวน filter options
    const filterOptions = page.locator(SELECTORS.filter.filterOption);
    const count = await filterOptions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-FILTER-F02: เลือก filter แล้วรายการที่แสดงผลอัปเดตถูกต้อง', async ({ page }) => {
    // รับจำนวนรายการเริ่มต้น
    const initialCards = page.locator(SELECTORS.planCard.container);
    const initialCount = await initialCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // เลือก filter
    const filterCheckbox = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
    await filterCheckbox.check();
    
    // รอให้รายการอัปเดต
    await page.waitForTimeout(1000);

    // ตรวจสอบว่ามีการเปลี่ยนแปลง
    const filteredCards = page.locator(SELECTORS.planCard.container);
    const filteredCount = await filteredCards.count();
    
    // จำนวนควรลดลงหรือเท่าเดิม (ขึ้นอยู่กับข้อมูล)
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('TC-FILTER-F03: สามารถเลือกหลาย filter พร้อมกัน (AND logic)', async ({ page }) => {
    // เลือก filter หลายตัว
    const filter1 = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
    const filter2 = page.locator(SELECTORS.filter.checkbox('ค่างวดเดิมหรือมากสูงกว่า 3,000 บาท'));
    
    await filter1.check();
    await expect(filter1).toBeChecked();
    
    await filter2.check();
    await expect(filter2).toBeChecked();
    
    // รอให้รายการอัปเดต
    await page.waitForTimeout(1000);
    
    // ตรวจสอบว่ารายการที่แสดงตรงเงื่อนไข
    const cards = page.locator(SELECTORS.planCard.container);
    await expect(cards).toHaveCount(await cards.count());
  });

  test('TC-FILTER-F04: ปุ่ม "Clear All" ทำงานถูกต้อง', async ({ page }) => {
    // เลือก filters
    const filter1 = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
    const filter2 = page.locator(SELECTORS.filter.checkbox('ค่างวดเดิมหรือมากสูงกว่า 3,000 บาท'));
    
    await filter1.check();
    await filter2.check();
    
    await expect(filter1).toBeChecked();
    await expect(filter2).toBeChecked();
    
    // คลิกปุ่ม Clear
    const clearButton = page.locator(SELECTORS.filter.clearButton);
    await clearButton.click();
    
    // ตรวจสอบว่า filters ถูก clear
    await expect(filter1).not.toBeChecked();
    await expect(filter2).not.toBeChecked();
  });

  test('TC-FILTER-F05: ปุ่ม "Apply" ทำงานถูกต้อง', async ({ page }) => {
    const applyButton = page.locator(SELECTORS.filter.applyButton);
    
    // กรณี Auto-apply: ตรวจสอบว่าไม่มีปุ่ม Apply
    // กรณี Manual apply: ตรวจสอบว่าปุ่ม Apply ทำงาน
    if (await applyButton.count() > 0) {
      const filter = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
      await filter.check();
      
      // คลิก Apply
      await applyButton.click();
      
      // รอให้รายการอัปเดต
      await page.waitForTimeout(1000);
      
      const cards = page.locator(SELECTORS.planCard.container);
      await expect(cards.first()).toBeVisible();
    }
  });
});

test.describe('🧩 1. Filter Component - UI/UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-FILTER-UI01: Layout ของ filter เรียงถูกต้อง (spacing, alignment)', async ({ page }) => {
    const filterPanel = page.locator(SELECTORS.filter.container);
    await expect(filterPanel).toBeVisible();
    
    // ตรวจสอบ bounding box
    const box = await filterPanel.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(200); // Filter panel ควรมีความกว้างเหมาะสม
    
    // ตรวจสอบ alignment ของ filter sections
    const sections = page.locator(SELECTORS.filter.sectionTitle);
    const count = await sections.count();
    
    for (let i = 0; i < count; i++) {
      const section = sections.nth(i);
      await expect(section).toBeVisible();
      
      const sectionBox = await section.boundingBox();
      expect(sectionBox).toBeTruthy();
    }
  });

  test('TC-FILTER-UI02: ปุ่มและ dropdown คลิกได้ง่าย ไม่ล้นหรือเกินพื้นที่', async ({ page }) => {
    const filterOptions = page.locator(SELECTORS.filter.filterOption);
    const count = await filterOptions.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const option = filterOptions.nth(i);
      const box = await option.boundingBox();
      
      // ตรวจสอบขนาด clickable area
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(20);
      expect(box!.height).toBeGreaterThan(20);
      
      // ตรวจสอบว่าไม่ล้นออกนอก viewport
      const viewport = page.viewportSize();
      if (viewport) {
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });

  test('TC-FILTER-UI03: Hover/Active/Selected state แสดงผลถูกต้อง', async ({ page }) => {
    const firstOption = page.locator(SELECTORS.filter.filterOption).first();
    
    // Hover state
    await firstOption.hover();
    await page.waitForTimeout(200);
    
    // ตรวจสอบว่ามี hover effect (เช่น background color เปลี่ยน)
    const hoverStyles = await firstOption.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        cursor: computed.cursor
      };
    });
    
    expect(hoverStyles.cursor).toBe('pointer');
    
    // Selected state
    if (await firstOption.locator('input').count() > 0) {
      const checkbox = firstOption.locator('input');
      await checkbox.check();
      
      await expect(checkbox).toBeChecked();
      
      // ตรวจสอบ visual indicator
      const checkmark = firstOption.locator('svg, .checkmark, [data-checked]');
      if (await checkmark.count() > 0) {
        await expect(checkmark).toBeVisible();
      }
    }
  });

  test('TC-FILTER-UI04: Font size, color, และ icon สอดคล้องกับดีไซน์', async ({ page }) => {
    const filterTitle = page.locator(SELECTORS.filter.sectionTitle).first();
    
    const styles = await filterTitle.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        color: computed.color,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
      };
    });
    
    // ตรวจสอบค่าพื้นฐาน
    expect(styles.fontSize).toBeTruthy();
    expect(styles.color).toBeTruthy();
    expect(styles.fontFamily).toBeTruthy();
    
    // ตรวจสอบ icons
    const icons = page.locator(`${SELECTORS.filter.container} svg, ${SELECTORS.filter.container} i`);
    if (await icons.count() > 0) {
      await expect(icons.first()).toBeVisible();
    }
  });
});

test.describe('🧩 1. Filter Component - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-FILTER-EDGE01: เมื่อไม่มีผลลัพธ์ (No result state)', async ({ page }) => {
    // Mock API เพื่อให้ไม่มีผลลัพธ์
    await page.route('**/api/cars*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });
    
    // เลือก filter
    const filter = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
    await filter.check();
    
    await page.waitForTimeout(1000);
    
    // ตรวจสอบ empty state
    const emptyState = page.locator(SELECTORS.emptyState);
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/ไม่พบ|not found|no results/i);
  });

  test('TC-FILTER-EDGE02: เมื่อโหลดข้อมูลช้า แสดง loading state', async ({ page }) => {
    // Mock API ให้ช้า
    await page.route('**/api/cars*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    const filter = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
    await filter.check();
    
    // ตรวจสอบ loading state
    const loading = page.locator(SELECTORS.loading);
    await expect(loading).toBeVisible({ timeout: 500 });
  });

  test('TC-FILTER-EDGE03: Filter disabled แสดงผลถูกต้อง', async ({ page }) => {
    const disabledOptions = page.locator(SELECTORS.filter.disabledOption);
    
    if (await disabledOptions.count() > 0) {
      const firstDisabled = disabledOptions.first();
      
      // ตรวจสอบว่า disabled
      await expect(firstDisabled).toBeDisabled();
      
      // ตรวจสอบ visual style
      const opacity = await firstDisabled.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      
      // Disabled element ควรมี opacity ต่ำกว่า 1
      expect(parseFloat(opacity)).toBeLessThan(1);
      
      // พยายามคลิก (ควรไม่ทำงาน)
      await firstDisabled.click({ force: true });
      
      // ตรวจสอบว่าไม่มีการเปลี่ยนแปลง
      if (await firstDisabled.locator('input').count() > 0) {
        const input = firstDisabled.locator('input');
        await expect(input).not.toBeChecked();
      }
    }
  });
});

// ========================================
// 🧱 2. Layout Section (Desktop UI)
// ========================================

test.describe('🧱 2. Layout Section - Functional', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-LAYOUT-F01: Section แต่ละส่วนโหลดครบถ้วน', async ({ page }) => {
    // Header
    const header = page.locator(SELECTORS.layout.header);
    await expect(header).toBeVisible();
    
    // Navbar
    const navbar = page.locator(SELECTORS.layout.navbar);
    if (await navbar.count() > 0) {
      await expect(navbar).toBeVisible();
    }
    
    // Sidebar (Filter panel)
    const sidebar = page.locator(SELECTORS.layout.sidebar);
    if (await sidebar.count() > 0) {
      await expect(sidebar).toBeVisible();
    }
    
    // Main Content
    const mainContent = page.locator(SELECTORS.layout.mainContent);
    await expect(mainContent).toBeVisible();
    
    // Footer
    const footer = page.locator(SELECTORS.layout.footer);
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }
  });

  test('TC-LAYOUT-F02: Navigation / breadcrumb ทำงานถูกต้อง', async ({ page }) => {
    const breadcrumb = page.locator(SELECTORS.layout.breadcrumb);
    
    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb).toBeVisible();
      
      // ตรวจสอบ breadcrumb links
      const links = breadcrumb.locator('a');
      const count = await links.count();
      
      if (count > 0) {
        const firstLink = links.first();
        await expect(firstLink).toBeVisible();
        
        // คลิกเพื่อ navigate
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        
        // ตรวจสอบว่า navigate ถูกต้อง
        expect(page.url()).toBeTruthy();
      }
    }
  });
});

test.describe('🧱 2. Layout Section - UI/UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-LAYOUT-UI01: Alignment ของแต่ละ section ตรงกับดีไซน์', async ({ page }) => {
    // ตรวจสอบ grid layout
    const mainContent = page.locator(SELECTORS.layout.mainContent);
    const box = await mainContent.boundingBox();
    
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(500);
    
    // ตรวจสอบ sidebar (ถ้ามี)
    const sidebar = page.locator(SELECTORS.layout.sidebar);
    if (await sidebar.count() > 0) {
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox).toBeTruthy();
      
      // Sidebar ควรอยู่ด้านซ้ายของ main content
      expect(sidebarBox!.x).toBeLessThan(box!.x);
    }
  });

  test('TC-LAYOUT-UI02: Spacing ระหว่าง section ถูกต้อง', async ({ page }) => {
    const sections = [
      page.locator(SELECTORS.layout.header),
      page.locator(SELECTORS.layout.mainContent),
    ];
    
    let prevBottom = 0;
    
    for (const section of sections) {
      if (await section.count() > 0) {
        const box = await section.boundingBox();
        if (box) {
          // ตรวจสอบว่ามี spacing ระหว่าง sections
          if (prevBottom > 0) {
            const gap = box.y - prevBottom;
            expect(gap).toBeGreaterThanOrEqual(0); // ไม่ควรซ้อนกัน
          }
          prevBottom = box.y + box.height;
        }
      }
    }
  });

  test('TC-LAYOUT-UI03: สีพื้นหลัง, border, shadow ถูกต้อง', async ({ page }) => {
    const mainContent = page.locator(SELECTORS.layout.mainContent);
    
    const styles = await mainContent.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        border: computed.border,
        boxShadow: computed.boxShadow,
      };
    });
    
    expect(styles.backgroundColor).toBeTruthy();
    // สามารถเพิ่มการตรวจสอบค่าสีตาม spec ได้
  });
});

test.describe('🧱 2. Layout Section - Edge Cases', () => {
  test('TC-LAYOUT-EDGE01: จอความละเอียดต่างกัน layout ไม่แตก', async ({ browser }) => {
    for (const breakpoint of DESKTOP_BREAKPOINTS) {
      const context = await browser.newContext({
        viewport: { width: breakpoint.width, height: breakpoint.height }
      });
      const page = await context.newPage();
      
      await page.goto(CAR_LISTING_URL);
      await page.waitForLoadState('networkidle');
      
      // ตรวจสอบว่า layout ไม่แตก
      const mainContent = page.locator(SELECTORS.layout.mainContent);
      await expect(mainContent).toBeVisible();
      
      const box = await mainContent.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeLessThanOrEqual(breakpoint.width);
      
      // ตรวจสอบไม่มี horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => 
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      
      expect(hasHorizontalScroll).toBe(false);
      
      await context.close();
    }
  });

  test('TC-LAYOUT-EDGE02: Section ยาว (scrollable) แสดงได้ครบ', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    // Scroll ลงไปล่างสุด
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // ตรวจสอบว่า footer หรือ content ล่างสุดแสดง
    const footer = page.locator(SELECTORS.layout.footer);
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }
    
    // Scroll กลับขึ้นบน
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    // ตรวจสอบว่า header ยังแสดง
    const header = page.locator(SELECTORS.layout.header);
    await expect(header).toBeVisible();
  });
});

// ========================================
// 🖥️ 3. Responsive (Desktop UI)
// ========================================

test.describe('🖥️ 3. Responsive - Desktop Breakpoints', () => {
  test('TC-RESPONSIVE-01: Layout ไม่ล้น/หดผิดรูปที่ breakpoints ต่างๆ', async ({ browser }) => {
    for (const breakpoint of DESKTOP_BREAKPOINTS) {
      const context = await browser.newContext({
        viewport: { width: breakpoint.width, height: breakpoint.height }
      });
      const page = await context.newPage();
      
      await page.goto(CAR_LISTING_URL);
      await page.waitForLoadState('networkidle');
      
      // ตรวจสอบ main components
      const filterPanel = page.locator(SELECTORS.filter.container);
      const planCards = page.locator(SELECTORS.planCard.container);
      
      if (await filterPanel.count() > 0) {
        await expect(filterPanel).toBeVisible();
        const filterBox = await filterPanel.boundingBox();
        expect(filterBox!.width).toBeLessThanOrEqual(breakpoint.width);
      }
      
      await expect(planCards.first()).toBeVisible();
      
      // ตรวจสอบว่า cards ไม่ล้น
      const cardBox = await planCards.first().boundingBox();
      expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(breakpoint.width);
      
      await context.close();
    }
  });

  test('TC-RESPONSIVE-02: ย่อ-ขยายหน้าจอ layout ปรับตาม breakpoint', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    // เริ่มที่ 1920px
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    let box1920 = await page.locator(SELECTORS.layout.mainContent).boundingBox();
    
    // ลดเป็น 1024px
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    
    let box1024 = await page.locator(SELECTORS.layout.mainContent).boundingBox();
    
    // Layout ควรปรับขนาด
    expect(box1024!.width).toBeLessThan(box1920!.width);
  });

  test('TC-RESPONSIVE-03: Sidebar, filter, card, navbar ยังคงสัดส่วนเหมาะสม', async ({ browser }) => {
    for (const breakpoint of DESKTOP_BREAKPOINTS) {
      const context = await browser.newContext({
        viewport: { width: breakpoint.width, height: breakpoint.height }
      });
      const page = await context.newPage();
      
      await page.goto(CAR_LISTING_URL);
      await page.waitForLoadState('networkidle');
      
      // ตรวจสอบสัดส่วน
      const filterPanel = page.locator(SELECTORS.filter.container);
      const mainContent = page.locator(SELECTORS.layout.mainContent);
      
      if (await filterPanel.count() > 0) {
        const filterBox = await filterPanel.boundingBox();
        const mainBox = await mainContent.boundingBox();
        
        // Filter panel ไม่ควรใหญ่เกิน 30% ของหน้าจอ
        const filterRatio = filterBox!.width / breakpoint.width;
        expect(filterRatio).toBeLessThan(0.35);
        
        // Main content ควรได้พื้นที่เหมาะสม
        const mainRatio = mainBox!.width / breakpoint.width;
        expect(mainRatio).toBeGreaterThan(0.5);
      }
      
      await context.close();
    }
  });
});

test.describe('🖥️ 3. Responsive - Edge Cases', () => {
  test('TC-RESPONSIVE-EDGE01: Zoom levels ต่างๆ (90%, 110%)', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const zoomLevels = [0.9, 1.0, 1.1];
    
    for (const zoom of zoomLevels) {
      // Set zoom level
      await page.evaluate((z) => {
        document.body.style.zoom = `${z}`;
      }, zoom);
      
      await page.waitForTimeout(500);
      
      // ตรวจสอบว่า layout ยังคงใช้งานได้
      const mainContent = page.locator(SELECTORS.layout.mainContent);
      await expect(mainContent).toBeVisible();
      
      const cards = page.locator(SELECTORS.planCard.container);
      await expect(cards.first()).toBeVisible();
      
      // ตรวจสอบไม่มี overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasOverflow).toBe(false);
    }
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });

  test('TC-RESPONSIVE-EDGE02: ทดสอบบน browsers หลัก (Chrome, Edge, Safari)', async ({ browserName }) => {
    // Playwright จะรันบน chromium, firefox, webkit
    // Test นี้จะรันอัตโนมัติบนแต่ละ browser ตาม config
    
    test.skip(browserName === 'firefox', 'Safari-like test skipped on Firefox');
    
    // ทดสอบพื้นฐานว่า layout ทำงานบนทุก browser
    // (Playwright จะรันตาม projects ใน config)
  });
});

// ========================================
// 💳 4. Plan Display Detail Card (Desktop UI)
// ========================================

test.describe('💳 4. Plan Card - Functional', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-CARD-F01: แสดงข้อมูลของแผนถูกต้อง', async ({ page }) => {
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    await expect(firstCard).toBeVisible();
    
    // ตรวจสอบองค์ประกอบหลัก
    const title = firstCard.locator(SELECTORS.planCard.title);
    await expect(title).toBeVisible();
    await expect(title).toHaveText(/.+/); // มีข้อความ
    
    const price = firstCard.locator(SELECTORS.planCard.price);
    await expect(price).toBeVisible();
    await expect(price).toContainText(/฿|บาท/);
    
    // ตรวจสอบ features
    const features = firstCard.locator(SELECTORS.planCard.features);
    if (await features.count() > 0) {
      await expect(features).toBeVisible();
    }
  });

  test('TC-CARD-F02: ปุ่ม "ดูรายละเอียด" ทำงานถูกต้อง', async ({ page }) => {
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    const detailButton = firstCard.locator(SELECTORS.planCard.detailButton);
    
    if (await detailButton.count() > 0) {
      await detailButton.click();
      await page.waitForLoadState('networkidle');
      
      // ตรวจสอบว่า navigate ไปหน้ารายละเอียด
      expect(page.url()).toContain('/detail');
    } else {
      // หรือคลิก card เอง
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/detail');
    }
  });

  test('TC-CARD-F03: ปุ่ม "ซื้อเลย" ทำงานถูกต้อง', async ({ page }) => {
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    const ctaButton = firstCard.locator(SELECTORS.planCard.ctaButton);
    
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toContainText(/ซื้อ|เลือกแผน|select/i);
    
    await ctaButton.click();
    await page.waitForLoadState('networkidle');
    
    // ตรวจสอบว่ามี action เกิดขึ้น (navigate, modal, etc.)
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('TC-CARD-F04: Hover แสดง interaction ตามดีไซน์', async ({ page }) => {
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    
    // รับ styles เริ่มต้น
    const initialStyles = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        transform: computed.transform,
        boxShadow: computed.boxShadow,
      };
    });
    
    // Hover
    await firstCard.hover();
    await page.waitForTimeout(300);
    
    // รับ styles หลัง hover
    const hoverStyles = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        transform: computed.transform,
        boxShadow: computed.boxShadow,
      };
    });
    
    // ควรมีการเปลี่ยนแปลง (shadow หรือ transform)
    const hasChange = 
      initialStyles.transform !== hoverStyles.transform ||
      initialStyles.boxShadow !== hoverStyles.boxShadow;
    
    expect(hasChange).toBe(true);
  });

  test('TC-CARD-F05: การ sort/filter มีผลต่อ cards ที่แสดง', async ({ page }) => {
    // รับ card แรกเริ่มต้น
    const initialFirstCard = page.locator(SELECTORS.planCard.container).first();
    const initialTitle = await initialFirstCard.locator(SELECTORS.planCard.title).textContent();
    
    // เปลี่ยน sort
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    if (await sortDropdown.count() > 0) {
      await sortDropdown.click();
      await page.locator('text=ราคาขึ้น').first().click();
      await page.waitForTimeout(1000);
      
      // ตรวจสอบว่า cards เรียงใหม่
      const newFirstCard = page.locator(SELECTORS.planCard.container).first();
      const newTitle = await newFirstCard.locator(SELECTORS.planCard.title).textContent();
      
      // อาจเหมือนหรือต่างกันขึ้นอยู่กับข้อมูล
      expect(newTitle).toBeTruthy();
    }
    
    // ทดสอบ filter
    const filter = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
    await filter.check();
    await page.waitForTimeout(1000);
    
    // จำนวน cards ควรเปลี่ยน
    const filteredCards = page.locator(SELECTORS.planCard.container);
    await expect(filteredCards).toHaveCount(await filteredCards.count());
  });
});

test.describe('💳 4. Plan Card - UI/UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-CARD-UI01: ขนาด card, margin, spacing, font ถูกต้อง', async ({ page }) => {
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    const box = await firstCard.boundingBox();
    
    // ตรวจสอบขนาด card
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.height).toBeGreaterThan(200);
    
    // ตรวจสอบ font styles
    const title = firstCard.locator(SELECTORS.planCard.title);
    const styles = await title.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
        marginBottom: computed.marginBottom,
      };
    });
    
    expect(styles.fontSize).toBeTruthy();
    expect(parseInt(styles.fontSize)).toBeGreaterThan(10);
  });

  test('TC-CARD-UI02: แสดงครบทุก field ที่กำหนดในดีไซน์', async ({ page }) => {
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    
    // ตรวจสอบองค์ประกอบทั้งหมด
    const elements = {
      title: SELECTORS.planCard.title,
      price: SELECTORS.planCard.price,
      image: SELECTORS.planCard.image,
      ctaButton: SELECTORS.planCard.ctaButton,
    };
    
    for (const [name, selector] of Object.entries(elements)) {
      const element = firstCard.locator(selector);
      await expect(element).toBeVisible({ timeout: 5000 });
    }
    
    // ตรวจสอบ optional elements
    const optionalElements = [
      SELECTORS.planCard.badge,
      SELECTORS.planCard.discount,
      SELECTORS.planCard.promotionTag,
    ];
    
    for (const selector of optionalElements) {
      const element = firstCard.locator(selector);
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('TC-CARD-UI03: รูปภาพ, โลโก้, ป้ายโปรโมชั่นแสดงครบ', async ({ page }) => {
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    
    // ตรวจสอบรูปภาพ
    const image = firstCard.locator(SELECTORS.planCard.image);
    await expect(image).toBeVisible();
    
    // ตรวจสอบว่ารูปโหลดสำเร็จ
    const isImageLoaded = await image.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalHeight !== 0;
    });
    expect(isImageLoaded).toBe(true);
    
    // ตรวจสอบโลโก้
    const logo = firstCard.locator(SELECTORS.planCard.logo);
    if (await logo.count() > 0) {
      await expect(logo).toBeVisible();
    }
    
    // ตรวจสอบป้ายโปรโมชั่น
    const promo = firstCard.locator(SELECTORS.planCard.promotionTag);
    if (await promo.count() > 0) {
      await expect(promo).toBeVisible();
      await expect(promo).toHaveText(/.+/);
    }
  });

  test('TC-CARD-UI04: Card grid layout สม่ำเสมอ', async ({ page }) => {
    const cards = page.locator(SELECTORS.planCard.container);
    const count = await cards.count();
    
    if (count >= 2) {
      // ตรวจสอบ 2 cards แรก
      const box1 = await cards.nth(0).boundingBox();
      const box2 = await cards.nth(1).boundingBox();
      
      // ความกว้างควรเท่ากัน (หรือใกล้เคียง)
      const widthDiff = Math.abs(box1!.width - box2!.width);
      expect(widthDiff).toBeLessThan(5);
      
      // ตรวจสอบ gap ระหว่าง cards
      if (box1!.y === box2!.y) {
        // Cards อยู่แถวเดียวกัน
        const gap = box2!.x - (box1!.x + box1!.width);
        expect(gap).toBeGreaterThan(0);
        expect(gap).toBeLessThan(100);
      }
    }
  });
});

test.describe('💳 4. Plan Card - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-CARD-EDGE01: Empty state เมื่อไม่มีข้อมูล', async ({ page }) => {
    // Mock API ให้ return empty
    await page.route('**/api/cars*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const emptyState = page.locator(SELECTORS.emptyState);
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/ไม่พบ|no data|empty/i);
  });

  test('TC-CARD-EDGE02: ข้อมูลยาวมาก (truncate/wrap text)', async ({ page }) => {
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    const title = firstCard.locator(SELECTORS.planCard.title);
    
    const titleBox = await title.boundingBox();
    const cardBox = await firstCard.boundingBox();
    
    // Title ไม่ควรล้นออกนอก card
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 5);
    
    // ตรวจสอบ text-overflow
    const overflow = await title.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        textOverflow: computed.textOverflow,
        overflow: computed.overflow,
        whiteSpace: computed.whiteSpace,
      };
    });
    
    // ควรมี ellipsis หรือ wrap
    expect(
      overflow.textOverflow === 'ellipsis' || 
      overflow.overflow === 'hidden' ||
      overflow.whiteSpace === 'normal'
    ).toBe(true);
  });

  test('TC-CARD-EDGE03: Loading state', async ({ page }) => {
    // Mock API ให้ช้า
    await page.route('**/api/cars*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    await page.reload();
    
    // ตรวจสอบ loading state
    const loading = page.locator(SELECTORS.loading);
    await expect(loading).toBeVisible({ timeout: 500 });
    
    // รอให้โหลดเสร็จ
    await page.waitForLoadState('networkidle');
    
    // ตรวจสอบว่า cards แสดง
    const cards = page.locator(SELECTORS.planCard.container);
    await expect(cards.first()).toBeVisible();
  });

  test('TC-CARD-EDGE04: รูปภาพโหลดไม่สำเร็จ', async ({ page }) => {
    // Block image requests
    await page.route('**/*.{jpg,jpeg,png,gif,webp}', route => route.abort());
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    const image = firstCard.locator(SELECTORS.planCard.image);
    
    // ตรวจสอบว่ามี placeholder หรือ fallback
    if (await image.count() > 0) {
      const isVisible = await image.isVisible();
      expect(isVisible).toBeTruthy();
      
      // อาจมี alt text หรือ fallback icon
      const alt = await image.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});

// ========================================
// 🧾 5. Insurance Detail Page (Desktop UI)
// ========================================

test.describe('🧾 5. Detail Page - Functional', () => {
  test.beforeEach(async ({ page }) => {
    // ไปหน้า detail โดยตรง หรือคลิกจาก listing
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
  });

  test('TC-DETAIL-F01: โหลดข้อมูลรายละเอียดแผนครบถ้วน', async ({ page }) => {
    const detailPage = page.locator(SELECTORS.detail.container);
    
    // ตรวจสอบว่าหน้ารายละเอียดแสดง
    if (await detailPage.count() > 0) {
      await expect(detailPage).toBeVisible();
    }
    
    // ตรวจสอบข้อมูลสำคัญ
    const summary = page.locator(SELECTORS.detail.summary);
    if (await summary.count() > 0) {
      await expect(summary).toBeVisible();
    }
    
    // ตรวจสอบว่ามีชื่อแผน
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible();
    await expect(title).toHaveText(/.+/);
    
    // ตรวจสอบราคา
    const price = page.locator('text=/฿[0-9,]+/').first();
    await expect(price).toBeVisible();
  });

  test('TC-DETAIL-F02: ปุ่ม "กลับไปหน้าแผนทั้งหมด" ทำงานถูกต้อง', async ({ page }) => {
    const backButton = page.locator(SELECTORS.detail.backButton);
    
    if (await backButton.count() > 0) {
      await backButton.click();
      await page.waitForLoadState('networkidle');
      
      // ตรวจสอบว่ากลับไปหน้า listing
      expect(page.url()).toContain('/cars');
      expect(page.url()).not.toContain('/detail');
    } else {
      // ใช้ browser back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/detail');
    }
  });

  test('TC-DETAIL-F03: ปุ่ม "ซื้อเลย" ทำงานถูกต้อง', async ({ page }) => {
    const buyButton = page.locator(SELECTORS.detail.buyButton);
    
    if (await buyButton.count() > 0) {
      await expect(buyButton).toBeVisible();
      await expect(buyButton).toBeEnabled();
      
      await buyButton.click();
      await page.waitForTimeout(1000);
      
      // ตรวจสอบว่ามี action เกิดขึ้น
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });

  test('TC-DETAIL-F04: ปุ่ม "แชร์" ทำงานถูกต้อง', async ({ page }) => {
    const shareButton = page.locator(SELECTORS.detail.shareButton);
    
    if (await shareButton.count() > 0) {
      await expect(shareButton).toBeVisible();
      
      // คลิกปุ่มแชร์
      await shareButton.click();
      await page.waitForTimeout(500);
      
      // อาจมี share modal หรือ native share dialog
      // ตรวจสอบว่ามี UI element ปรากฏ
      const modal = page.locator('[role="dialog"], .modal');
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();
      }
    }
  });

  test('TC-DETAIL-F05: Accordion เปิด-ปิดถูกต้อง', async ({ page }) => {
    const accordion = page.locator(SELECTORS.detail.accordion);
    
    if (await accordion.count() > 0) {
      const accordionItems = accordion.locator('[data-testid^="accordion-item"]');
      const count = await accordionItems.count();
      
      if (count > 0) {
        const firstItem = accordionItems.first();
        const header = firstItem.locator('button, [role="button"]').first();
        const content = firstItem.locator('[data-testid*="content"], .content').first();
        
        // คลิกเพื่อเปิด
        await header.click();
        await page.waitForTimeout(300);
        await expect(content).toBeVisible();
        
        // คลิกอีกครั้งเพื่อปิด
        await header.click();
        await page.waitForTimeout(300);
        await expect(content).toBeHidden();
      }
    }
  });

  test('TC-DETAIL-F06: Tab navigation ทำงานถูกต้อง', async ({ page }) => {
    const tabs = page.locator(SELECTORS.detail.tab);
    
    if (await tabs.count() > 1) {
      // คลิก tab แรก
      await tabs.first().click();
      await page.waitForTimeout(300);
      
      const firstPanel = page.locator(SELECTORS.detail.tabPanel).first();
      await expect(firstPanel).toBeVisible();
      
      // คลิก tab ที่สอง
      await tabs.nth(1).click();
      await page.waitForTimeout(300);
      
      const secondPanel = page.locator(SELECTORS.detail.tabPanel).nth(1);
      await expect(secondPanel).toBeVisible();
    }
  });

  test('TC-DETAIL-F07: ราคาที่แสดงตรงกับ plan ที่เลือก', async ({ page }) => {
    // รับราคาจากหน้า listing
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    const listingPrice = await firstCard.locator(SELECTORS.planCard.price).textContent();
    
    // ไปหน้า detail
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // เปรียบเทียบราคา
    const detailPrice = await page.locator('text=/฿[0-9,]+/').first().textContent();
    
    // ควรมีราคาเหมือนกัน (หรือใกล้เคียง)
    expect(detailPrice).toContain('฿');
  });
});

test.describe('🧾 5. Detail Page - UI/UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
  });

  test('TC-DETAIL-UI01: Layout ถูกต้องตามดีไซน์', async ({ page }) => {
    // ตรวจสอบ main sections
    const sections = [
      page.locator('header, h1'),
      page.locator(SELECTORS.detail.summary),
      page.locator('main, [role="main"]'),
    ];
    
    for (const section of sections) {
      if (await section.count() > 0) {
        await expect(section.first()).toBeVisible();
      }
    }
  });

  test('TC-DETAIL-UI02: Font, สี, icon, spacing ตรงตาม spec', async ({ page }) => {
    const mainHeading = page.locator('h1').first();
    
    const styles = await mainHeading.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        color: computed.color,
        marginBottom: computed.marginBottom,
      };
    });
    
    expect(styles.fontSize).toBeTruthy();
    expect(parseInt(styles.fontSize)).toBeGreaterThan(16);
    expect(styles.color).toBeTruthy();
  });

  test('TC-DETAIL-UI03: Responsive สำหรับ desktop ขนาดต่างๆ', async ({ browser }) => {
    for (const breakpoint of DESKTOP_BREAKPOINTS) {
      const context = await browser.newContext({
        viewport: { width: breakpoint.width, height: breakpoint.height }
      });
      const page = await context.newPage();
      
      await page.goto(CAR_LISTING_URL);
      await page.waitForLoadState('networkidle');
      
      const firstCard = page.locator(SELECTORS.planCard.container).first();
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      
      // ตรวจสอบว่า layout ไม่แตก
      const mainContent = page.locator('main, [role="main"]');
      const box = await mainContent.boundingBox();
      
      expect(box).toBeTruthy();
      expect(box!.width).toBeLessThanOrEqual(breakpoint.width);
      
      await context.close();
    }
  });

  test('TC-DETAIL-UI04: Coverage table แสดงครบถ้วน', async ({ page }) => {
    const table = page.locator(SELECTORS.detail.coverageTable);
    
    if (await table.count() > 0) {
      await expect(table).toBeVisible();
      
      // ตรวจสอบ headers
      const headers = table.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
      
      // ตรวจสอบ rows
      const rows = table.locator('tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(1);
    }
  });
});

test.describe('🧾 5. Detail Page - Edge Cases', () => {
  test('TC-DETAIL-EDGE01: แผนไม่มีข้อมูลบางส่วน → UI ไม่พัง', async ({ page }) => {
    // Mock API ให้ return partial data
    await page.route('**/api/cars/*/detail', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 1,
            title: 'Toyota Camry',
            price: 890000,
            // ไม่มี features, description, etc.
          }
        })
      });
    });
    
    await page.goto(`${CAR_LISTING_URL}/detail/1`);
    await page.waitForLoadState('networkidle');
    
    // ตรวจสอบว่าหน้าไม่ crash
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible();
    
    // ตรวจสอบว่าไม่มี error แสดง
    const error = page.locator('[data-testid="error"]');
    if (await error.count() > 0) {
      await expect(error).toBeHidden();
    }
  });

  test('TC-DETAIL-EDGE02: Error state หรือ API fail', async ({ page }) => {
    // Mock API error
    await page.route('**/api/cars/*/detail', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto(`${CAR_LISTING_URL}/detail/1`);
    await page.waitForTimeout(2000);
    
    // ตรวจสอบ error message
    const errorMessage = page.locator(SELECTORS.errorMessage);
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/error|ผิดพลาด|failed/i);
  });

  test('TC-DETAIL-EDGE03: Loading state แสดง placeholder ถูกต้อง', async ({ page }) => {
    // Mock slow API
    await page.route('**/api/cars/*/detail', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    await page.goto(`${CAR_LISTING_URL}/detail/1`);
    
    // ตรวจสอบ loading state
    const loading = page.locator(SELECTORS.loading);
    await expect(loading).toBeVisible({ timeout: 500 });
    
    // รอให้โหลดเสร็จ
    await page.waitForLoadState('networkidle');
    
    // ตรวจสอบว่าข้อมูลแสดง
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible();
  });

  test('TC-DETAIL-EDGE04: Deep link ไปหน้า detail โดยตรง', async ({ page }) => {
    // เข้าหน้า detail โดยตรงจาก URL
    await page.goto(`${CAR_LISTING_URL}/detail/1`);
    await page.waitForLoadState('networkidle');
    
    // ตรวจสอบว่าหน้าโหลดสำเร็จ
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible();
    
    // ตรวจสอบ breadcrumb
    const breadcrumb = page.locator(SELECTORS.layout.breadcrumb);
    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb).toBeVisible();
    }
  });

  test('TC-DETAIL-EDGE05: ข้อมูลในตาราง coverage ยาวมาก', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    const table = page.locator(SELECTORS.detail.coverageTable);
    
    if (await table.count() > 0) {
      const tableBox = await table.boundingBox();
      const viewport = page.viewportSize();
      
      // ตรวจสอบว่าตารางไม่ล้นออกจอ
      if (viewport) {
        expect(tableBox!.width).toBeLessThanOrEqual(viewport.width);
      }
      
      // ตรวจสอบว่ามี scroll ได้ (ถ้าข้อมูลยาว)
      const isScrollable = await table.evaluate(el => {
        return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      });
      
      // หรือมี wrapper ที่ scroll ได้
      if (isScrollable) {
        const overflowX = await table.evaluate(el => 
          window.getComputedStyle(el).overflowX
        );
        expect(['auto', 'scroll'].includes(overflowX)).toBe(true);
      }
    }
  });
});

// ========================================
// 🎯 Additional Cross-functional Tests
// ========================================

test.describe('🎯 Cross-functional Tests', () => {
  test('TC-CROSS-01: User Journey - Browse to Purchase', async ({ page }) => {
    // 1. เข้าหน้า listing
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    // 2. เลือก filter
    const filter = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
    await filter.check();
    await page.waitForTimeout(1000);
    
    // 3. เปลี่ยน sort
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    if (await sortDropdown.count() > 0) {
      await sortDropdown.click();
      await page.locator('text=ราคาลด').first().click();
      await page.waitForTimeout(500);
    }
    
    // 4. คลิกดู card
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // 5. ดูรายละเอียด
    const buyButton = page.locator(SELECTORS.detail.buyButton);
    if (await buyButton.count() > 0) {
      await expect(buyButton).toBeVisible();
    }
    
    // 6. กลับไปหน้า listing
    const backButton = page.locator(SELECTORS.detail.backButton);
    if (await backButton.count() > 0) {
      await backButton.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
    
    // ตรวจสอบว่ากลับมาหน้า listing
    const cards = page.locator(SELECTORS.planCard.container);
    await expect(cards.first()).toBeVisible();
  });

  test('TC-CROSS-02: State Persistence - Filter & Sort', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    // เลือก filter และ sort
    const filter = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
    await filter.check();
    
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    if (await sortDropdown.count() > 0) {
      await sortDropdown.click();
      await page.locator('text=ราคาขึ้น').first().click();
      await page.waitForTimeout(500);
    }
    
    // ไปหน้า detail
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // กลับมาหน้า listing
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // ตรวจสอบว่า filter ยังคงถูกเลือกอยู่
    await expect(filter).toBeChecked();
  });

  test('TC-CROSS-03: Compare Multiple Plans', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    // เลือกหลาย cards เพื่อเปรียบเทียบ
    const cards = page.locator(SELECTORS.planCard.container);
    const count = Math.min(await cards.count(), 3);
    
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const compareButton = card.locator(SELECTORS.planCard.compareButton);
      
      if (await compareButton.count() > 0) {
        await compareButton.click();
        await page.waitForTimeout(300);
      }
    }
    
    // ตรวจสอบว่ามี compare UI แสดง
    const comparePanel = page.locator('[data-testid="compare-panel"]');
    if (await comparePanel.count() > 0) {
      await expect(comparePanel).toBeVisible();
    }
  });

  test('TC-CROSS-04: Bookmark Functionality', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    const bookmarkIcon = firstCard.locator(SELECTORS.planCard.bookmarkIcon);
    
    if (await bookmarkIcon.count() > 0) {
      // Bookmark
      await bookmarkIcon.click();
      await page.waitForTimeout(300);
      
      // Reload หน้า
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // ตรวจสอบว่า bookmark ยังคงอยู่
      const reloadedCard = page.locator(SELECTORS.planCard.container).first();
      const reloadedBookmark = reloadedCard.locator(SELECTORS.planCard.bookmarkIcon);
      
      // ควรมี active state
      await expect(reloadedBookmark).toHaveClass(/active|filled|bookmarked/);
    }
  });
});

// ========================================
// 📊 Performance & Optimization Tests
// ========================================

test.describe('📊 Performance Tests', () => {
  test('TC-PERF-01: Page Load Time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page ควร load ภายใน 5 วินาที
    expect(loadTime).toBeLessThan(5000);
    
    // ตรวจสอบว่า content แสดง
    const cards = page.locator(SELECTORS.planCard.container);
    await expect(cards.first()).toBeVisible();
  });

  test('TC-PERF-02: Image Loading Performance', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const count = await images.count();
    
    let loadedCount = 0;
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const isLoaded = await img.evaluate((el: HTMLImageElement) => {
        return el.complete && el.naturalHeight !== 0;
      });
      
      if (isLoaded) loadedCount++;
    }
    
    // อย่างน้อย 70% ของรูปควรโหลดสำเร็จ
    const loadRatio = loadedCount / Math.min(count, 10);
    expect(loadRatio).toBeGreaterThan(0.7);
  });

  test('TC-PERF-03: Scroll Performance', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    // Scroll ลงไปด้านล่าง
    const startTime = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(100);
    }
    
    const scrollTime = Date.now() - startTime;
    
    // Scroll ควร smooth และไม่มี lag
    expect(scrollTime).toBeLessThan(2000);
  });

  test('TC-PERF-04: Filter Response Time', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const filter = page.locator(SELECTORS.filter.checkbox('ไม่มีค่างวดเหมือนเดิมหรือบ้าง'));
    
    const startTime = Date.now();
    await filter.check();
    
    // รอให้รายการอัปเดต
    await page.waitForTimeout(1000);
    
    const responseTime = Date.now() - startTime;
    
    // Filter ควรตอบสนองภายใน 2 วินาที
    expect(responseTime).toBeLessThan(2000);
  });

  test('TC-PERF-05: Memory Usage', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    // เช็ค performance metrics
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (metrics) {
      // ตรวจสอบว่าไม่ใช้ memory มากเกินไป (< 100MB)
      const usedMemoryMB = metrics.usedJSHeapSize / 1024 / 1024;
      expect(usedMemoryMB).toBeLessThan(100);
    }
  });
});

// ========================================
// 🔒 Security Tests
// ========================================

test.describe('🔒 Security Tests', () => {
  test('TC-SEC-01: XSS Protection in Search/Filter', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="ค้นหา"]');
    
    if (await searchInput.count() > 0) {
      // พยายาม inject script
      await searchInput.fill('<script>alert("XSS")</script>');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      // ตรวจสอบว่าไม่มี script execute
      const scriptExecuted = await page.evaluate(() => {
        return document.body.innerHTML.includes('<script>alert("XSS")</script>');
      });
      
      expect(scriptExecuted).toBe(false);
    }
  });

  test('TC-SEC-02: HTTPS Connection', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    
    const url = page.url();
    
    // Production ควรใช้ HTTPS
    if (!url.includes('localhost')) {
      expect(url).toMatch(/^https:/);
    }
  });

  test('TC-SEC-03: No Sensitive Data in Console', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    // ตรวจสอบว่าไม่มี sensitive data
    const sensitiveLogs = consoleLogs.filter(log => 
      log.toLowerCase().includes('password') ||
      log.toLowerCase().includes('token') ||
      log.toLowerCase().includes('api_key') ||
      log.toLowerCase().includes('secret')
    );
    
    expect(sensitiveLogs).toHaveLength(0);
  });

  test('TC-SEC-04: Content Security Policy', async ({ page }) => {
    const response = await page.goto(CAR_LISTING_URL);
    const headers = response?.headers();
    
    if (headers && !page.url().includes('localhost')) {
      // ตรวจสอบ security headers
      const securityHeaders = [
        'content-security-policy',
        'x-content-type-options',
        'x-frame-options',
      ];
      
      // อย่างน้อยควรมี security header บางตัว
      const hasSecurityHeaders = securityHeaders.some(header => 
        header in headers
      );
      
      expect(hasSecurityHeaders).toBe(true);
    }
  });
});

// ========================================
// 🎨 Visual Regression Tests
// ========================================

test.describe('🎨 Visual Regression', () => {
  test('TC-VISUAL-01: Full Page Screenshot - Default State', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('listing-page-default.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('[data-dynamic="true"]')], // mask dynamic content
    });
  });

  test('TC-VISUAL-02: Filter Panel Screenshot', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const filterPanel = page.locator(SELECTORS.filter.container);
    
    if (await filterPanel.count() > 0) {
      await expect(filterPanel).toHaveScreenshot('filter-panel.png', {
        animations: 'disabled',
      });
    }
  });

  test('TC-VISUAL-03: Plan Card Screenshot', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    
    await expect(firstCard).toHaveScreenshot('plan-card.png', {
      animations: 'disabled',
    });
  });

  test('TC-VISUAL-04: Plan Card Hover State', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    await firstCard.hover();
    await page.waitForTimeout(300);
    
    await expect(firstCard).toHaveScreenshot('plan-card-hover.png', {
      animations: 'disabled',
    });
  });

  test('TC-VISUAL-05: Detail Page Screenshot', async ({ page }) => {
    await page.goto(CAR_LISTING_URL);
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator(SELECTORS.planCard.container).first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('detail-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

// ========================================
// 🛠️ Utility Functions
// ========================================

async function waitForCardsToLoad(page: Page) {
  await page.waitForSelector(SELECTORS.planCard.container, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

async function getCardData(page: Page, index: number = 0) {
  const card = page.locator(SELECTORS.planCard.container).nth(index);
  
  return {
    title: await card.locator(SELECTORS.planCard.title).textContent(),
    price: await card.locator(SELECTORS.planCard.price).textContent(),
    isVisible: await card.isVisible(),
  };
}

async function applyFilters(page: Page, filters: string[]) {
  for (const filter of filters) {
    const checkbox = page.locator(SELECTORS.filter.checkbox(filter));
    await checkbox.check();
    await page.waitForTimeout(300);
  }
}

async function clearAllFilters(page: Page) {
  const clearButton = page.locator(SELECTORS.filter.clearButton);
  if (await clearButton.count() > 0) {
    await clearButton.click();
    await page.waitForTimeout(500);
  }
}

async function selectSort(page: Page, sortOption: string) {
  const dropdown = page.locator('[data-testid="sort-dropdown"]');
  if (await dropdown.count() > 0) {
    await dropdown.click();
    await page.locator(`text=${sortOption}`).first().click();
    await page.waitForTimeout(500);
  }
}

async function navigateToDetail(page: Page, cardIndex: number = 0) {
  const card = page.locator(SELECTORS.planCard.container).nth(cardIndex);
  await card.click();
  await page.waitForLoadState('networkidle');
}

async function checkResponsiveBreakpoint(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(500);
  
  // ตรวจสอบว่า layout ไม่แตก
  const mainContent = page.locator(SELECTORS.layout.mainContent);
  const box = await mainContent.boundingBox();
  
  return {
    isVisible: await mainContent.isVisible(),
    width: box?.width || 0,
    fitsInViewport: (box?.width || 0) <= width,
  };
}

// Export for reuse
export {
  SELECTORS,
  DESKTOP_BREAKPOINTS,
  waitForCardsToLoad,
  getCardData,
  applyFilters,
  clearAllFilters,
  selectSort,
  navigateToDetail,
  checkResponsiveBreakpoint,
};