/**
 * Carbon Footprint Assistant - API Client
 * Handles all communication with the backend API
 */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://carbon-footprint-api.onrender.com/api'; // Update with your Render URL

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('cfa_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('cfa_token', token);
    } else {
      localStorage.removeItem('cfa_token');
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...this.getHeaders(), ...options.headers }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  // Auth
  async register(username, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('cfa_user');
  }

  // Activities
  async getActivityTypes() {
    return this.request('/activities/types');
  }

  async getActivities(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/activities${query ? '?' + query : ''}`);
  }

  async logActivity(activityData) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  }

  async deleteActivity(id) {
    return this.request(`/activities/${id}`, { method: 'DELETE' });
  }

  // Dashboard
  async getDashboardSummary() {
    return this.request('/dashboard/summary');
  }

  async getTrends(days = 30) {
    return this.request(`/dashboard/trends?days=${days}`);
  }

  async getRecommendations() {
    return this.request('/dashboard/recommendations');
  }

  // AI Assistant
  async chat(message, history = []) {
    return this.request('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
  }

  async scanReceipt(imageBase64, mimeType) {
    return this.request('/assistant/scan', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType })
    });
  }

  async estimateFlight(fromCity, toCity) {
    return this.request('/assistant/estimate-flight', {
      method: 'POST',
      body: JSON.stringify({ fromCity, toCity })
    });
  }

  async getLeaderboard() {
    return this.request('/dashboard/leaderboard');
  }
}

// Export singleton
window.api = new ApiClient();
