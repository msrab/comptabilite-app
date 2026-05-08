import { Injectable } from '@angular/core';
import { Project } from '../models';
import { StorageService } from './storage.service';

const KEY = 'asbl_projects';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private storage: StorageService) {}

  getAll(): Project[] { return this.storage.get<Project>(KEY); }
  getById(id: string): Project | undefined { return this.getAll().find(p => p.id === id); }
  getByClient(clientId: string): Project[] { return this.getAll().filter(p => p.clientId === clientId); }

  add(data: Omit<Project, 'id' | 'createdAt'>): Project {
    const list = this.getAll();
    const item: Project = { ...data, id: this.id(), createdAt: new Date() };
    this.storage.save(KEY, [...list, item]);
    return item;
  }

  update(id: string, data: Partial<Project>): void {
    const list = this.getAll();
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...data }; this.storage.save(KEY, list); }
  }

  delete(id: string): void { this.storage.save(KEY, this.getAll().filter(p => p.id !== id)); }

  private id(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
}
