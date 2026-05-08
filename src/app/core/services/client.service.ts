import { Injectable } from '@angular/core';
import { Client } from '../models';
import { StorageService } from './storage.service';

const KEY = 'asbl_clients';

@Injectable({ providedIn: 'root' })
export class ClientService {
  constructor(private storage: StorageService) {}

  getAll(): Client[] {
    return this.storage.get<Client>(KEY);
  }

  getById(id: string): Client | undefined {
    return this.getAll().find(c => c.id === id);
  }

  add(data: Omit<Client, 'id' | 'createdAt'>): Client {
    const clients = this.getAll();
    const client: Client = { ...data, id: this.id(), createdAt: new Date() };
    this.storage.save(KEY, [...clients, client]);
    return client;
  }

  update(id: string, data: Partial<Client>): void {
    const clients = this.getAll();
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) { clients[idx] = { ...clients[idx], ...data }; this.storage.save(KEY, clients); }
  }

  delete(id: string): void {
    this.storage.save(KEY, this.getAll().filter(c => c.id !== id));
  }

  private id(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
