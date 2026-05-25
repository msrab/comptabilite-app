import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { ProjectService } from '../../core/services/project.service';
import { DebtService } from '../../core/services/debt.service';
import { ContactService } from '../../core/services/contact.service';
import { SettingsService } from '../../core/services/settings.service';
import { Transaction, Project, Debt, Contact, CAT_ALLOWANCE, CAT_KM } from '../../core/models';
import { DebtFormComponent } from '../../shared/debt-form/debt-form.component';

@Component({
  selector: 'app-transaction-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule, MatRadioModule, MatDividerModule, MatChipsModule, MatTooltipModule, DebtFormComponent],
  template: `
    <div class="dialog-wrap">
      <div class="dialog-header">
        <div class="dialog-title-row">
          <div class="dialog-icon" [class.income]="form?.get('type')?.value === 'income'" [class.expense]="form?.get('type')?.value === 'expense'">
            <mat-icon>{{ data.transaction ? 'edit' : (form?.get('type')?.value === 'income' ? 'add_circle' : 'remove_circle') }}</mat-icon>
          </div>
          <div>
            <h2>{{ data.transaction ? 'Modifier' : 'Nouvelle' }} transaction</h2>
            <p>{{ data.transaction ? 'Modifiez les informations' : 'Remplissez les informations de la transaction' }}</p>
          </div>
        </div>
        <button class="close-btn" mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="form">

          <!-- Type toggle -->
          <div class="type-toggle">
            <button type="button" class="type-btn" [class.active-income]="form.get('type')?.value === 'income'" (click)="form.get('type')?.setValue('income')">
              <mat-icon>arrow_upward</mat-icon> Entrée (Revenu)
            </button>
            <button type="button" class="type-btn" [class.active-expense]="form.get('type')?.value === 'expense'" (click)="form.get('type')?.setValue('expense')">
              <mat-icon>arrow_downward</mat-icon> Sortie (Dépense)
            </button>
          </div>

          <!-- Titre + Description -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Titre *</mat-label>
            <input matInput formControlName="title" placeholder="Ex: Cotisation membre, Achat matériel...">
            <mat-error>Champ requis</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="2" placeholder="Détails optionnels..."></textarea>
          </mat-form-field>

          <!-- Montant + Date -->
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Montant (€) *</mat-label>
              <input matInput formControlName="amount" type="number" min="0" step="0.01">
              <span matPrefix>€&nbsp;</span>
              <mat-error>Montant requis</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Date *</mat-label>
              <input matInput [matDatepicker]="dp" formControlName="date">
              <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
              <mat-datepicker #dp></mat-datepicker>
              <mat-error>Date requise</mat-error>
            </mat-form-field>
          </div>

          <!-- Avertissement exercice clôturé -->
          <div *ngIf="isSelectedYearClosed" class="year-closed-banner">
            <mat-icon>lock</mat-icon>
            <span>L'exercice <strong>{{ selectedYear }}</strong> est clôturé. Vous ne pouvez plus enregistrer de transactions pour cette année.</span>
          </div>

          <!-- Catégorie -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Catégorie *</mat-label>
            <mat-select formControlName="category" (selectionChange)="onCategoryChange($event.value)">
              <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
            </mat-select>
            <mat-error>Champ requis</mat-error>
          </mat-form-field>

          <!-- ═══ Panneau défraiement bénévole ═══ -->
          <div *ngIf="form.get('category')?.value === CAT_ALLOWANCE" class="special-panel allowance-panel">
            <div class="special-panel-header">
              <mat-icon>volunteer_activism</mat-icon>
              <strong>Défraiement journalier bénévole</strong>
              <span class="rate-tag">{{ dailyAllowance | currency:'EUR':'symbol':'1.2-2':'fr' }} / jour</span>
            </div>
            <div class="allowance-inputs">
              <mat-form-field appearance="outline">
                <mat-label>Nombre de jours *</mat-label>
                <input matInput type="number" [(ngModel)]="allowanceDays" [ngModelOptions]="{standalone:true}"
                  min="1" step="1" (input)="updateAllowanceTitle()">
                <span matSuffix>jour(s)</span>
                <mat-hint>{{ allowanceDays }} × {{ dailyAllowance | currency:'EUR':'symbol':'1.2-2':'fr' }} = {{ allowanceDays * dailyAllowance | currency:'EUR':'symbol':'1.2-2':'fr' }}</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nom du bénévole *</mat-label>
                <input matInput [(ngModel)]="allowancePerson" [ngModelOptions]="{standalone:true}"
                  (input)="updateAllowanceTitle()" placeholder="Ex: Marie Dupont">
              </mat-form-field>
            </div>
          </div>

          <!-- ═══ Panneau déplacement kilométrique ═══ -->
          <div *ngIf="form.get('category')?.value === CAT_KM" class="special-panel km-panel">
            <div class="special-panel-header">
              <mat-icon>route</mat-icon>
              <strong>Déplacement kilométrique</strong>
            </div>
            <div class="km-vehicle-row">
              <button type="button" class="vehicle-btn" [class.active]="kmVehicle === 'voiture'" (click)="setVehicle('voiture')">
                <mat-icon>directions_car</mat-icon> Voiture
                <span class="vehicle-rate">{{ kmRateCar | number:'1.4-4':'fr' }} €/km</span>
              </button>
              <button type="button" class="vehicle-btn" [class.active]="kmVehicle === 'velo'" (click)="setVehicle('velo')">
                <mat-icon>pedal_bike</mat-icon> Vélo
                <span class="vehicle-rate">{{ kmRateBike | number:'1.4-4':'fr' }} €/km</span>
              </button>
            </div>
            <div class="km-inputs">
              <mat-form-field appearance="outline">
                <mat-label>Nombre de km *</mat-label>
                <input matInput type="number" [(ngModel)]="kmDistance" [ngModelOptions]="{standalone:true}"
                  min="0" step="0.1" (input)="updateKmTransaction()">
                <span matSuffix>km</span>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nom du bénévole / personne</mat-label>
                <input matInput [(ngModel)]="kmPerson" [ngModelOptions]="{standalone:true}"
                  (input)="updateKmTransaction()" placeholder="Ex: Jean Martin">
              </mat-form-field>
            </div>
            <div *ngIf="kmDistance" class="km-preview">
              <mat-icon>calculate</mat-icon>
              {{ kmDistance }} km × {{ (kmVehicle === 'voiture' ? kmRateCar : kmRateBike) | number:'1.4-4':'fr' }} = <strong>{{ kmAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
            </div>
          </div>

          <!-- Section liaisons -->
          <div class="section-header">
            <span class="section-label">Liaisons</span>
            <span class="section-hint">Optionnel</span>
          </div>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Projet</mat-label>
              <mat-select formControlName="projectId">
                <mat-option value="">Aucun</mat-option>
                <mat-option *ngFor="let p of projects" [value]="p.id">{{ p.name }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Contact</mat-label>
              <mat-select formControlName="contactId">
                <mat-option value="">Aucun</mat-option>
                <mat-option *ngFor="let c of contacts" [value]="c.id">{{ c.name }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Dette liée -->
          <div class="debt-link-section">
            <div class="debt-select-row">
              <mat-form-field appearance="outline" class="flex1">
                <mat-label>Lier à une dette / créance existante</mat-label>
                <mat-select formControlName="debtId" [disabled]="showNewDebtForm">
                  <mat-option value="">Aucune</mat-option>
                  <mat-option *ngFor="let d of pendingDebts" [value]="d.id">
                    {{ d.description }} — {{ d.type === 'debt' ? 'Dette' : 'Créance' }} — Reste: {{ (d.amount - d.paidAmount) | currency:'EUR':'symbol':'1.2-2':'fr' }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <button type="button" class="new-debt-btn" [class.active]="showNewDebtForm" (click)="toggleNewDebtForm()" matTooltip="{{ showNewDebtForm ? 'Annuler la création' : 'Créer une nouvelle dette/créance' }}">
                <mat-icon>{{ showNewDebtForm ? 'close' : 'add' }}</mat-icon>
                <span>{{ showNewDebtForm ? 'Annuler' : 'Créer une dette' }}</span>
              </button>
            </div>

            <!-- Inline new debt form -->
            <div *ngIf="showNewDebtForm" class="new-debt-panel">
              <div class="new-debt-title">
                <mat-icon>add_circle_outline</mat-icon>
                Nouvelle dette / créance
              </div>
              <app-debt-form
                [contacts]="contacts"
                [showExtendedFields]="false"
                (formReady)="newDebtForm = $event">
              </app-debt-form>
              <div class="debt-info-banner" style="margin-top:8px">
                <mat-icon>info_outline</mat-icon>
                La dette sera créée et automatiquement liée à cette transaction. Le montant de la transaction sera enregistré comme premier paiement partiel.
              </div>
            </div>
          </div>

          <!-- Pièce justificative -->
          <div class="section-header">
            <span class="section-label">Pièce justificative</span>
          </div>
          <div class="file-upload">
            <button type="button" class="upload-btn" (click)="fileInput.click()">
              <mat-icon>attach_file</mat-icon> Joindre un fichier
            </button>
            <input #fileInput type="file" hidden accept=".pdf,.jpg,.jpeg,.png" (change)="onFileChange($event)">
            <span *ngIf="form.get('receiptFile')?.value" class="filename">
              <mat-icon>check_circle</mat-icon> {{ form.get('receiptFile')?.value }}
            </span>
          </div>

          <mat-form-field appearance="outline" class="full-width" style="margin-top: 12px">
            <mat-label>Notes</mat-label>
            <textarea matInput formControlName="notes" rows="2" placeholder="Remarques..."></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button class="action-btn cancel" mat-dialog-close>Annuler</button>
        <button class="action-btn save" [disabled]="form.invalid || isSelectedYearClosed || (showNewDebtForm && newDebtForm?.invalid)" (click)="save()">
          <mat-icon>save</mat-icon>
          Enregistrer la transaction
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-wrap { display: flex; flex-direction: column; min-width: 600px; max-width: 700px; }

    /* Panneaux spéciaux */
    .special-panel { border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .special-panel-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-size: 14px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .rate-tag { margin-left: auto; background: rgba(0,0,0,.08); padding: 2px 10px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    }
    .allowance-inputs { display: flex; gap: 12px; mat-form-field { flex: 1; } }
    .allowance-panel { background: #fff8e1; border: 1px solid #ffe082; }
    .km-panel { background: #e8f5e9; border: 1px solid #a5d6a7; }
    .km-vehicle-row { display: flex; gap: 10px; margin-bottom: 14px; }
    .vehicle-btn { display: flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 8px; border: 2px solid #ccc;
      background: white; cursor: pointer; font-size: 13px; font-weight: 500; transition: all .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      .vehicle-rate { font-size: 11px; color: #888; margin-left: 4px; }
      &.active { border-color: #388e3c; background: #388e3c; color: white; .vehicle-rate { color: rgba(255,255,255,.8); } }
      &:hover:not(.active) { border-color: #aaa; }
    }
    .km-inputs { display: flex; gap: 12px; mat-form-field { flex: 1; } }
    .km-preview { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(255,255,255,.7); border-radius: 8px; font-size: 13px; color: #2e7d32;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      strong { font-size: 15px; }
    }

    .dialog-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 24px 24px 16px;
      border-bottom: 1px solid #f3f4f6;
    }
    .dialog-title-row { display: flex; align-items: center; gap: 14px; }
    .dialog-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      background: #f3f4f6;
      mat-icon { font-size: 22px; width: 22px; height: 22px; color: #6b7280; }
      &.income { background: #d1fae5; mat-icon { color: #059669; } }
      &.expense { background: #fee2e2; mat-icon { color: #dc2626; } }
    }
    .dialog-header h2 { font-size: 16px; font-weight: 700; color: #0d1117; margin: 0; }
    .dialog-header p  { font-size: 12px; color: #9ca3af; margin: 3px 0 0; }
    .close-btn { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 4px; border-radius: 6px; &:hover { background: #f3f4f6; color: #374151; } mat-icon { font-size: 20px; width: 20px; height: 20px; } }

    mat-dialog-content { padding: 0 24px !important; max-height: 65vh; overflow-y: auto; }

    .form { display: flex; flex-direction: column; gap: 8px; padding: 16px 0 8px; }
    .full-width { width: 100%; }
    .flex1 { flex: 1; }
    .row { display: flex; gap: 12px; mat-form-field { flex: 1; } }

    /* Type toggle */
    .type-toggle {
      display: flex; gap: 8px; margin-bottom: 8px;
      &.small { margin-bottom: 12px; }
    }
    .type-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 14px; border-radius: 8px;
      border: 1.5px solid #e8ecf4;
      background: #f8f9fc; color: #6b7280;
      font-size: 13px; font-weight: 500; cursor: pointer;
      transition: all 0.15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: #c5d0f5; background: #f0f4ff; }
      &.active-income  { border-color: #10b981; background: #d1fae5; color: #059669; mat-icon { color: #059669; } }
      &.active-expense { border-color: #ef4444; background: #fee2e2; color: #dc2626; mat-icon { color: #dc2626; } }
    }

    /* Section header */
    .section-header { display: flex; align-items: center; gap: 8px; margin: 4px 0 2px; }
    .section-label { font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
    .section-hint  { font-size: 11px; color: #9ca3af; }

    /* Debt link section */
    .debt-link-section { display: flex; flex-direction: column; gap: 0; }
    .debt-select-row { display: flex; align-items: flex-start; gap: 10px; }
    .new-debt-btn {
      display: flex; align-items: center; gap: 6px;
      height: 40px; padding: 0 14px; margin-top: 4px;
      border-radius: 8px; border: 1.5px solid #e8ecf4;
      background: #f8f9fc; color: #4f6ef7;
      font-size: 13px; font-weight: 600; cursor: pointer;
      white-space: nowrap;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #f0f4ff; border-color: #4f6ef7; }
      &.active { background: #fee2e2; color: #dc2626; border-color: #fca5a5; mat-icon { color: #dc2626; } }
    }

    /* Inline debt form panel */
    .new-debt-panel {
      background: #f8f9fc;
      border: 1.5px solid #e0e9ff;
      border-radius: 12px;
      padding: 16px;
      margin-top: 4px;
      margin-bottom: 8px;
      display: flex; flex-direction: column; gap: 8px;
      animation: slideDown 0.2s ease;
    }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .new-debt-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 700; color: #4f6ef7;
      margin-bottom: 4px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .debt-info-banner {
      display: flex; align-items: flex-start; gap: 8px;
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
      padding: 10px 12px; font-size: 12px; color: #92400e; line-height: 1.5;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #f59e0b; flex-shrink: 0; margin-top: 1px; }
    }

    /* File upload */
    .file-upload { display: flex; align-items: center; gap: 12px; }
    .upload-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 8px;
      border: 1.5px dashed #d1d5db;
      background: #f9fafb; color: #6b7280;
      font-size: 13px; cursor: pointer;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: #4f6ef7; color: #4f6ef7; background: #f0f4ff; }
    }
    .filename { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #059669; mat-icon { font-size: 14px; width: 14px; height: 14px; } }

    /* Actions */
    mat-dialog-actions { padding: 12px 24px 20px !important; gap: 8px; border-top: 1px solid #f3f4f6; }
    .action-btn {
      height: 40px; padding: 0 20px; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer; border: none;
      display: flex; align-items: center; gap: 6px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.cancel { background: #f3f4f6; color: #6b7280; border: 1.5px solid #e5e7eb; &:hover { background: #e5e7eb; } }
      &.save { background: linear-gradient(135deg, #4f6ef7, #6d3af5); color: #fff; margin-left: auto;
        &:hover:not(:disabled) { opacity: 0.9; }
        &:disabled { opacity: 0.45; cursor: not-allowed; }
      }
    }
    .year-closed-banner { display: flex; align-items: center; gap: 10px; background: #fff3cd; border: 1.5px solid #f59e0b; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-bottom: 4px;
      mat-icon { color: #d97706; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    }
  `]
})
export class TransactionFormDialogComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private debtService    = inject(DebtService);
  private contactService = inject(ContactService);
  private settingsService = inject(SettingsService);
  public dialogRef = inject<MatDialogRef<TransactionFormDialogComponent>>(MatDialogRef);
  public data: { transaction?: Transaction; projects: Project[]; debts: Debt[]; defaultType?: string } = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  newDebtForm?: FormGroup;
  showNewDebtForm = false;
  categories: string[] = [];
  projects: Project[] = [];
  contacts: Contact[] = [];
  pendingDebts: Debt[] = [];

  // Constantes catégories spéciales
  readonly CAT_ALLOWANCE = CAT_ALLOWANCE;
  readonly CAT_KM        = CAT_KM;

  get selectedYear(): number {
    const d = this.form?.get('date')?.value;
    return d ? new Date(d).getFullYear() : new Date().getFullYear();
  }
  get isSelectedYearClosed(): boolean { return this.settingsService.isYearClosed(this.selectedYear); }

  // Défraiement bénévole
  allowancePerson = '';
  allowanceDays   = 1;
  dailyAllowance  = 0;

  // Déplacement kilométrique
  kmVehicle   = 'voiture';
  kmDistance: number | null = null;
  kmPerson    = '';
  kmRateCar   = 0;
  kmRateBike  = 0;
  get kmAmount(): number {
    if (!this.kmDistance) return 0;
    const rate = this.kmVehicle === 'voiture' ? this.kmRateCar : this.kmRateBike;
    return Math.round(this.kmDistance * rate * 100) / 100;
  }

  constructor() {
    this.projects = this.data.projects;
    this.pendingDebts = this.data.debts;
  }

  ngOnInit(): void {
    const t = this.data.transaction;
    this.contacts = this.contactService.getAll();
    this.categories = this.settingsService.getCategories();
    this.dailyAllowance = this.settingsService.getDailyAllowance();
    this.kmRateCar      = this.settingsService.getKmRateCar();
    this.kmRateBike     = this.settingsService.getKmRateBike();
    this.form = this.fb.group({
      title: [t?.title || '', Validators.required],
      description: [t?.description || ''],
      amount: [t?.amount || null, [Validators.required, Validators.min(0.01)]],
      type: [t?.type || this.data.defaultType || 'income', Validators.required],
      date: [t?.date ? new Date(t.date) : new Date(), Validators.required],
      category: [t?.category || '', Validators.required],
      projectId: [t?.projectId || ''],
      contactId: [t?.contactId || t?.clientId || ''],
      debtId: [t?.debtId || ''],
      receiptFile: [t?.receiptFile || ''],
      receiptData: [t?.receiptData || ''],
      notes: [t?.notes || '']
    });

    // Pré-remplir le montant de la dette avec le montant de la transaction
    this.form.get('amount')?.valueChanges.subscribe(val => {
      if (this.showNewDebtForm && val) {
        this.newDebtForm?.patchValue({ amount: val });
      }
    });
  }

  onCategoryChange(cat: string): void {
    if (cat === CAT_ALLOWANCE) {
      this.allowanceDays = 1;
      this.form.patchValue({ type: 'expense', amount: this.dailyAllowance });
      this.updateAllowanceTitle();
    } else if (cat === CAT_KM) {
      this.form.patchValue({ type: 'expense' });
      this.kmDistance = null;
      this.kmPerson = '';
      this.updateKmTransaction();
    }
  }

  updateAllowanceTitle(): void {
    const name = this.allowancePerson.trim();
    const days = this.allowanceDays || 1;
    const label = days > 1 ? `${days} jours` : `1 jour`;
    this.form.patchValue({
      title: name ? `Défraiement ${label} – ${name}` : `Défraiement ${label} – `,
      amount: Math.round(days * this.dailyAllowance * 100) / 100
    });
  }

  setVehicle(v: 'voiture' | 'velo'): void {
    this.kmVehicle = v;
    this.updateKmTransaction();
  }

  updateKmTransaction(): void {
    const amount = this.kmAmount;
    const vehicleLabel = this.kmVehicle === 'voiture' ? 'Voiture' : 'Vélo';
    const km = this.kmDistance ?? 0;
    const name = this.kmPerson.trim();
    const title = name
      ? `Déplacement ${vehicleLabel} – ${km} km – ${name}`
      : `Déplacement ${vehicleLabel} – ${km} km`;
    this.form.patchValue({ amount: amount || null, title });
  }

  toggleNewDebtForm(): void {
    this.showNewDebtForm = !this.showNewDebtForm;
    if (this.showNewDebtForm) {
      this.form.get('debtId')?.setValue('');
      // Pré-remplir montant et description depuis la transaction (après rendu du composant)
      setTimeout(() => {
        this.newDebtForm?.patchValue({
          amount: this.form.get('amount')?.value || null,
          description: this.form.get('title')?.value || ''
        });
      });
    }
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.form.patchValue({ receiptFile: file.name });
    const reader = new FileReader();
    reader.onload = (e) => { this.form.patchValue({ receiptData: e.target?.result as string }); };
    reader.readAsDataURL(file);
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    if (this.isSelectedYearClosed) return;

    const result = this.form.value;

    if (this.showNewDebtForm) {
      if (!this.newDebtForm || this.newDebtForm.invalid) return;
      const nd = this.newDebtForm.value;
      const txAmount = result.amount || 0;
      const newDebt = await this.debtService.add({
        type: nd.type,
        description: nd.description,
        amount: nd.amount,
        paidAmount: txAmount,
        status: txAmount >= nd.amount ? 'paid' : txAmount > 0 ? 'partial' : 'pending',
        contactId: nd.contactId || undefined,
        dueDate: nd.dueDate || undefined,
        notes: nd.notes || undefined
      });
      result.debtId = newDebt.id;
    }

    this.dialogRef.close(result);
  }
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule, MatTooltipModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, ReactiveFormsModule, MatNativeDateModule, MatDatepickerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Transactions</h2>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openForm('income')">
            <mat-icon>add_circle</mat-icon> Entrée
          </button>
          <button mat-raised-button color="warn" (click)="openForm('expense')">
            <mat-icon>remove_circle</mat-icon> Sortie
          </button>
        </div>
      </div>

      <!-- Summary -->
      <div class="summary-row">
        <mat-card class="summary-card income">
          <mat-icon>trending_up</mat-icon>
          <div><span class="s-label">Total Entrées</span><span class="s-val">{{ totalIncome | currency:'EUR':'symbol':'1.2-2':'fr' }}</span></div>
        </mat-card>
        <mat-card class="summary-card expense">
          <mat-icon>trending_down</mat-icon>
          <div><span class="s-label">Total Sorties</span><span class="s-val">{{ totalExpense | currency:'EUR':'symbol':'1.2-2':'fr' }}</span></div>
        </mat-card>
        <mat-card class="summary-card" [class.positive]="balance >= 0" [class.negative]="balance < 0">
          <mat-icon>account_balance</mat-icon>
          <div><span class="s-label">Solde</span><span class="s-val">{{ balance | currency:'EUR':'symbol':'1.2-2':'fr' }}</span></div>
        </mat-card>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Rechercher</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (input)="searchFilter = $any($event.target).value; applyFilters()">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="typeFilter" (selectionChange)="applyFilters()">
              <mat-option value="">Tous</mat-option>
              <mat-option value="income">Entrées</mat-option>
              <mat-option value="expense">Sorties</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Catégorie</mat-label>
            <mat-select [(ngModel)]="categoryFilter" (selectionChange)="applyFilters()">
              <mat-option value="">Toutes</mat-option>
              <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Année</mat-label>
            <mat-select [(ngModel)]="yearFilter" (selectionChange)="applyFilters()">
              <mat-option value="">Toutes</mat-option>
              <mat-option *ngFor="let y of years" [value]="y">{{ y }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <!-- Table -->
      <mat-card class="table-card">
        <div *ngIf="filtered.length === 0" class="empty-state">
          <mat-icon>receipt_long</mat-icon>
          <h3>Aucune transaction</h3>
        </div>
        <div class="table-scroll" *ngIf="filtered.length > 0">
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Projet</th>
              <th>Contact</th>
              <th class="amount-col">Montant</th>
              <th>Dette / Créance</th>
              <th>PJ</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of filtered" class="tx-row" [class.no-receipt]="!t.receiptData">
              <td>
                <span class="type-badge" [class.income]="t.type === 'income'" [class.expense]="t.type === 'expense'">
                  <mat-icon>{{ t.type === 'income' ? 'add_circle' : 'remove_circle' }}</mat-icon>
                  {{ t.type === 'income' ? 'Entrée' : 'Sortie' }}
                </span>
              </td>
              <td>{{ t.date | date:'dd/MM/yyyy' }}</td>
              <td class="title-col">
                <div class="tx-title">{{ t.title }}</div>
                <small *ngIf="t.description" class="tx-desc">{{ t.description }}</small>
              </td>
              <td><span class="cat-chip">{{ t.category }}</span></td>
              <td>{{ getProjectName(t.projectId) }}</td>
              <td>{{ getContactName(t) }}</td>
              <td class="amount-col" [class.income]="t.type === 'income'" [class.expense]="t.type === 'expense'">
                {{ t.type === 'income' ? '+' : '-' }}{{ t.amount | currency:'EUR':'symbol':'1.2-2':'fr' }}
              </td>
              <td>
                <span *ngIf="getDebt(t.debtId) as d" class="debt-badge" [class.debt-type]="d.type === 'debt'" [class.credit-type]="d.type === 'credit'" [matTooltip]="d.description">
                  <mat-icon>{{ d.type === 'debt' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                  {{ d.type === 'debt' ? 'Dette' : 'Créance' }}
                </span>
              </td>
              <td>
                <button *ngIf="t.receiptData" mat-icon-button matTooltip="Voir la pièce justificative" (click)="viewReceipt(t)">
                  <mat-icon>attach_file</mat-icon>
                </button>
                <span *ngIf="!t.receiptData" class="missing-pj" matTooltip="Pièce justificative manquante">
                  <mat-icon>warning_amber</mat-icon>
                </span>
              </td>
              <td class="actions-col">
                <button mat-icon-button color="primary" matTooltip="Modifier" (click)="openForm(undefined, t)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="delete(t)"><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1a237e; margin: 0; }
    .header-actions { display: flex; gap: 12px; }
    .summary-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .summary-card {
      display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px !important; flex: 1;
      mat-icon { font-size: 32px; width: 32px; height: 32px; }
      .s-label { display: block; font-size: 12px; color: #666; text-transform: uppercase; }
      .s-val { display: block; font-size: 1.3rem; font-weight: 700; }
      &.income mat-icon { color: #2e7d32; } &.expense mat-icon { color: #c62828; }
      &.positive mat-icon { color: #2e7d32; } &.negative mat-icon { color: #c62828; }
    }
    .filter-card { margin-bottom: 16px; border-radius: 12px !important; padding: 8px 16px !important; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; mat-form-field { flex: 1; min-width: 150px; } }
    .table-card { border-radius: 12px !important; overflow: hidden; }
    .table-scroll { overflow-x: auto; width: 100%; }
    .empty-state { text-align: center; padding: 64px; color: #999; mat-icon { font-size: 64px; width: 64px; height: 64px; } h3 { margin: 16px 0 8px; } }
    .transactions-table { width: 100%; min-width: 900px; border-collapse: collapse; }
    .transactions-table th { background: #f5f5f5; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e0e0e0; white-space: nowrap; }
    .tx-row { border-bottom: 1px solid #f0f0f0; &:hover { background: #fafafa; } td { padding: 12px 16px; vertical-align: middle; white-space: nowrap; } }
    .tx-row.no-receipt { border-left: 3px solid #fb8c00; td:first-child { padding-left: 13px; } &:hover { background: #fff8f0; } }
    .missing-pj { display: inline-flex; align-items: center; color: #fb8c00; cursor: default; mat-icon { font-size: 20px; width: 20px; height: 20px; } }
    .type-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;
      &.income { background: #e8f5e9; color: #2e7d32; mat-icon { font-size: 16px; width: 16px; height: 16px; } }
      &.expense { background: #ffebee; color: #c62828; mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    }
    .title-col { max-width: 220px; white-space: normal !important; }
    .tx-title { font-weight: 500; }
    .tx-desc { color: #888; display: block; font-size: 12px; }
    .cat-chip { background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; }
    .debt-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; white-space: nowrap; cursor: default;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &.debt-type   { background: #fff3e0; color: #e65100; }
      &.credit-type { background: #e8f5e9; color: #2e7d32; }
    }
    .amount-col { font-weight: 600; white-space: nowrap; &.income { color: #2e7d32; } &.expense { color: #c62828; } }
    .actions-col { white-space: nowrap; }
  `]
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filtered: Transaction[] = [];
  categories: string[] = [];
  contacts: Contact[] = [];
  projects: Project[] = [];
  debts: Debt[] = [];

  searchFilter = '';
  typeFilter = '';
  categoryFilter = '';
  yearFilter = '';
  years: number[] = [];

  get totalIncome(): number { return this.filtered.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0); }
  get totalExpense(): number { return this.filtered.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0); }
  get balance(): number { return this.totalIncome - this.totalExpense; }

  constructor(
    private txService: TransactionService,
    private contactService: ContactService,
    private projectService: ProjectService,
    private debtService: DebtService,
    private settingsService: SettingsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.load();
    // Ouvrir automatiquement le formulaire si query param ?new=income|expense
    this.route.queryParams.subscribe(params => {
      if (params['new']) {
        const type = params['new'] === 'expense' ? 'expense' : 'income';
        setTimeout(() => this.openForm(type), 150);
      }
    });
  }

  load(): void {
    this.categories = this.settingsService.getCategories();
    this.contacts = this.contactService.getAll();
    this.projects = this.projectService.getAll();
    this.debts = this.debtService.getAll();
    this.transactions = this.txService.getAll().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const ySet = new Set(this.transactions.map(t => new Date(t.date).getFullYear()));
    this.years = Array.from(ySet).sort((a, b) => b - a);
    this.applyFilters();
  }

  applyFilters(): void {
    this.filtered = this.transactions.filter(t => {
      const matchSearch = !this.searchFilter || t.title.toLowerCase().includes(this.searchFilter.toLowerCase()) || t.description?.toLowerCase().includes(this.searchFilter.toLowerCase()) || t.category.toLowerCase().includes(this.searchFilter.toLowerCase());
      const matchType = !this.typeFilter || t.type === this.typeFilter;
      const matchCat = !this.categoryFilter || t.category === this.categoryFilter;
      const matchYear = !this.yearFilter || new Date(t.date).getFullYear() === +this.yearFilter;
      return matchSearch && matchType && matchCat && matchYear;
    });
  }

  openForm(type?: string, transaction?: Transaction): void {
    const ref = this.dialog.open(TransactionFormDialogComponent, {
      width: '720px',
      panelClass: 'no-pad-dialog',
      data: { transaction, projects: this.projects, debts: this.debts, defaultType: type || 'income' }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        if (!result.type && type) result.type = type;
        if (transaction) {
          this.txService.update(transaction.id, result);
          // si lié à une dette existante, mettre à jour le montant payé
          if (result.debtId) {
            this.debtService.addPayment(result.debtId, result.amount);
          }
          this.snackBar.open('Transaction mise à jour ✓', 'Fermer', { duration: 3000 });
        } else {
          this.txService.add(result);
          // Pour une dette liée existante (pas nouvellement créée), enregistrer le paiement
          // Les nouvelles dettes ont déjà le paidAmount défini lors de la création dans le dialog
          if (result.debtId && !result._newDebt) {
            this.debtService.addPayment(result.debtId, result.amount);
          }
          this.snackBar.open('Transaction enregistrée ✓', 'Fermer', { duration: 3000 });
        }
        this.load();
      }
    });
  }

  delete(t: Transaction): void {
    if (confirm(`Supprimer la transaction "${t.title}" ?`)) {
      this.txService.delete(t.id);
      this.snackBar.open('Transaction supprimée', 'Fermer', { duration: 3000 });
      this.load();
    }
  }

  viewReceipt(t: Transaction): void {
    if (t.receiptData) {
      const win = window.open();
      win?.document.write(`<img src="${t.receiptData}" style="max-width:100%"><br><a href="${t.receiptData}" download="${t.receiptFile}">Télécharger</a>`);
    }
  }

  getProjectName(id?: string): string {
    if (!id) return '';
    return this.projects.find(p => p.id === id)?.name || '';
  }

  getContactName(t: Transaction): string {
    if (t.contactId) return this.contacts.find(c => c.id === t.contactId)?.name || '';
    return '';
  }

  getDebt(id?: string): Debt | undefined {
    if (!id) return undefined;
    return this.debts.find(d => d.id === id);
  }
}
