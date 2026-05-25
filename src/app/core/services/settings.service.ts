import { Injectable } from '@angular/core';
import { TRANSACTION_CATEGORIES } from '../models/category.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private data: Record<string, string> = {};

  constructor(private api: ApiService) {}

  async load(): Promise<void> {
    try { this.data = await this.api.get<Record<string, string>>('/api/settings'); } catch {}
  }

  private getVal(key: string, def = ''): string { return this.data[key] ?? localStorage.getItem(key) ?? def; }

  private async setVal(key: string, val: string): Promise<void> {
    this.data[key] = val;
    await this.api.put('/api/settings', { [key]: val }).catch(() => {});
  }

  getCategories(): string[] {
    const v = this.getVal('asbl_categories');
    return v ? JSON.parse(v) : [...TRANSACTION_CATEGORIES];
  }
  async saveCategories(cats: string[]): Promise<void> { await this.setVal('asbl_categories', JSON.stringify(cats)); }
  async addCategory(name: string): Promise<void> {
    const cats = this.getCategories();
    if (!cats.includes(name.trim())) { cats.push(name.trim()); await this.saveCategories(cats); }
  }
  async deleteCategory(name: string): Promise<void> { await this.saveCategories(this.getCategories().filter(c => c !== name)); }

  getDailyAllowance(): number { return parseFloat(this.getVal('asbl_daily_allowance', '10')); }
  async setDailyAllowance(v: number): Promise<void> { await this.setVal('asbl_daily_allowance', String(v)); }
  getKmRateCar(): number { return parseFloat(this.getVal('asbl_km_rate_car', '0.3562')); }
  async setKmRateCar(v: number): Promise<void> { await this.setVal('asbl_km_rate_car', String(v)); }
  getKmRateBike(): number { return parseFloat(this.getVal('asbl_km_rate_bike', '0.27')); }
  async setKmRateBike(v: number): Promise<void> { await this.setVal('asbl_km_rate_bike', String(v)); }

  getAsblName(): string { return this.getVal('asbl_org_name'); }
  async setAsblName(v: string): Promise<void> { await this.setVal('asbl_org_name', v); }
  getBceNumber(): string { return this.getVal('asbl_bce_number'); }
  async setBceNumber(v: string): Promise<void> { await this.setVal('asbl_bce_number', v); }
  getAsblAddress(): string { return this.getVal('asbl_address'); }
  async setAsblAddress(v: string): Promise<void> { await this.setVal('asbl_address', v); }

  // ── Clôture d'exercice ──────────────────────────────────────────────────────
  getClosedYears(): number[] {
    const v = this.getVal('asbl_closed_years');
    return v ? JSON.parse(v) : [];
  }
  isYearClosed(year: number): boolean { return this.getClosedYears().includes(year); }
  async closeYear(year: number): Promise<void> {
    const years = this.getClosedYears();
    if (!years.includes(year)) { years.push(year); await this.setVal('asbl_closed_years', JSON.stringify(years)); }
  }
  async reopenYear(year: number): Promise<void> {
    await this.setVal('asbl_closed_years', JSON.stringify(this.getClosedYears().filter(y => y !== year)));
  }
}
