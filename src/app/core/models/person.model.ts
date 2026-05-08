export type PersonType = 'creditor' | 'debtor' | 'both';

export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type: PersonType;
  notes?: string;
  createdAt: Date;
}
