import { Injectable } from '@angular/core';
import { TRANSACTION_CATEGORIES } from '../models/category.model';

const KEYS = {
  categories:       'asbl_categories',
  dailyAllowance:   'asbl_daily_allowance',
  kmRateCar:        'asbl_km_rate_car',
  kmRateBike:       'asbl_km_rate_bike',
};

const DEFAULTS = {
  dailyAllowance: 10.00,   // € / jour bénévole
  kmRateCar:       0.3562, // € / km voiture (barème belge 2024)
  kmRateBike:      0.27,   // € / km vélo
};

@Injectable({ providedIn: 'root' })
export class SettingsService {

  // ── Catégories ─────────────────────────────────────────────────────────────

  getCategories(): string[] {
    const stored = localStorage.getItem(KEYS.categories);
    return stored ? JSON.parse(stored) : [...TRANSACTION_CATEGORIES];
  }

  saveCategories(cats: string[]): void {
    localStorage.setItem(KEYS.categories, JSON.stringify(cats));
  }

  addCategory(name: string): void {
    const cats = this.getCategories();
    if (!cats.includes(name.trim())) {
      cats.push(name.trim());
      this.saveCategories(cats);
    }
  }

  deleteCategory(name: string): void {
    this.saveCategories(this.getCategories().filter(c => c !== name));
  }

  // ── Taux kilométrique & défraiement ────────────────────────────────────────

  getDailyAllowance(): number {
    const v = localStorage.getItem(KEYS.dailyAllowance);
    return v !== null ? parseFloat(v) : DEFAULTS.dailyAllowance;
  }

  setDailyAllowance(val: number): void {
    localStorage.setItem(KEYS.dailyAllowance, String(val));
  }

  getKmRateCar(): number {
    const v = localStorage.getItem(KEYS.kmRateCar);
    return v !== null ? parseFloat(v) : DEFAULTS.kmRateCar;
  }

  setKmRateCar(val: number): void {
    localStorage.setItem(KEYS.kmRateCar, String(val));
  }

  getKmRateBike(): number {
    const v = localStorage.getItem(KEYS.kmRateBike);
    return v !== null ? parseFloat(v) : DEFAULTS.kmRateBike;
  }

  setKmRateBike(val: number): void {
    localStorage.setItem(KEYS.kmRateBike, String(val));
  }
}
