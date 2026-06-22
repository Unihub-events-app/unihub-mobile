import { API_URL } from "./config";
import { getUserToken, useSessionStore } from "./auth";

async function refreshAuthToken() {
  const token = await getUserToken();
  if (!token) {
    throw new Error("No token to refresh");
  }

  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const data = await response.json();
  const newToken = data.accessToken || data.user?.user_token || null;
  if (newToken) {
    await useSessionStore.getState().setUserToken(newToken);
  }
  return newToken;
}

export async function authenticatedFetch(endpoint, options = {}) {
  const token = await getUserToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers
  };

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));

    if (errorData.msg === "Token expired") {
      const newToken = await refreshAuthToken();
      if (!newToken) {
        await useSessionStore.getState().clearSession();
        throw new Error("Token refresh failed");
      }
      headers.Authorization = `Bearer ${newToken}`;
      return fetch(url, { ...options, headers });
    }

    await useSessionStore.getState().clearSession();
  }

  return response;
}

export function postJson(endpoint, body = {}, options = {}) {
  return authenticatedFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    ...options
  });
}

export function getJson(endpoint, options = {}) {
  return authenticatedFetch(endpoint, { method: "GET", ...options });
}
