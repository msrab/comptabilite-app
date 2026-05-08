import { Injectable } from '@angular/core';
import { Debt, DebtStatus } from '../models';
import { StorageService } from './storage.service';

const KEY = 'asbl_debts';

@Injectable({ providedIn: 'root' })
export class DebtService {
  constructor(private storage: StorageService) {}

  getAll(): Debt[] { return this.storage.get<Debt>(KEY); }
  getById(id: string): Debt | undefined { return this.getAll().find(d => d.id === id); }
  getByPerson(personId: string): Debt[] { return this.getAll().filter(d => d.personId === personId); }
  getByClient(clientId: string): Debt[] { return this.getAll().filter(d => d.clientId === clientId); }
  getDebts(): Debt[] { return this.getAll().filter(d => d.type === 'debt'); }
  getCredits(): Debt[] { return this.getAll().filter(d => d.type === 'credit'); }
  getPendingDebts(): Debt[] { return this.getAll().filter(d => d.type === 'debt' && d.status !== 'paid' && d.status !== 'cancelled'); }
  getPendingCredits(): Debt[] { return this.getAll().filter(d => d.type === 'credit' && d.status !== 'paid' && d.status !== 'cancelled'); }

  getRemainingAmount(debt: Debt): number {
    return Math.max(0, debt.amount - debt.paidAmount);
  }

  addPayment(id: string, amount: number): void {
    const list = this.getAll();
    const idx = list.findIndex(d => d.id === id);
    if (idx >= 0) {
      list[idx].paidAmount = Math.min(list[idx].amount, list[idx].paidAmount + amount);
      if (list[idx].paidAmount >= list[idx].amount) {
        list[idx].status = 'paid';
      } else if (list[idx].paidAmount > 0) {
        list[idx].status = 'partial';
      }
      this.storage.save(KEY, list);
    }
  }

  add(data: Omit<Debt, 'id' | 'createdAt'>): Debt {
    const list = this.getAll();
    const item: Debt = { ...data, id: this.id(), createdAt: new Date() };
    this.storage.save(KEY, [...list, item]);
    return item;
  }

  update(id: string, data: Partial<Debt>): void {
    const list = this.getAll();
    const idx = list.findIndex(d => d.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...data }; this.storage.save(KEY, list); }
  }

  delete(id: string): void { this.storage.save(KEY, this.getAll().filter(d => d.id !== id)); }

  private id(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
}
