import { Injectable } from '@angular/core';
import { Project } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private cache: Project[] = [];

  constructor(private api: ApiService) {}

  async load(): Promise<void> { this.cache = await this.api.get<Project[]>('/api/projects'); }

  getAll(): Project[] { return this.cache; }
  getById(id: string): Project | undefined { return this.cache.find(p => p.id === id); }
  getByClient(clientId: string): Project[] { return this.cache.filter(p => (p as any).clientId === clientId); }

  async add(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const p = await this.api.post<Project>('/api/projects', data);
    this.cache.unshift(p);
    return p;
  }

  async update(id: string, data: Partial<Project>): Promise<void> {
    const p = await this.api.put<Project>(`/api/projects/${id}`, data);
    const idx = this.cache.findIndex(x => x.id === id);
    if (idx >= 0) this.cache[idx] = p;
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/api/projects/${id}`);
    this.cache = this.cache.filter(p => p.id !== id);
  }
}
