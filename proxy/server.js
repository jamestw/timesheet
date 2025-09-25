// HTTPS Proxy for Timesheet Backend API
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS for Firebase hosting domains
app.use(cors({
  origin: [
    'https://timesheet-5fff2.web.app',
    'https://timesheet-5fff2.firebaseapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Proxy all /api requests to the VPS backend
app.use('/api', createProxyMiddleware({
  target: 'http://185.201.8.177:8130',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[${new Date().toISOString()}] Proxying: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error(`[${new Date().toISOString()}] Proxy Error:`, err.message);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'proxy healthy',
    timestamp: new Date().toISOString(),
    target: 'http://185.201.8.177:8130'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Timesheet HTTPS Proxy',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔀 HTTPS Proxy running on port ${PORT}`);
  console.log(`🌐 Proxying to: http://185.201.8.177:8130`);
  console.log(`📡 CORS enabled for Firebase hosting domains`);
});