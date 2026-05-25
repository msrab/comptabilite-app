import { Injectable } from '@angular/core';
import { TransactionService } from './transaction.service';
import { ContactService } from './contact.service';
import { ProjectService } from './project.service';
import { DebtService } from './debt.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class DataLoaderService {
  private loaded = false;

  constructor(
    private txService: TransactionService,
    private contactService: ContactService,
    private projectService: ProjectService,
    private debtService: DebtService,
    private settingsService: SettingsService,
  ) {}

  async loadAll(): Promise<void> {
    await Promise.all([
      this.txService.load(),
      this.contactService.load(),
      this.projectService.load(),
      this.debtService.load(),
      this.settingsService.load(),
    ]);
    this.loaded = true;
  }

  isLoaded(): boolean { return this.loaded; }

  reset(): void { this.loaded = false; }
}
