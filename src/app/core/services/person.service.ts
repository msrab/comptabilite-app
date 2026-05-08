import { Injectable } from '@angular/core';
import { Person } from '../models';
import { StorageService } from './storage.service';

const KEY = 'asbl_persons';

@Injectable({ providedIn: 'root' })
export class PersonService {
  constructor(private storage: StorageService) {}

  getAll(): Person[] { return this.storage.get<Person>(KEY); }
  getById(id: string): Person | undefined { return this.getAll().find(p => p.id === id); }
  getCreditors(): Person[] { return this.getAll().filter(p => p.type === 'creditor' || p.type === 'both'); }
  getDebtors(): Person[] { return this.getAll().filter(p => p.type === 'debtor' || p.type === 'both'); }

  add(data: Omit<Person, 'id' | 'createdAt'>): Person {
    const list = this.getAll();
    const item: Person = { ...data, id: this.id(), createdAt: new Date() };
    this.storage.save(KEY, [...list, item]);
    return item;
  }

  update(id: string, data: Partial<Person>): void {
    const list = this.getAll();
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...data }; this.storage.save(KEY, list); }
  }

  delete(id: string): void { this.storage.save(KEY, this.getAll().filter(p => p.id !== id)); }

  private id(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
}
