import { Injectable } from '@angular/core';
import { Budget, BudgetLine } from '../models';
import { StorageService } from './storage.service';
import { TransactionService } from './transaction.service';

const KEY = 'asbl_budgets';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  constructor(private storage: StorageService, private transactionService: TransactionService) {}

  getAll(): Budget[] { return this.storage.get<Budget>(KEY); }
  getById(id: string): Budget | undefined { return this.getAll().find(b => b.id === id); }
  getByYear(year: number): Budget[] { return this.getAll().filter(b => b.year === year); }
  getByProject(projectId: string): Budget[] { return this.getAll().filter(b => b.projectId === projectId); }
  getAnnual(): Budget[] { return this.getAll().filter(b => b.type === 'annual'); }
  getProjectBudgets(): Budget[] { return this.getAll().filter(b => b.type === 'project'); }

  getTotalPlannedIncome(budget: Budget): number {
    return budget.lines.filter(l => l.type === 'income').reduce((acc, l) => acc + l.plannedAmount, 0);
  }

  getTotalPlannedExpense(budget: Budget): number {
    return budget.lines.filter(l => l.type === 'expense').reduce((acc, l) => acc + l.plannedAmount, 0);
  }

  getActualVsBudget(budget: Budget): { planned: number; actual: number; type: 'income' | 'expense'; category: string }[] {
    const results: { planned: number; actual: number; type: 'income' | 'expense'; category: string }[] = [];
    for (const line of budget.lines) {
      let actual = 0;
      const transactions = budget.year
        ? this.transactionService.getAll().filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === budget.year && t.type === line.type && t.category === line.category;
          })
        : budget.projectId
        ? this.transactionService.getAll().filter(t => t.projectId === budget.projectId && t.type === line.type && t.category === line.category)
        : [];
      actual = transactions.reduce((acc, t) => acc + t.amount, 0);
      results.push({ planned: line.plannedAmount, actual, type: line.type, category: line.category });
    }
    return results;
  }

  add(data: Omit<Budget, 'id' | 'createdAt'>): Budget {
    const list = this.getAll();
    const item: Budget = { ...data, id: this.id(), createdAt: new Date() };
    this.storage.save(KEY, [...list, item]);
    return item;
  }

  update(id: string, data: Partial<Budget>): void {
    const list = this.getAll();
    const idx = list.findIndex(b => b.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...data }; this.storage.save(KEY, list); }
  }

  delete(id: string): void { this.storage.save(KEY, this.getAll().filter(b => b.id !== id)); }

  private id(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
}
