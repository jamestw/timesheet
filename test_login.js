const { chromium } = require('playwright');

async function testLogin() {
  console.log('Starting Playwright login test...');

  const browser = await chromium.launch({
    headless: false, // 顯示瀏覽器窗口以便觀察
    slowMo: 1000 // 減慢動作以便觀察
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 監聽控制台消息
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  // 監聽網路請求
  page.on('request', request => {
    console.log(`[Network] ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    console.log(`[Network] ${response.status()} ${response.url()}`);
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5175/login');

    // 等待頁面載入
    await page.waitForLoadState('networkidle');

    console.log('Page loaded, looking for login form...');

    // 檢查頁面內容
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // 等待並填寫登入表單
    console.log('Waiting for email input...');
    await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });

    console.log('Filling email...');
    await page.fill('input[type="email"], input[name="email"], #email', 'admin@test.com');

    console.log('Filling password...');
    await page.fill('input[type="password"], input[name="password"], #password', 'testpassword');

    console.log('Clicking login button...');
    await page.click('button[type="submit"], .login-button, button:has-text("登入"), button:has-text("Login")');

    // 等待響應
    console.log('Waiting for login response...');
    await page.waitForTimeout(3000);

    // 檢查是否有錯誤消息
    const errorMessage = await page.textContent('.error, .alert, .message').catch(() => null);
    if (errorMessage) {
      console.log(`Error message found: ${errorMessage}`);
    }

    // 檢查當前 URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // 檢查 localStorage 中的 token
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    console.log(`Token in localStorage: ${token ? 'Present' : 'Not found'}`);

    // 截圖以供檢查
    await page.screenshot({ path: 'login_test_result.png' });
    console.log('Screenshot saved as login_test_result.png');

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'login_test_error.png' });
  } finally {
    await browser.close();
  }
}

testLogin();