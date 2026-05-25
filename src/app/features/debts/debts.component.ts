import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DebtService } from '../../core/services/debt.service';
import { ContactService } from '../../core/services/contact.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Debt, Contact, Transaction } from '../../core/models';
import { DebtFormComponent } from '../../shared/debt-form/debt-form.component';

@Component({
  selector: 'app-debt-form-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DebtFormComponent],
  template: `
    <h2 mat-dialog-title>{{ data.debt ? 'Modifier' : 'Ajouter' }} une dette / créance</h2>
    <mat-dialog-content style="padding-top:12px; min-width:580px">
      <app-debt-form
        [debt]="data.debt"
        [contacts]="data.contacts"
        [transactions]="data.transactions"
        [showExtendedFields]="true"
        (formReady)="form = \$event">
      </app-debt-form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" [disabled]="!form || form.invalid" (click)="save()">
        <mat-icon>save</mat-icon> Enregistrer
      </button>
    </mat-dialog-actions>
  `
})
export class DebtFormDialogComponent {
  form?: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DebtFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { debt?: Debt; contacts: Contact[]; transactions: Transaction[] }
  ) {}

  save(): void {
    if (this.form?.valid) this.dialogRef.close(this.form.value);
  }
}

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatSnackBarModule, MatTooltipModule, MatTabsModule, MatDividerModule,
    MatProgressBarModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Dettes & Créances</h2>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Ajouter
        </button>
      </div>

      <div class="summary-row">
        <mat-card class="s-card debt">
          <mat-icon>arrow_upward</mat-icon>
          <div><span class="s-lbl">Dettes en cours</span><span class="s-val">{{ totalPendingDebt | currency:'EUR':'symbol':'1.2-2':'fr' }}</span></div>
        </mat-card>
        <mat-card class="s-card credit">
          <mat-icon>arrow_downward</mat-icon>
          <div><span class="s-lbl">Créances en cours</span><span class="s-val">{{ totalPendingCredit | currency:'EUR':'symbol':'1.2-2':'fr' }}</span></div>
        </mat-card>
        <mat-card class="s-card overdue">
          <mat-icon>warning</mat-icon>
          <div><span class="s-lbl">Échues</span><span class="s-val">{{ overdueCount }}</span></div>
        </mat-card>
      </div>

      <mat-tab-group>
        <mat-tab label="Dettes (je dois payer)">
          <div class="debts-list">
            <div *ngIf="debts.length === 0" class="empty-state">
              <mat-icon>check_circle</mat-icon><p>Aucune dette</p>
            </div>
            <mat-card *ngFor="let d of debts" class="debt-card" [ngClass]="d.status">
              <div class="debt-header">
                <div class="debt-icon debt"><mat-icon>arrow_upward</mat-icon></div>
                <div class="debt-info">
                  <span class="debt-desc">{{ d.description }}</span>
                  <span class="debt-person">{{ getContactName(d.contactId) }}</span>
                </div>
                <div class="debt-right">
                  <span class="status-badge" [ngClass]="d.status">{{ statusLabel(d.status) }}</span>
                  <span *ngIf="d.dueDate" class="due-date" [class.overdue]="isOverdue(d.dueDate)">
                    <mat-icon>{{ isOverdue(d.dueDate) ? 'warning' : 'schedule' }}</mat-icon>
                    {{ d.dueDate | date:'dd/MM/yyyy' }}
                  </span>
                </div>
              </div>
              <div class="debt-amounts">
                <span>Total: <strong>{{ d.amount | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></span>
                <span>Payé: <strong>{{ d.paidAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></span>
                <span>Reste: <strong class="red">{{ (d.amount - d.paidAmount) | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></span>
              </div>
              <mat-progress-bar [value]="(d.paidAmount / d.amount) * 100" [color]="d.status === 'paid' ? 'primary' : 'warn'"></mat-progress-bar>
              <div class="debt-actions">
                <button mat-icon-button color="primary" matTooltip="Modifier" (click)="openForm(d)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="delete(d)"><mat-icon>delete</mat-icon></button>
                <button *ngIf="d.receiptData" mat-icon-button matTooltip="Voir pièce" (click)="viewReceipt(d)"><mat-icon>attach_file</mat-icon></button>
              </div>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Créances (on me doit)">
          <div class="debts-list">
            <div *ngIf="credits.length === 0" class="empty-state">
              <mat-icon>check_circle</mat-icon><p>Aucune créance</p>
            </div>
            <mat-card *ngFor="let d of credits" class="debt-card" [ngClass]="d.status">
              <div class="debt-header">
                <div class="debt-icon credit"><mat-icon>arrow_downward</mat-icon></div>
                <div class="debt-info">
                  <span class="debt-desc">{{ d.description }}</span>
                  <span class="debt-person">{{ getContactName(d.contactId) }}</span>
                </div>
                <div class="debt-right">
                  <span class="status-badge" [ngClass]="d.status">{{ statusLabel(d.status) }}</span>
                  <span *ngIf="d.dueDate" class="due-date" [class.overdue]="isOverdue(d.dueDate)">
                    <mat-icon>{{ isOverdue(d.dueDate) ? 'warning' : 'schedule' }}</mat-icon>
                    {{ d.dueDate | date:'dd/MM/yyyy' }}
                  </span>
                </div>
              </div>
              <div class="debt-amounts">
                <span>Total: <strong>{{ d.amount | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></span>
                <span>Reçu: <strong>{{ d.paidAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></span>
                <span>Reste: <strong class="green">{{ (d.amount - d.paidAmount) | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></span>
              </div>
              <mat-progress-bar [value]="(d.paidAmount / d.amount) * 100" color="primary"></mat-progress-bar>
              <div class="debt-actions">
                <button mat-icon-button color="primary" matTooltip="Modifier" (click)="openForm(d)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="delete(d)"><mat-icon>delete</mat-icon></button>
              </div>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1a237e; margin: 0; }
    .summary-row { display: flex; gap: 16px; margin-bottom: 24px; }
    .s-card { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px !important; flex: 1;
      mat-icon { font-size: 32px; width: 32px; height: 32px; }
      .s-lbl { display: block; font-size: 12px; color: #666; text-transform: uppercase; }
      .s-val { display: block; font-size: 1.3rem; font-weight: 700; }
      &.debt mat-icon { color: #c62828; } &.credit mat-icon { color: #2e7d32; } &.overdue mat-icon { color: #f57c00; }
    }
    .debts-list { padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
    .empty-state { text-align: center; padding: 64px; color: #999; mat-icon { font-size: 64px; width: 64px; height: 64px; } }
    .debt-card { border-radius: 12px !important; padding: 16px; &.paid { opacity: 0.7; } }
    .debt-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .debt-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      &.debt   { background: #ffebee; mat-icon { color: #c62828; } }
      &.credit { background: #e8f5e9; mat-icon { color: #2e7d32; } }
    }
    .debt-info { flex: 1;
      .debt-desc   { display: block; font-weight: 500; font-size: 15px; }
      .debt-person { display: block; font-size: 13px; color: #888; }
    }
    .debt-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .status-badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;
      &.pending   { background: #fff3e0; color: #f57c00; }
      &.partial   { background: #e3f2fd; color: #1565c0; }
      &.paid      { background: #e8f5e9; color: #2e7d32; }
      &.cancelled { background: #f5f5f5; color: #666; }
    }
    .due-date { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #888;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &.overdue { color: #c62828; }
    }
    .debt-amounts { display: flex; gap: 16px; font-size: 13px; margin-bottom: 8px; }
    .red   { color: #c62828; }
    .green { color: #2e7d32; }
    .debt-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
  `]
})
export class DebtsComponent implements OnInit {
  allDebts: Debt[] = [];
  debts: Debt[] = [];
  credits: Debt[] = [];
  contacts: Contact[] = [];
  transactions: Transaction[] = [];

  get totalPendingDebt(): number {
    return this.debts.filter(d => d.status !== 'paid' && d.status !== 'cancelled')
      .reduce((a, d) => a + (d.amount - d.paidAmount), 0);
  }
  get totalPendingCredit(): number {
    return this.credits.filter(d => d.status !== 'paid' && d.status !== 'cancelled')
      .reduce((a, d) => a + (d.amount - d.paidAmount), 0);
  }
  get overdueCount(): number {
    return this.allDebts.filter(d => d.dueDate && this.isOverdue(d.dueDate) && d.status !== 'paid').length;
  }

  constructor(
    private debtService: DebtService,
    private contactService: ContactService,
    private txService: TransactionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.contacts = this.contactService.getAll();
    this.transactions = this.txService.getAll();
    this.allDebts = this.debtService.getAll();
    this.debts = this.allDebts.filter(d => d.type === 'debt');
    this.credits = this.allDebts.filter(d => d.type === 'credit');
  }

  openForm(debt?: Debt): void {
    const ref = this.dialog.open(DebtFormDialogComponent, {
      width: '680px',
      data: { debt, contacts: this.contacts, transactions: this.transactions }
    });
    ref.afterClosed().subscribe(async result => {
      if (!result) return;
      if (debt) {
        await this.debtService.update(debt.id, result);
        this.snackBar.open('Mis à jour', 'Fermer', { duration: 3000 });
      } else {
        await this.debtService.add(result);
        this.snackBar.open('Ajouté', 'Fermer', { duration: 3000 });
      }
      this.load();
    });
  }

  delete(debt: Debt): void {
    if (confirm(`Supprimer "\${debt.description}" ?`)) {
      this.debtService.delete(debt.id).then(() => {
        this.snackBar.open('Supprimé', 'Fermer', { duration: 3000 });
        this.load();
      });
    }
  }

  viewReceipt(d: Debt): void {
    if (d.receiptData) {
      const win = window.open();
      win?.document.write(`<img src="\${d.receiptData}" style="max-width:100%">`);
    }
  }

  getContactName(id?: string): string {
    return this.contacts.find(c => c.id === id)?.name || id || '';
  }
  isOverdue(date: Date): boolean { return new Date(date) < new Date(); }
  statusLabel(s: string): string {
    const m: Record<string, string> = { pending: 'En attente', partial: 'Partiel', paid: 'Payé', cancelled: 'Annulé' };
    return m[s] || s;
  }
}
