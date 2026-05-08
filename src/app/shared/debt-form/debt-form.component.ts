import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Debt, Contact, Transaction } from '../../core/models';

@Component({
  selector: 'app-debt-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <form [formGroup]="form" class="form">

      <!-- Type dette / créance -->
      <div class="type-selector">
        <button type="button" class="type-btn" [class.active-expense]="form.get('type')?.value === 'debt'" (click)="form.get('type')?.setValue('debt')">
          <mat-icon>arrow_upward</mat-icon> Je dois payer (Dette)
        </button>
        <button type="button" class="type-btn" [class.active-income]="form.get('type')?.value === 'credit'" (click)="form.get('type')?.setValue('credit')">
          <mat-icon>arrow_downward</mat-icon> On me doit (Créance)
        </button>
      </div>

      <!-- Description -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description *</mat-label>
        <input matInput formControlName="description" placeholder="Description de la dette/créance">
        <mat-error>Champ requis</mat-error>
      </mat-form-field>

      <!-- Contact (créancier / débiteur) -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Créancier / Débiteur *</mat-label>
        <mat-select formControlName="contactId">
          <mat-option value="">-- Sélectionner un contact --</mat-option>
          <mat-optgroup *ngFor="let group of contactGroups" [label]="group.label">
            <mat-option *ngFor="let c of group.contacts" [value]="c.id">
              {{ c.name }}{{ c.organization ? ' – ' + c.organization : '' }}
            </mat-option>
          </mat-optgroup>
        </mat-select>
        <mat-error>Champ requis</mat-error>
      </mat-form-field>

      <!-- Montants -->
      <div class="row">
        <mat-form-field appearance="outline">
          <mat-label>Montant total (€) *</mat-label>
          <input matInput formControlName="amount" type="number" min="0" step="0.01">
          <span matPrefix>€&nbsp;</span>
          <mat-error>Montant requis</mat-error>
        </mat-form-field>
        <mat-form-field *ngIf="showExtendedFields" appearance="outline">
          <mat-label>Montant déjà payé (€)</mat-label>
          <input matInput formControlName="paidAmount" type="number" min="0" step="0.01">
          <span matPrefix>€&nbsp;</span>
        </mat-form-field>
      </div>

      <!-- Date d'échéance -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Date d'échéance (optionnel)</mat-label>
        <input matInput [matDatepicker]="dp" formControlName="dueDate">
        <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
        <mat-datepicker #dp></mat-datepicker>
      </mat-form-field>

      <!-- Transaction d'origine (mode étendu uniquement) -->
      <mat-form-field *ngIf="showExtendedFields && transactions.length > 0" appearance="outline" class="full-width">
        <mat-label>Transaction d'origine (optionnel)</mat-label>
        <mat-select formControlName="originTransactionId">
          <mat-option value="">Aucune</mat-option>
          <mat-option *ngFor="let t of transactions" [value]="t.id">
            {{ t.title }} - {{ t.date | date:'dd/MM/yyyy' }} - {{ t.amount | currency:'EUR':'symbol':'1.2-2':'fr' }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Statut (mode étendu uniquement) -->
      <mat-form-field *ngIf="showExtendedFields" appearance="outline" class="full-width">
        <mat-label>Statut</mat-label>
        <mat-select formControlName="status">
          <mat-option value="pending">En attente</mat-option>
          <mat-option value="partial">Partiellement payé</mat-option>
          <mat-option value="paid">Payé</mat-option>
          <mat-option value="cancelled">Annulé</mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Pièce justificative (mode étendu uniquement) -->
      <div *ngIf="showExtendedFields" class="file-upload">
        <button type="button" mat-stroked-button (click)="fileInput.click()">
          <mat-icon>attach_file</mat-icon> Pièce justificative
        </button>
        <input #fileInput type="file" hidden accept=".pdf,.jpg,.jpeg,.png" (change)="onFileChange($event)">
        <span *ngIf="form.get('receiptFile')?.value" class="filename">
          <mat-icon>check_circle</mat-icon> {{ form.get('receiptFile')?.value }}
        </span>
      </div>

      <!-- Rappel des valeurs par défaut (mode simplifié) -->
      <div *ngIf="!showExtendedFields" class="defaults-banner">
        <mat-icon>info_outline</mat-icon>
        <span>Montant déjà payé : <strong>0 €</strong> &nbsp;|&nbsp; Statut : <strong>En attente</strong></span>
      </div>

      <!-- Notes -->
      <mat-form-field appearance="outline" class="full-width" [style.margin-top]="showExtendedFields ? '12px' : '0'">
        <mat-label>Notes</mat-label>
        <textarea matInput formControlName="notes" rows="2" placeholder="Optionnel"></textarea>
      </mat-form-field>

    </form>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 12px; mat-form-field { flex: 1; } }

    .type-selector { display: flex; gap: 8px; margin-bottom: 8px; }
    .type-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 14px; border-radius: 8px;
      border: 1.5px solid #e8ecf4;
      background: #f8f9fc; color: #6b7280;
      font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: #c5d0f5; background: #f0f4ff; }
      &.active-income  { border-color: #10b981; background: #d1fae5; color: #059669; mat-icon { color: #059669; } }
      &.active-expense { border-color: #ef4444; background: #fee2e2; color: #dc2626; mat-icon { color: #dc2626; } }
    }

    .file-upload { display: flex; align-items: center; gap: 12px; }
    .filename { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #059669;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .defaults-banner { display: flex; align-items: center; gap: 8px; background: #e8f4fd; border: 1px solid #90caf9; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #1565c0; margin-top: 4px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    }
  `]
})
export class DebtFormComponent implements OnInit, OnChanges {
  @Input() debt?: Debt;
  @Input() contacts: Contact[] = [];
  @Input() transactions: Transaction[] = [];
  /** Affiche les champs avancés : montant payé, statut, pièce, transaction d'origine */
  @Input() showExtendedFields = true;
  /** Émet le FormGroup dès qu'il est prêt (ou re-initialisé) */
  @Output() formReady = new EventEmitter<FormGroup>();

  form!: FormGroup;

  contactGroups: { label: string; contacts: Contact[] }[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.buildGroups();
  }

  ngOnChanges(): void {
    this.buildGroups();
  }

  private buildForm(): void {
    const d = this.debt;
    this.form = this.fb.group({
      type: [d?.type || 'debt', Validators.required],
      description: [d?.description || '', Validators.required],
      contactId: [d?.contactId || ''],
      amount: [d?.amount ?? null, [Validators.required, Validators.min(0.01)]],
      paidAmount: [d?.paidAmount ?? 0],
      dueDate: [d?.dueDate ? new Date(d.dueDate) : null],
      originTransactionId: [d?.originTransactionId || ''],
      status: [d?.status || 'pending', Validators.required],
      receiptFile: [d?.receiptFile || ''],
      receiptData: [d?.receiptData || ''],
      notes: [d?.notes || '']
    });
    this.formReady.emit(this.form);
  }

  private buildGroups(): void {
    const clients  = this.contacts.filter(c => c.roles.includes('client') && !c.roles.includes('member'));
    const members  = this.contacts.filter(c => c.roles.includes('member') && !c.roles.includes('client'));
    const both     = this.contacts.filter(c => c.roles.includes('client') && c.roles.includes('member'));
    const others   = this.contacts.filter(c => c.roles.length === 0);

    this.contactGroups = [
      ...(clients.length  ? [{ label: 'Clients',           contacts: clients  }] : []),
      ...(members.length  ? [{ label: 'Membres',           contacts: members  }] : []),
      ...(both.length     ? [{ label: 'Clients & Membres', contacts: both     }] : []),
      ...(others.length   ? [{ label: 'Autres contacts',   contacts: others   }] : []),
    ];
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.form.patchValue({ receiptFile: file.name });
    const reader = new FileReader();
    reader.onload = e => this.form.patchValue({ receiptData: e.target?.result as string });
    reader.readAsDataURL(file);
  }
}
