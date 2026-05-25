import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private cache: Transaction[] = [];

  constructor(private api: ApiService) {}

  async load(): Promise<void> {
    this.cache = await this.api.get<Transaction[]>('/api/transactions');
  }

  getAll(): Transaction[] { return this.cache; }
  getById(id: string): Transaction | undefined { return this.cache.find(t => t.id === id); }
  getByProject(pid: string): Transaction[] { return this.cache.filter(t => t.projectId === pid); }
  getByClient(cid: string): Transaction[] { return this.cache.filter(t => t.contactId === cid || (t as any).clientId === cid); }
  getByDebt(did: string): Transaction[] { return this.cache.filter(t => t.debtId === did); }
  getIncomes(): Transaction[] { return this.cache.filter(t => t.type === 'income'); }
  getExpenses(): Transaction[] { return this.cache.filter(t => t.type === 'expense'); }
  getBalance(): number { return this.cache.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0); }

  async add(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const t = await this.api.post<Transaction>('/api/transactions', data);
    this.cache.unshift(t);
    return t;
  }

  async update(id: string, data: Partial<Transaction>): Promise<void> {
    const t = await this.api.put<Transaction>(`/api/transactions/${id}`, data);
    const idx = this.cache.findIndex(x => x.id === id);
    if (idx >= 0) this.cache[idx] = t;
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/api/transactions/${id}`);
    this.cache = this.cache.filter(t => t.id !== id);
  }

  async uploadReceipt(id: string, file: File): Promise<string> {
    const res: any = await this.api.uploadFile(`/api/transactions/${id}/receipt`, file);
    const idx = this.cache.findIndex(t => t.id === id);
    if (idx >= 0) this.cache[idx].receiptFile = res.receiptUrl;
    return res.receiptUrl;
  }

  async deleteReceipt(id: string): Promise<void> {
    await this.api.delete(`/api/transactions/${id}/receipt`);
    const idx = this.cache.findIndex(t => t.id === id);
    if (idx >= 0) { this.cache[idx].receiptFile = undefined; this.cache[idx].receiptData = undefined; }
  }

  getByDateRange(start: Date, end: Date): Transaction[] {
    return this.cache.filter(t => { const d = new Date(t.date); return d >= start && d <= end; });
  }
  getTotalBalance(): number { return this.getBalance(); }
  getByPeriod(start: Date, end: Date): Transaction[] { return this.getByDateRange(start, end); }
  getByMonth(year: number, month: number): Transaction[] {
    return this.cache.filter(t => { const d = new Date(t.date); return d.getFullYear() === year && d.getMonth() === month; });
  }
}
