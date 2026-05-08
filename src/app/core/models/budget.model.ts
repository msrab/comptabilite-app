export type BudgetType = 'annual' | 'project';

export interface BudgetLine {
  id: string;
  category: string;
  description: string;
  plannedAmount: number;
  type: 'income' | 'expense';
}

export interface Budget {
  id: string;
  name: string;
  type: BudgetType;
  year?: number;
  projectId?: string;
  lines: BudgetLine[];
  notes?: string;
  createdAt: Date;
}
