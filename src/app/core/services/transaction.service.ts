import { Injectable } from '@angular/core';
import { Transaction } from '../models';
import { StorageService } from './storage.service';

const KEY = 'asbl_transactions';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private storage: StorageService) {}

  getAll(): Transaction[] { return this.storage.get<Transaction>(KEY); }
  getById(id: string): Transaction | undefined { return this.getAll().find(t => t.id === id); }
  getByProject(projectId: string): Transaction[] { return this.getAll().filter(t => t.projectId === projectId); }
  getByClient(clientId: string): Transaction[] { return this.getAll().filter(t => t.clientId === clientId); }
  getByDebt(debtId: string): Transaction[] { return this.getAll().filter(t => t.debtId === debtId); }

  getIncomes(): Transaction[] { return this.getAll().filter(t => t.type === 'income'); }
  getExpenses(): Transaction[] { return this.getAll().filter(t => t.type === 'expense'); }

  getTotalBalance(): number {
    return this.getAll().reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  }

  getTotalIncome(): number { return this.getIncomes().reduce((acc, t) => acc + t.amount, 0); }
  getTotalExpense(): number { return this.getExpenses().reduce((acc, t) => acc + t.amount, 0); }

  getByPeriod(start: Date, end: Date): Transaction[] {
    return this.getAll().filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }

  getByMonth(year: number, month: number): Transaction[] {
    return this.getAll().filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  add(data: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const list = this.getAll();
    const item: Transaction = { ...data, id: this.id(), createdAt: new Date() };
    this.storage.save(KEY, [...list, item]);
    return item;
  }

  update(id: string, data: Partial<Transaction>): void {
    const list = this.getAll();
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...data }; this.storage.save(KEY, list); }
  }

  delete(id: string): void { this.storage.save(KEY, this.getAll().filter(t => t.id !== id)); }

  private id(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
}
