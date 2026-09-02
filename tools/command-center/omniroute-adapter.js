class OmniRouteAdapter {
  constructor({ baseUrl = 'http://localhost:20128', apiKey = '' } = {}) {
    this.configure({ baseUrl, apiKey });
  }

  configure({ baseUrl, apiKey } = {}) {
    if (baseUrl !== undefined) this.baseUrl = String(baseUrl).replace(/\/+$/, '');
    if (apiKey !== undefined) this.apiKey = apiKey;
  }

  headers(extra = {}) {
    const headers = { Accept: 'application/json', ...extra };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    return headers;
  }

  async request(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || 5000);
    try {
      const response = await fetch(this.baseUrl + path, {
        ...options,
        headers: this.headers(options.headers || {}),
        signal: controller.signal,
      });
      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async probe() {
    const candidates = ['/health', '/api/health', '/v1/models'];
    let lastError = null;
    for (const endpoint of candidates) {
      try {
        await this.request(endpoint, { timeout: 2500 });
        return { ok: true, endpoint };
      } catch (error) {
        lastError = error;
      }
    }
    return { ok: false, error: lastError?.message || 'connection failed' };
  }

  async getModels() {
    const data = await this.request('/v1/models');
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.models)) return data.models;
    return [];
  }

  async chatCompletion(payload) {
    return this.request('/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 60000,
    });
  }

  // Centralized mappings for dashboard-specific telemetry/control routes.
  async getUsage(path = '/api/usage') { return this.request(path); }
  async getProviders(path = '/api/providers') { return this.request(path); }
  async getRequestLogs(path = '/api/logs') { return this.request(path); }
  async getRoutingConfig(path = '/api/settings/routing') { return this.request(path); }

  async updateRoutingConfig(config, path = '/api/settings/routing') {
    return this.request(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  }
}

if (typeof window !== 'undefined') window.OmniRouteAdapter = OmniRouteAdapter;
export { OmniRouteAdapter };
