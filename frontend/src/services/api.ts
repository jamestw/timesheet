import axios from 'axios';

// Token管理工具
class TokenManager {
  private refreshPromise: Promise<string> | null = null;
  private retryCount: number = 0;
  private readonly MAX_RETRY = 3;
  private manualLogout: boolean = false;

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // 停止自動更新機制
    tokenAutoRefresh.stop();
    this.retryCount = 0;
    console.log('Token自動更新機制已停止');
  }

  setManualLogout(isManual: boolean): void {
    this.manualLogout = isManual;
  }

  isManualLogout(): boolean {
    return this.manualLogout;
  }

  async refreshAccessToken(): Promise<string> {
    // 防止同時多個請求觸發refresh
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performRefresh(refreshToken);

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(refreshToken: string): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/refresh`, {
        refresh_token: refreshToken
      });

      const newAccessToken = response.data.access_token;
      localStorage.setItem('access_token', newAccessToken);
      this.retryCount = 0; // 成功後重置重試計數
      return newAccessToken;
    } catch (error) {
      this.retryCount++;
      console.warn(`Token refresh 失敗 (${this.retryCount}/${this.MAX_RETRY}):`, error);

      // 只有在達到最大重試次數或是手動登出時才清除 tokens 並跳轉
      if (this.retryCount >= this.MAX_RETRY) {
        console.error('Token refresh 已達最大重試次數，清除 tokens');
        this.clearTokens();
        if (!this.manualLogout && window.location.pathname !== '/login') {
          // 延遲跳轉，給用戶一些時間看到錯誤訊息
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      }
      throw error;
    }
  }
}

const tokenManager = new TokenManager();

// 自動背景更新token功能
class TokenAutoRefresh {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5分鐘檢查一次
  private readonly REFRESH_BEFORE_EXPIRE = 10 * 60 * 1000; // 在過期前10分鐘更新

  start(): void {
    this.stop(); // 確保沒有重複的interval

    this.intervalId = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.CHECK_INTERVAL);

    // 啟動時立即檢查一次
    this.checkAndRefreshToken();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkAndRefreshToken(): Promise<void> {
    const accessToken = tokenManager.getAccessToken();
    const refreshToken = tokenManager.getRefreshToken();

    if (!accessToken || !refreshToken) {
      return; // 沒有token，不需要檢查
    }

    try {
      // 解析access token以檢查過期時間
      const payload = this.parseJWTPayload(accessToken);
      if (!payload || !payload.exp) {
        return;
      }

      const currentTime = Date.now() / 1000; // JWT使用秒為單位
      const timeUntilExpire = (payload.exp - currentTime) * 1000; // 轉換為毫秒

      // 如果token將在30分鐘內過期，自動更新 (較早更新避免突然過期)
      if (timeUntilExpire <= 30 * 60 * 1000) {
        console.log('Token將在', Math.round(timeUntilExpire / 60000), '分鐘內過期，自動更新中...');
        await tokenManager.refreshAccessToken();
        console.log('Token自動更新成功');
      }
    } catch (error) {
      console.warn('背景token檢查失敗:', error);
      // 背景刷新失敗時，不立即停止，繼續嘗試
      // 只有在連續失敗太多次或明確的錯誤時才停止
      if (error.message && (error.message.includes('需要重新驗證') || error.message.includes('refresh'))) {
        console.log('背景 token 刷新遇到問題，但繼續嘗試...');
      }
    }
  }

  private parseJWTPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.warn('無法解析JWT payload:', error);
      return null;
    }
  }
}

const tokenAutoRefresh = new TokenAutoRefresh();

// 強制修復 Mixed Content 問題
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;

  console.log('🔍 API URL Detection (FORCED HTTPS) - v2.0.1:', new Date().toISOString());
  console.log('Current hostname:', hostname);
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

  // 本機開發環境
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('✅ Using localhost API');
    return 'http://localhost:8001/api/v1';
  }

  // 強制所有線上環境使用 HTTPS - 不依賴環境變數 v2.0.1
  const httpsApiUrl = 'https://timesheet-api.aerocars.cc/api/v1';
  console.log('🔒 FORCING HTTPS API v2.0.1:', httpsApiUrl);
  console.log('⏰ Deployed at:', new Date().toISOString());
  return httpsApiUrl;
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);
console.log('Current environment:', import.meta.env.MODE);
console.log('All env vars:', import.meta.env);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration with auto-refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 (Unauthorized) errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 嘗試使用refresh token更新access token
        const newAccessToken = await tokenManager.refreshAccessToken();

        // 更新原始請求的Authorization header
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 重新發送原始請求
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh失敗時不立即跳轉，讓 TokenManager 處理重試逻輯
        console.warn('Token refresh 在 API interceptor 中失敗:', refreshError);
        return Promise.reject(new Error('需要重新驗證身份'));
      }
    }

    // Handle other authentication errors - 不再自動跳轉，由組件自行處理
    if (error.response && error.response.status === 403) {
      const errorDetail = error.response.data?.detail;
      if (
        errorDetail?.includes('token') ||
        errorDetail?.includes('expired') ||
        errorDetail?.includes('invalid') ||
        errorDetail === 'Not authenticated'
      ) {
        // 只記錄錯誤，不清除 tokens，由組件決定怎麼處理
        console.warn('驗證錯誤:', errorDetail);
        return Promise.reject(new Error('驗證失敗'));
      }
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return Promise.reject(new Error('網路連線有問題，請稍後再試'));
    }

    // Handle server errors
    if (error.response && error.response.status >= 500) {
      return Promise.reject(new Error('伺服器暫時無法處理請求，請稍後再試'));
    }

    return Promise.reject(error);
  }
);

// 全域登出函數
export const logout = () => {
  tokenManager.setManualLogout(true);
  tokenManager.clearTokens();
  // 重導向到登入頁面
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export default api;
export { tokenManager, tokenAutoRefresh };
