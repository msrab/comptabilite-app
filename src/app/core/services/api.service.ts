import { Injectable } from '@angular/core';

// URL de l'API backend - à configurer via environment
const API_URL = (window as any).__API_URL__ || 'http://localhost:4000';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private getHeaders(): Record<string, string> {
    const token = sessionStorage.getItem('asbl_jwt');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }

  async post<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }

  async put<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE', headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }

  async uploadFile(path: string, file: File): Promise<any> {
    const token = sessionStorage.getItem('asbl_jwt');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  }

  setToken(token: string | null): void {
    if (token) sessionStorage.setItem('asbl_jwt', token);
    else sessionStorage.removeItem('asbl_jwt');
  }

  getToken(): string | null {
    return sessionStorage.getItem('asbl_jwt');
  }
}
