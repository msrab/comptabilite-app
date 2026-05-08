import { Injectable, signal } from '@angular/core';
import { User } from '../models';
import { StorageService } from './storage.service';

const USERS_KEY = 'asbl_users';
const CURRENT_USER_KEY = 'asbl_current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);

  constructor(private storage: StorageService) {
    this.initDefaultAdmin();
    const saved = sessionStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  private initDefaultAdmin(): void {
    const users = this.storage.get<User>(USERS_KEY);
    if (users.length === 0) {
      const admin: User = {
        id: 'admin-1',
        username: 'admin',
        password: 'admin123',
        displayName: 'Administrateur',
        role: 'admin',
        createdAt: new Date()
      };
      this.storage.save(USERS_KEY, [admin]);
    }
  }

  login(username: string, password: string): boolean {
    const users = this.storage.get<User>(USERS_KEY);
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password: _, ...safeUser } = user;
      this.currentUser.set(user);
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem(CURRENT_USER_KEY);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  getUsers(): User[] {
    return this.storage.get<User>(USERS_KEY);
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.storage.get<User>(USERS_KEY);
    const newUser: User = { ...user, id: this.generateId(), createdAt: new Date() };
    this.storage.save(USERS_KEY, [...users, newUser]);
    return newUser;
  }

  updateUser(id: string, data: Partial<User>): void {
    const users = this.storage.get<User>(USERS_KEY);
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...data };
      this.storage.save(USERS_KEY, users);
    }
  }

  deleteUser(id: string): void {
    const users = this.storage.get<User>(USERS_KEY).filter(u => u.id !== id);
    this.storage.save(USERS_KEY, users);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
