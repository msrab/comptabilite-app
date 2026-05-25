import { Injectable } from '@angular/core';
import { Debt } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DebtService {
  private cache: Debt[] = [];

  constructor(private api: ApiService) {}

  async load(): Promise<void> { this.cache = await this.api.get<Debt[]>('/api/debts'); }

  getAll(): Debt[] { return this.cache; }
  getById(id: string): Debt | undefined { return this.cache.find(d => d.id === id); }
  getByPerson(pid: string): Debt[] { return this.cache.filter(d => (d as any).personId === pid); }
  getByClient(cid: string): Debt[] { return this.cache.filter(d => (d as any).clientId === cid || (d as any).contactId === cid); }
  getDebts(): Debt[] { return this.cache.filter(d => d.type === 'debt'); }
  getCredits(): Debt[] { return this.cache.filter(d => d.type === 'credit'); }
  getPendingDebts(): Debt[] { return this.cache.filter(d => d.type === 'debt' && d.status !== 'paid' && d.status !== 'cancelled'); }
  getPendingCredits(): Debt[] { return this.cache.filter(d => d.type === 'credit' && d.status !== 'paid' && d.status !== 'cancelled'); }
  getRemainingAmount(debt: Debt): number { return Math.max(0, debt.amount - (debt.paidAmount || 0)); }

  async add(data: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt> {
    const d = await this.api.post<Debt>('/api/debts', data);
    this.cache.unshift(d);
    return d;
  }

  async update(id: string, data: Partial<Debt>): Promise<void> {
    const d = await this.api.put<Debt>(`/api/debts/${id}`, data);
    const idx = this.cache.findIndex(x => x.id === id);
    if (idx >= 0) this.cache[idx] = d;
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/api/debts/${id}`);
    this.cache = this.cache.filter(d => d.id !== id);
  }

  addPayment(id: string, amount: number): void {
    const idx = this.cache.findIndex(d => d.id === id);
    if (idx >= 0) {
      this.cache[idx].paidAmount = Math.min(this.cache[idx].amount, (this.cache[idx].paidAmount || 0) + amount);
      const status = this.cache[idx].paidAmount >= this.cache[idx].amount ? 'paid' : 'partial';
      this.cache[idx].status = status as any;
      this.update(id, { paidAmount: this.cache[idx].paidAmount, status: status as any });
    }
  }
}
