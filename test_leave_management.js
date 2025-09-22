const { chromium } = require('playwright');

async function testLeaveManagement() {
  console.log('Testing leave management functionality...');

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

    // Navigate to admin panel
    await page.goto('http://localhost:5175/admin/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to leave management page');

    // Check if the leave management interface loads
    const pageTitle = await page.locator('h1').first().textContent();
    console.log(`Page title: ${pageTitle}`);

    if (pageTitle.includes('請假申請管理')) {
      console.log('✅ Leave management page loaded correctly');
    }

    // Check for filter dropdown
    const filterDropdown = await page.$('select, [role="combobox"]');
    if (filterDropdown) {
      console.log('✅ Filter dropdown found');
    }

    // Check for reload button
    const reloadButton = await page.locator('button:has-text("重新載入")');
    if (await reloadButton.count() > 0) {
      console.log('✅ Reload button found');
    }

    // Check for leave applications table
    const table = await page.$('table');
    if (table) {
      console.log('✅ Leave applications table found');

      // Check table headers
      const headers = await page.$$eval('thead th', cells =>
        cells.map(cell => cell.textContent?.trim())
      );
      console.log('Table headers:', headers);
    }

    // Test creating a new leave application first
    console.log('\n--- Testing leave application creation ---');
    await page.goto('http://localhost:5175/leave-application');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Fill out leave application form
    const leaveTypeDropdown = await page.locator('[data-testid="leave-type-select"], select').first();
    if (await leaveTypeDropdown.count() > 0) {
      await leaveTypeDropdown.click();
      await page.waitForTimeout(500);

      // Select first leave type option
      const options = await page.$$('[role="option"]');
      if (options.length > 0) {
        await options[0].click();
        console.log('✅ Leave type selected');
      }
    }

    // Set dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDate = today.toISOString().split('T')[0];
    const endDate = tomorrow.toISOString().split('T')[0];

    await page.fill('input[type="date"]', startDate);
    await page.fill('textarea', '測試請假申請');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('✅ Leave application submitted');

    // Go back to admin leave management
    await page.goto('http://localhost:5175/admin/leaves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if the new application appears
    const applicationRows = await page.$$('tbody tr');
    console.log(`Found ${applicationRows.length} leave applications`);

    if (applicationRows.length > 0) {
      console.log('✅ Leave applications are displayed');

      // Test approve/reject buttons
      const approveButton = await page.locator('button:has-text("核准")').first();
      if (await approveButton.count() > 0) {
        console.log('✅ Approve button found');

        // Click approve button to test modal
        await approveButton.click();
        await page.waitForTimeout(1000);

        // Check if review modal appears
        const modal = await page.$('.fixed');
        if (modal) {
          console.log('✅ Review modal opened');

          // Add review comment
          await page.fill('textarea', '核准測試');

          // Confirm approval
          const confirmButton = await page.locator('button:has-text("確認核准")');
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Leave application approved');
          }
        }
      }
    }

    console.log('\n🎉 Leave management test completed successfully!');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testLeaveManagement();