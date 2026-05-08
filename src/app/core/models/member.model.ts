export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  joinDate?: Date;
  endDate?: Date;
  active: boolean;
  notes?: string;
  createdAt: Date;
}
