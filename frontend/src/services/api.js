// frontend/src/services/api.js
export async function fetchJSON(path, options = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(baseUrl + path, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Fehler: ${res.status}`);
  }

  return res.json();
}
