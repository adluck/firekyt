export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use statusText
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }

  return res;
}

export async function apiRequestWithAuth(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  
  if (!token) {
    throw new Error("Authentication required");
  }

  return apiRequest(method, url, data);
}

// Utility functions for common API patterns
export const api = {
  get: (url: string) => apiRequest("GET", url),
  post: (url: string, data?: unknown) => apiRequest("POST", url, data),
  put: (url: string, data?: unknown) => apiRequest("PUT", url, data),
  patch: (url: string, data?: unknown) => apiRequest("PATCH", url, data),
  delete: (url: string) => apiRequest("DELETE", url),
};

export const authApi = {
  get: (url: string) => apiRequestWithAuth("GET", url),
  post: (url: string, data?: unknown) => apiRequestWithAuth("POST", url, data),
  put: (url: string, data?: unknown) => apiRequestWithAuth("PUT", url, data),
  patch: (url: string, data?: unknown) => apiRequestWithAuth("PATCH", url, data),
  delete: (url: string) => apiRequestWithAuth("DELETE", url),
};
