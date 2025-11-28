import { ApiResponse } from "../../shared/types"
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('luxquote_auth_token');
  const baseHeaders = { 'Content-Type': 'application/json' };
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  const headers = {
    ...baseHeaders,
    ...authHeaders,
    ...init?.headers,
  };
  const res = await fetch(path, { ...init, headers });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}