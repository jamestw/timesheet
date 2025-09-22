const { chromium } = require('playwright');

async function testOvertimeSimple() {
  console.log('Testing overtime attendance functionality on port 5175...');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');

    console.log('✅ Loaded login page');

    // Try to fill login form
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('✅ Attempted login');

    // Navigate to dashboard
    await page.goto('http://localhost:5175/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to dashboard');

    // Check if overtime button exists
    const overtimeButton = await page.locator('button[value="overtime"]:has-text("加班")');
    if (await overtimeButton.count() > 0) {
      console.log('✅ Overtime button found');

      // Click overtime
      await overtimeButton.click();
      await page.waitForTimeout(1000);

      console.log('✅ Clicked overtime button');

      // Check if start/end toggle appears
      const startButton = await page.locator('button[value="start"]:has-text("開始")');
      if (await startButton.count() > 0) {
        console.log('✅ Overtime start button found');
      } else {
        console.log('❌ Overtime start button not found');
      }

      // Take a screenshot for debugging
      await page.screenshot({ path: 'overtime-test.png' });
      console.log('📸 Screenshot saved as overtime-test.png');

    } else {
      console.log('❌ Overtime button not found');
    }

    console.log('\n🎉 Basic overtime test completed!');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testOvertimeSimple();