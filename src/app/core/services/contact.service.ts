import { Injectable } from '@angular/core';
import { Contact } from '../models/contact.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private cache: Contact[] = [];

  constructor(private api: ApiService) {}

  async load(): Promise<void> {
    const raw: any[] = await this.api.get('/api/contacts');
    this.cache = raw.map(r => ({ ...r, roles: this.getRoles(r) }));
  }

  private getRoles(r: any): string[] {
    const roles: string[] = [];
    if (r.isMember) roles.push('member');
    if (r.isClient) roles.push('client');
    return roles;
  }

  getAll(): Contact[] { return this.cache; }
  getById(id: string): Contact | undefined { return this.cache.find(c => c.id === id); }
  getClients(): Contact[] { return this.cache.filter(c => c.roles?.includes('client')); }
  getMembers(): Contact[] { return this.cache.filter(c => c.roles?.includes('member')); }

  async add(data: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact> {
    const payload = { ...data, isMember: data.roles?.includes('member'), isClient: data.roles?.includes('client') };
    const c: any = await this.api.post('/api/contacts', payload);
    const contact = { ...c, roles: this.getRoles(c) };
    this.cache.push(contact);
    return contact;
  }

  async update(id: string, data: Partial<Contact>): Promise<void> {
    const payload = { ...data, isMember: data.roles?.includes('member'), isClient: data.roles?.includes('client') };
    const c: any = await this.api.put(`/api/contacts/${id}`, payload);
    const idx = this.cache.findIndex(x => x.id === id);
    if (idx >= 0) this.cache[idx] = { ...c, roles: this.getRoles(c) };
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/api/contacts/${id}`);
    this.cache = this.cache.filter(c => c.id !== id);
  }
}
