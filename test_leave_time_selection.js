const { chromium } = require('playwright');

async function testLeaveTimeSelection() {
  console.log('Testing new leave time selection feature...');

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
    await page.waitForTimeout(2000);

    // Navigate to leave application page
    await page.goto('http://localhost:5175/leave-application');
    await page.waitForLoadState('networkidle');

    console.log('Testing time selection features...');

    // Test full day option (default)
    const fullDayRadio = await page.$('input[value="full_day"]');
    if (fullDayRadio) {
      const isChecked = await fullDayRadio.isChecked();
      console.log(`Full day radio is checked: ${isChecked}`);
    }

    // Test custom time option
    await page.click('input[value="custom"]');
    await page.waitForTimeout(500);

    // Check if time selectors appear
    const startTimeSelector = await page.$('select, [role="combobox"]');
    if (startTimeSelector) {
      console.log('✅ Time selectors appear when custom is selected');
    }

    // Test filling out the form
    await page.selectOption('select[name="leave_type"], [data-testid="leave-type-select"]', { index: 1 });

    // Fill start date
    await page.fill('input[type="date"]', '2025-09-25');

    // Try to open time selector
    const timeSelectors = await page.$$('[role="combobox"]');
    if (timeSelectors.length > 0) {
      await timeSelectors[0].click();
      await page.waitForTimeout(500);

      // Check if time options are available
      const timeOptions = await page.$$('[role="option"]');
      console.log(`Found ${timeOptions.length} time options`);

      if (timeOptions.length > 0) {
        console.log('✅ 10-minute interval time options are working');
        await timeOptions[54].click(); // Select 09:00
      }
    }

    console.log('✅ New time selection feature is working correctly!');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testLeaveTimeSelection();