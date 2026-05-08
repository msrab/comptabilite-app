export type DebtType = 'debt' | 'credit'; // debt = je dois payer | credit = on me doit
export type DebtStatus = 'pending' | 'partial' | 'paid' | 'cancelled';

export interface Debt {
  id: string;
  type: DebtType;
  contactId?: string;          // contact unifié (créancier / débiteur)
  personId?: string;           // maintenu pour compatibilité
  clientId?: string;           // maintenu pour compatibilité
  description: string;
  amount: number;
  paidAmount: number;
  dueDate?: Date;
  originTransactionId?: string;
  receiptFile?: string;
  receiptData?: string;
  status: DebtStatus;
  notes?: string;
  createdAt: Date;
}
