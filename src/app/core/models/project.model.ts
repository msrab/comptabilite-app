export type ProjectStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  status: ProjectStatus;
  budget?: number;
  notes?: string;
  createdAt: Date;
}
