// Frontend Security Utilities
import { apiRequest } from './queryClient';

export class FrontendSecurity {
  private static csrfToken: string | null = null;
  private static tokenExpiry: number = 0;

  // CSRF Token Management
  static async getCSRFToken(): Promise<string> {
    const now = Date.now();
    
    // Return cached token if still valid
    if (this.csrfToken && now < this.tokenExpiry) {
      return this.csrfToken;
    }

    try {
      const response = await fetch('/api/csrf-token', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      
      const data = await response.json();
      this.csrfToken = data.csrfToken;
      this.tokenExpiry = now + (30 * 60 * 1000); // 30 minutes
      
      return this.csrfToken;
    } catch (error) {
      console.error('CSRF token fetch failed:', error);
      throw error;
    }
  }

  // Secure API Request with CSRF Protection
  static async secureApiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
      options.method?.toUpperCase() || 'GET'
    );

    if (isStateChanging) {
      const csrfToken = await this.getCSRFToken();
      
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
      };
    }

    options.credentials = 'include';
    
    return fetch(url, options);
  }

  // Input Sanitization
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return String(input);
    }

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  // HTML Content Sanitization
  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  // URL Validation
  static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Email Validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Password Strength Validation
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Secure Local Storage
  static setSecureItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        checksum: this.generateChecksum(JSON.stringify(value))
      });
      
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Secure storage failed:', error);
    }
  }

  static getSecureItem<T>(key: string): T | null {
    try {
      const serializedValue = localStorage.getItem(key);
      
      if (!serializedValue) {
        return null;
      }
      
      const parsed = JSON.parse(serializedValue);
      
      // Verify checksum
      const expectedChecksum = this.generateChecksum(JSON.stringify(parsed.data));
      if (parsed.checksum !== expectedChecksum) {
        console.warn('Data integrity check failed for:', key);
        localStorage.removeItem(key);
        return null;
      }
      
      // Check if data is expired (24 hours)
      const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }

  // Rate Limiting for Frontend
  private static requestCounts = new Map<string, Array<{ timestamp: number; count: number }>>();

  static checkRateLimit(endpoint: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requestCounts.has(endpoint)) {
      this.requestCounts.set(endpoint, []);
    }
    
    const requests = this.requestCounts.get(endpoint)!;
    
    // Clean old requests
    const validRequests = requests.filter(r => r.timestamp > windowStart);
    const requestCount = validRequests.reduce((sum, r) => sum + r.count, 0);
    
    if (requestCount >= maxRequests) {
      console.warn(`Rate limit exceeded for ${endpoint}`);
      return false;
    }
    
    // Add current request
    validRequests.push({ timestamp: now, count: 1 });
    this.requestCounts.set(endpoint, validRequests);
    
    return true;
  }

  // Content Security Policy Violation Reporting
  static setupCSPReporting(): void {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn('CSP Violation:', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber
      });
      
      // Report to backend
      this.secureApiRequest('/api/security/csp-violation', {
        method: 'POST',
        body: JSON.stringify({
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error);
    });
  }

  // Secure Form Handling
  static createSecureFormHandler(onSubmit: (data: FormData) => Promise<void>) {
    return async (event: Event) => {
      event.preventDefault();
      
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      
      // Sanitize form inputs
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          formData.set(key, this.sanitizeInput(value));
        }
      }
      
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submission failed:', error);
        throw error;
      }
    };
  }

  // Session Management
  static async checkSession(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  static async refreshSession(): Promise<boolean> {
    try {
      const response = await this.secureApiRequest('/api/auth/refresh', {
        method: 'POST'
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  // Security Monitoring
  static logSecurityEvent(event: string, details: any = {}): void {
    const securityEvent = {
      event,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Send to backend
    this.secureApiRequest('/api/security/event', {
      method: 'POST',
      body: JSON.stringify(securityEvent)
    }).catch(console.error);
  }

  // Private helper methods
  private static generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// React Hook for Secure API Calls
export function useSecureApi() {
  const secureRequest = async (url: string, options: RequestInit = {}) => {
    if (!FrontendSecurity.checkRateLimit(url)) {
      throw new Error('Rate limit exceeded');
    }
    
    return FrontendSecurity.secureApiRequest(url, options);
  };

  const secureUpload = async (url: string, file: File, additionalData: Record<string, any> = {}) => {
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size exceeds limit');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, JSON.stringify(value));
    });

    return secureRequest(url, {
      method: 'POST',
      body: formData
    });
  };

  return { secureRequest, secureUpload };
}

// Initialize security measures
export function initializeFrontendSecurity(): void {
  // Setup CSP violation reporting
  FrontendSecurity.setupCSPReporting();
  
  // Monitor for suspicious activity
  window.addEventListener('error', (event) => {
    if (event.error && event.error.name === 'SecurityError') {
      FrontendSecurity.logSecurityEvent('security_error', {
        message: event.error.message,
        filename: event.filename,
        lineno: event.lineno
      });
    }
  });
  
  // Session monitoring
  setInterval(async () => {
    const isValid = await FrontendSecurity.checkSession();
    if (!isValid) {
      // Attempt session refresh
      const refreshed = await FrontendSecurity.refreshSession();
      if (!refreshed) {
        // Redirect to login if session cannot be refreshed
        window.location.href = '/login';
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  console.log('Frontend security initialized');
}