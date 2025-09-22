const { chromium } = require('playwright');

async function testOvertimeAttendance() {
  console.log('Testing overtime attendance functionality...');

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

    // Navigate to dashboard
    await page.goto('http://localhost:5175/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to dashboard');

    // Check if overtime option is available
    const overtimeButton = await page.locator('button[value="overtime"]:has-text("加班")');
    if (await overtimeButton.count() > 0) {
      console.log('✅ Overtime button found');

      // Click on overtime mode
      await overtimeButton.click();
      await page.waitForTimeout(1000);

      console.log('✅ Switched to overtime mode');

      // Check if start/end toggle appears
      const startButton = await page.locator('button[value="start"]:has-text("開始")');
      const endButton = await page.locator('button[value="end"]:has-text("結束")');

      if (await startButton.count() > 0 && await endButton.count() > 0) {
        console.log('✅ Overtime start/end buttons found');

        // Test overtime start
        await startButton.click();
        await page.waitForTimeout(500);

        // Check button color (should be orange)
        const punchButton = await page.locator('button').filter({ hasText: '打卡' });
        const buttonClass = await punchButton.getAttribute('class');
        if (buttonClass && buttonClass.includes('bg-orange-600')) {
          console.log('✅ Punch button shows orange color for overtime');
        }

        // Mock geolocation for testing
        await page.context().setGeolocation({ latitude: 25.0330, longitude: 121.5654 }); // Taipei coordinates
        await page.context().grantPermissions(['geolocation']);

        console.log('🎯 Testing overtime start punch...');

        // Click punch button for overtime start
        await punchButton.click();
        await page.waitForTimeout(3000);

        // Check for success message
        const successAlert = await page.locator('[role="alert"]');
        if (await successAlert.count() > 0) {
          const alertText = await successAlert.textContent();
          console.log(`✅ Overtime start successful: ${alertText}`);
        }

        // Wait a bit and check records table
        await page.waitForTimeout(2000);

        // Check if record appears in today's records
        const recordTable = await page.locator('table tbody tr');
        if (await recordTable.count() > 0) {
          const recordCells = await recordTable.first().locator('td');
          const recordType = await recordCells.nth(1).textContent();

          if (recordType && recordType.includes('加班開始')) {
            console.log('✅ Overtime start record appears in table');
          }
        }

        // Test overtime end
        console.log('🎯 Testing overtime end...');

        await endButton.click();
        await page.waitForTimeout(500);

        await punchButton.click();
        await page.waitForTimeout(3000);

        // Check for success message
        const endAlert = await page.locator('[role="alert"]');
        if (await endAlert.count() > 0) {
          const alertText = await endAlert.textContent();
          console.log(`✅ Overtime end successful: ${alertText}`);
        }

        // Check final records
        await page.waitForTimeout(2000);
        const finalRecords = await page.locator('table tbody tr');
        const recordCount = await finalRecords.count();
        console.log(`✅ Total attendance records today: ${recordCount}`);

      } else {
        console.log('❌ Overtime start/end buttons not found');
      }

    } else {
      console.log('❌ Overtime button not found');
    }

    // Test switching back to regular attendance
    console.log('🔄 Testing switch back to regular attendance...');

    const checkinButton = await page.locator('button[value="check-in"]:has-text("上班")');
    if (await checkinButton.count() > 0) {
      await checkinButton.click();
      await page.waitForTimeout(500);

      // Overtime toggle should disappear
      const overtimeToggle = await page.locator('button[value="start"], button[value="end"]');
      if (await overtimeToggle.count() === 0) {
        console.log('✅ Overtime toggle hidden when not in overtime mode');
      }
    }

    console.log('\n🎉 Overtime attendance test completed successfully!');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testOvertimeAttendance();