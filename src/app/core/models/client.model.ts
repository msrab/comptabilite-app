export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type: 'individual' | 'organization';
  notes?: string;
  createdAt: Date;
}
