import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Contact } from '../models/contact.model';

const KEY = 'contacts';

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private storage: StorageService) {}

  getAll(): Contact[] { return this.storage.get<Contact>(KEY) || []; }

  getById(id: string): Contact | undefined { return this.getAll().find(c => c.id === id); }

  getClients(): Contact[] { return this.getAll().filter(c => c.roles.includes('client')); }

  getMembers(): Contact[] { return this.getAll().filter(c => c.roles.includes('member')); }

  add(data: Omit<Contact, 'id' | 'createdAt'>): Contact {
    const list = this.getAll();
    const item: Contact = { ...data, id: this.id(), createdAt: new Date() };
    this.storage.save(KEY, [...list, item]);
    return item;
  }

  update(id: string, data: Partial<Contact>): void {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...data }; this.storage.save(KEY, list); }
  }

  delete(id: string): void { this.storage.save(KEY, this.getAll().filter(c => c.id !== id)); }

  private id(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
}
