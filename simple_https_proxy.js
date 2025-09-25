// 簡單的 HTTPS 代理服務器
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// 啟用 CORS
app.use(cors({
  origin: [
    'https://timesheet-5fff2.web.app',
    'https://timesheet-5fff2.firebaseapp.com'
  ],
  credentials: true
}));

// 代理所有 /api 請求到後端
app.use('/api', createProxyMiddleware({
  target: 'http://185.201.8.177:8130',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug'
}));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'proxy healthy' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔀 HTTPS Proxy running on port ${PORT}`);
  console.log(`🌐 Proxying to: http://185.201.8.177:8130`);
});