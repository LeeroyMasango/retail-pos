import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure your API base URL here
const API_BASE_URL = 'http://192.168.1.167:3000/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          // Trigger logout in app
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Auth endpoints
  login(username, password) {
    return this.client.post('/auth/login', { username, password });
  }

  register(userData) {
    return this.client.post('/auth/register', userData);
  }

  getCurrentUser() {
    return this.client.get('/auth/me');
  }

  // Product endpoints
  getProducts(params = {}) {
    return this.client.get('/products', { params });
  }

  getProductByBarcode(barcode) {
    return this.client.get(`/products/barcode/${barcode}`);
  }

  getProductById(id) {
    return this.client.get(`/products/${id}`);
  }

  createProduct(productData) {
    return this.client.post('/products', productData);
  }

  updateProduct(id, productData) {
    return this.client.put(`/products/${id}`, productData);
  }

  deleteProduct(id) {
    return this.client.delete(`/products/${id}`);
  }

  getCategories() {
    return this.client.get('/products/meta/categories');
  }

  // Sales endpoints
  createSale(saleData) {
    return this.client.post('/sales', saleData);
  }

  getSales(params = {}) {
    return this.client.get('/sales', { params });
  }

  getSaleById(id) {
    return this.client.get(`/sales/${id}`);
  }

  getSaleByTransactionId(transactionId) {
    return this.client.get(`/sales/transaction/${transactionId}`);
  }

  generateReceipt(saleId, format = 'pdf') {
    return this.client.get(`/sales/${saleId}/receipt`, { params: { format } });
  }

  refundSale(saleId) {
    return this.client.post(`/sales/${saleId}/refund`);
  }

  // Inventory endpoints
  getInventoryOverview() {
    return this.client.get('/inventory/overview');
  }

  getLowStockProducts() {
    return this.client.get('/inventory/low-stock');
  }

  getOutOfStockProducts() {
    return this.client.get('/inventory/out-of-stock');
  }

  getInventoryAlerts() {
    return this.client.get('/inventory/alerts');
  }

  restockProduct(productId, quantity, notes) {
    return this.client.post('/inventory/restock', { product_id: productId, quantity, notes });
  }

  adjustInventory(productId, newQuantity, notes) {
    return this.client.post('/inventory/adjust', { product_id: productId, new_quantity: newQuantity, notes });
  }

  getInventoryTransactions(params = {}) {
    return this.client.get('/inventory/transactions', { params });
  }

  getFastMovingItems(params = {}) {
    return this.client.get('/inventory/fast-moving', { params });
  }

  // Analytics endpoints
  getDailySummary(date) {
    return this.client.get('/analytics/daily-summary', { params: { date } });
  }

  getSalesByDate(startDate, endDate) {
    return this.client.get('/analytics/sales-by-date', { params: { start_date: startDate, end_date: endDate } });
  }

  getSalesByCategory(startDate, endDate) {
    return this.client.get('/analytics/sales-by-category', { params: { start_date: startDate, end_date: endDate } });
  }

  getTopProducts(params = {}) {
    return this.client.get('/analytics/top-products', { params });
  }

  getHourlyPattern(date) {
    return this.client.get('/analytics/hourly-pattern', { params: { date } });
  }

  getPaymentMethods(startDate, endDate) {
    return this.client.get('/analytics/payment-methods', { params: { start_date: startDate, end_date: endDate } });
  }

  getDashboard() {
    return this.client.get('/analytics/dashboard');
  }

  exportData(type, startDate, endDate) {
    return this.client.get('/analytics/export', { params: { type, start_date: startDate, end_date: endDate } });
  }

  // Settings endpoints
  getSettings() {
    return this.client.get('/settings');
  }

  getSetting(key) {
    return this.client.get(`/settings/${key}`);
  }

  updateSetting(key, value) {
    return this.client.put(`/settings/${key}`, { value });
  }

  bulkUpdateSettings(settings) {
    return this.client.post('/settings/bulk-update', settings);
  }

  resetSettings() {
    return this.client.post('/settings/reset');
  }

  // Sync endpoints
  queueSync(operation) {
    return this.client.post('/sync/queue', operation);
  }

  getPendingSync(limit) {
    return this.client.get('/sync/pending', { params: { limit } });
  }

  markSynced(id) {
    return this.client.put(`/sync/${id}/synced`);
  }

  getSyncStats() {
    return this.client.get('/sync/stats');
  }
}

export default new ApiService();
