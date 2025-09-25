// Playwright 測試腳本 - 檢查實際部署版本的 API URL
const { chromium } = require('playwright');

async function testApiUrl() {
    console.log('🔍 開始診斷實際部署版本的 API URL...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 監聽 console 日誌
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('API URL') || text.includes('Detection') || text.includes('FORCING')) {
            console.log('🎯 [Console Log]:', text);
        }
    });

    // 監聽網絡請求
    page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/v1/')) {
            const protocol = url.startsWith('https://') ? '🔒 HTTPS' : '🚨 HTTP';
            console.log(`${protocol}: ${url}`);
        }
    });

    // 監聽網絡回應
    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/v1/')) {
            console.log(`📥 Response ${response.status()}: ${url}`);
        }
    });

    try {
        console.log('🌐 訪問 https://timesheet-5fff2.web.app...');
        await page.goto('https://timesheet-5fff2.web.app', { waitUntil: 'networkidle' });

        console.log('\n📋 檢查頁面的 API 設定...');
        await page.waitForTimeout(3000);

        // 檢查 API Base URL 變數
        const apiBaseUrl = await page.evaluate(() => {
            // 嘗試從 window 物件獲取 API URL
            return window.API_BASE_URL || 'API_BASE_URL not found';
        });
        console.log('🔧 Window API_BASE_URL:', apiBaseUrl);

        // 檢查環境變數
        const envVars = await page.evaluate(() => {
            // 嘗試獲取環境變數 (可能不會暴露到 window)
            try {
                return {
                    hostname: window.location.hostname,
                    protocol: window.location.protocol,
                    href: window.location.href
                };
            } catch (e) {
                return { error: e.message };
            }
        });
        console.log('🌍 Environment Info:', envVars);

        console.log('\n🏥 嘗試觸發一個 API 請求...');

        // 嘗試點擊登入按鈕或其他會觸發 API 的元素
        try {
            await page.click('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]', { timeout: 5000 });
            await page.fill('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]', 'test@example.com');

            await page.click('input[type="password"], input[placeholder*="password"], input[placeholder*="Password"]', { timeout: 5000 });
            await page.fill('input[type="password"], input[placeholder*="password"], input[placeholder*="Password"]', 'password');

            // 點擊登入按鈕
            await page.click('button:has-text("登入"), button:has-text("Login"), button[type="submit"]', { timeout: 5000 });

            console.log('📤 登入請求已觸發，等待網絡請求...');
            await page.waitForTimeout(5000);

        } catch (loginError) {
            console.log('⚠️ 無法觸發登入:', loginError.message);

            // 嘗試直接訪問 admin 頁面
            console.log('🎯 直接嘗試訪問 /admin/reports...');
            await page.goto('https://timesheet-5fff2.web.app/admin/reports', { waitUntil: 'networkidle' });
            await page.waitForTimeout(5000);
        }

    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
    }

    console.log('\n📊 測試完成！');

    // 保持瀏覽器開啟以供檢查
    console.log('💡 瀏覽器將保持開啟，請手動檢查開發工具 Console 和 Network 標籤');
    console.log('💡 按任意鍵關閉瀏覽器...');

    // 等待用戶手動操作
    console.log('💡 瀏覽器保持開啟供用戶手動測試...');
    console.log('💡 請在瀏覽器中進行登入和其他操作');
    console.log('💡 完成後請按 Ctrl+C 結束程式');

    // 保持程式運行
    setInterval(() => {
        // 檢查是否有新的 console 或網絡活動
    }, 1000);
}

// 檢查是否安裝了 playwright
(async () => {
    try {
        await testApiUrl();
    } catch (error) {
        if (error.message.includes('Cannot find module')) {
            console.log('❌ Playwright 未安裝，請運行：');
            console.log('npm install -D playwright');
            console.log('npx playwright install');
        } else {
            console.error('❌ 錯誤:', error.message);
        }
        process.exit(1);
    }
})();