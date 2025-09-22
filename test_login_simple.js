const { chromium } = require('playwright');

async function testLoginSimple() {
  console.log('Testing login after CORS fix...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5175/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'testpassword');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(3000);

    // Check for success
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    const currentUrl = page.url();

    console.log(`Token present: ${token ? 'YES' : 'NO'}`);
    console.log(`Current URL: ${currentUrl}`);

    if (token) {
      console.log('🎉 LOGIN SUCCESS!');
    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testLoginSimple();