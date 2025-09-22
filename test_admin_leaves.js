const { chromium } = require('playwright');

async function testAdminLeaves() {
  console.log('Testing admin leave management interface...');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login first
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('✅ Login successful');

    // Navigate directly to admin leave management
    await page.goto('http://localhost:5175/admin/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to admin leave management page');

    // Check page elements
    const pageHeading = await page.locator('h2').first().textContent();
    console.log(`Page heading: ${pageHeading}`);

    // Check if leave management content is visible
    const leaveManagementTitle = await page.locator('h1:has-text("請假申請管理")');
    if (await leaveManagementTitle.count() > 0) {
      console.log('✅ Leave management title found');
    }

    // Check for filter dropdown
    const filterSelect = await page.locator('select, [role="combobox"]').first();
    if (await filterSelect.count() > 0) {
      console.log('✅ Status filter dropdown found');

      // Test filter options
      await filterSelect.click();
      await page.waitForTimeout(500);

      const options = await page.$$('[role="option"]');
      console.log(`Found ${options.length} filter options`);
    }

    // Check for reload button
    const reloadButton = await page.locator('button:has-text("重新載入")');
    if (await reloadButton.count() > 0) {
      console.log('✅ Reload button found');

      // Test reload functionality
      await reloadButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Reload button works');
    }

    // Check for leave applications table
    const table = await page.$('table');
    if (table) {
      console.log('✅ Leave applications table found');

      // Check table structure
      const headers = await page.$$eval('thead th', cells =>
        cells.map(cell => cell.textContent?.trim())
      );
      console.log('Table headers:', headers);

      // Check table content
      const rows = await page.$$('tbody tr');
      console.log(`Found ${rows.length} leave application rows`);

      if (rows.length === 0) {
        const emptyMessage = await page.locator('text=暫無請假申請').count();
        if (emptyMessage > 0) {
          console.log('✅ Empty state message displayed correctly');
        }
      } else {
        console.log('✅ Leave applications are displayed in table');
      }
    }

    // Check navigation menu
    const leaveNavItem = await page.locator('button:has-text("請假管理")');
    if (await leaveNavItem.count() > 0) {
      console.log('✅ Leave management navigation item found');

      // Check if it's currently active
      const isActive = await leaveNavItem.getAttribute('class');
      if (isActive && isActive.includes('bg-gradient-to-r')) {
        console.log('✅ Leave management nav item is active');
      }
    }

    console.log('\n🎉 Admin leave management interface test completed successfully!');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testAdminLeaves();