import { Injectable } from '@angular/core';
import { Member } from '../models';
import { StorageService } from './storage.service';

const KEY = 'asbl_members';

@Injectable({ providedIn: 'root' })
export class MemberService {
  constructor(private storage: StorageService) {}

  getAll(): Member[] { return this.storage.get<Member>(KEY); }
  getById(id: string): Member | undefined { return this.getAll().find(m => m.id === id); }

  add(data: Omit<Member, 'id' | 'createdAt'>): Member {
    const list = this.getAll();
    const item: Member = { ...data, id: this.id(), createdAt: new Date() };
    this.storage.save(KEY, [...list, item]);
    return item;
  }

  update(id: string, data: Partial<Member>): void {
    const list = this.getAll();
    const idx = list.findIndex(m => m.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...data }; this.storage.save(KEY, list); }
  }

  delete(id: string): void { this.storage.save(KEY, this.getAll().filter(m => m.id !== id)); }

  private id(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
}
