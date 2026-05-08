import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {

  get<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return this.parseDates(JSON.parse(raw)) as T[];
    } catch {
      return [];
    }
  }

  save<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private parseDates(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.parseDates(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string' && this.isDateString(obj[key])) {
          result[key] = new Date(obj[key]);
        } else {
          result[key] = this.parseDates(obj[key]);
        }
      }
      return result;
    }
    return obj;
  }

  private isDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  }
}
