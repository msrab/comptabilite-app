export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: TransactionType;
  date: Date;
  category: string;
  isDonation?: boolean;        // cocher si c’est un don
  projectId?: string;
  contactId?: string;          // contact unifié (client, membre, créancier…)
  clientId?: string;           // maintenu pour compatibilité descendants
  debtId?: string;             // lié à une dette/créance
  receiptFile?: string;
  receiptData?: string;
  notes?: string;
  createdAt: Date;
}
