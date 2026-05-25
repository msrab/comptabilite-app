import { Injectable, signal } from '@angular/core';
import { User } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);

  constructor(private api: ApiService) {
    const stored = sessionStorage.getItem('asbl_current_user');
    if (stored && this.api.getToken()) {
      try { this.currentUser.set(JSON.parse(stored)); } catch {}
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res: any = await this.api.post('/api/auth/login', { username, password });
      this.api.setToken(res.token);
      const user: User = {
        id: res.user.id, username: res.user.username,
        displayName: res.user.displayName, role: res.user.role,
        password: '', createdAt: new Date()
      };
      this.currentUser.set(user);
      sessionStorage.setItem('asbl_current_user', JSON.stringify(user));
      return true;
    } catch { return false; }
  }

  logout(): void {
    this.api.setToken(null);
    this.currentUser.set(null);
    sessionStorage.removeItem('asbl_current_user');
  }

  isLoggedIn(): boolean { return !!this.api.getToken() && this.currentUser() !== null; }

  async getUsers(): Promise<User[]> { return this.api.get<User[]>('/api/auth/users'); }

  async addUser(u: { username: string; displayName: string; password: string; role: string }): Promise<User> {
    return this.api.post<User>('/api/auth/users', u);
  }

  async deleteUser(id: string): Promise<void> { await this.api.delete(`/api/auth/users/${id}`); }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.put('/api/auth/password', { currentPassword, newPassword });
  }

  updateUser(id: string, data: Partial<User>): void {}
}
