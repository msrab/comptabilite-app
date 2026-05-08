import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ContactService } from '../../core/services/contact.service';
import { DebtService } from '../../core/services/debt.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Contact, ContactRole, Debt, Transaction } from '../../core/models';

/* ── Dialog de création/édition ─────────────────────────────────────────── */
@Component({
  selector: 'app-contact-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <div class="dlg-wrap">
      <div class="dlg-header">
        <div class="dlg-icon"><mat-icon>person</mat-icon></div>
        <div>
          <h2>{{ data.contact ? 'Modifier' : 'Nouveau' }} contact</h2>
          <p>Remplissez les informations du contact</p>
        </div>
        <button class="close-btn" mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nom complet *</mat-label>
            <input matInput formControlName="name" placeholder="Prénom Nom ou Organisation">
            <mat-error>Champ requis</mat-error>
          </mat-form-field>

          <div class="roles-section">
            <label class="roles-label">Rôle(s) *</label>
            <div class="roles-grid">
              <div class="role-chip" [class.active]="hasRole('client')" (click)="toggleRole('client')">
                <mat-icon>business_center</mat-icon> Client
              </div>
              <div class="role-chip" [class.active]="hasRole('member')" (click)="toggleRole('member')">
                <mat-icon>group</mat-icon> Membre
              </div>
            </div>
            <div class="role-hint" *ngIf="form.get('roles')?.value?.length === 0">
              ⚠ Sélectionnez au moins un rôle
            </div>
          </div>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email">
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Téléphone</mat-label>
              <input matInput formControlName="phone">
              <mat-icon matPrefix>phone</mat-icon>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Organisation / Entreprise</mat-label>
            <input matInput formControlName="organization" placeholder="ASBL, Entreprise...">
            <mat-icon matPrefix>domain</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Adresse</mat-label>
            <input matInput formControlName="address">
          </mat-form-field>

          <!-- Champs spécifiques membre -->
          <div *ngIf="hasRole('member')" class="member-section">
            <div class="section-sep">
              <mat-icon>group</mat-icon> Informations membre
            </div>
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Rôle dans l'ASBL</mat-label>
                <input matInput formControlName="memberRole" placeholder="Président, Trésorier…">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Date d'adhésion</mat-label>
                <input matInput [matDatepicker]="dpJoin" formControlName="joinDate">
                <mat-datepicker-toggle matSuffix [for]="dpJoin"></mat-datepicker-toggle>
                <mat-datepicker #dpJoin></mat-datepicker>
              </mat-form-field>
            </div>
            <div class="active-row">
              <label class="active-label">Membre actif</label>
              <label class="toggle-switch">
                <input type="checkbox" formControlName="memberActive">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notes</mat-label>
            <textarea matInput formControlName="notes" rows="2"></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button class="action-btn cancel" mat-dialog-close>Annuler</button>
        <button class="action-btn save" [disabled]="form.invalid || form.get('roles')?.value?.length === 0" (click)="save()">
          <mat-icon>save</mat-icon> Enregistrer
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dlg-wrap { min-width: 560px; max-width: 640px; }
    .dlg-header { display: flex; align-items: center; gap: 12px; padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
    .dlg-icon { width: 40px; height: 40px; border-radius: 10px; background: #f0f4ff; display: flex; align-items: center; justify-content: center; mat-icon { color: #4f6ef7; } }
    .dlg-header h2 { font-size: 15px; font-weight: 700; color: #0d1117; margin: 0; }
    .dlg-header p  { font-size: 12px; color: #9ca3af; margin: 2px 0 0; }
    .close-btn { margin-left: auto; background: none; border: none; cursor: pointer; color: #9ca3af; padding: 4px; border-radius: 6px; display: flex; align-items: center; &:hover { background: #f3f4f6; } mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    mat-dialog-content { padding: 0 20px !important; max-height: 60vh; overflow-y: auto; }
    .form { display: flex; flex-direction: column; gap: 8px; padding: 16px 0 8px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 12px; mat-form-field { flex: 1; } }

    .roles-section { display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; }
    .roles-label { font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
    .roles-grid { display: flex; gap: 10px; }
    .role-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px;
      border: 1.5px solid #e5e7eb; background: #f9fafb;
      font-size: 13px; font-weight: 500; color: #6b7280;
      cursor: pointer; transition: all 0.15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: #4f6ef7; color: #4f6ef7; }
      &.active { border-color: #4f6ef7; background: #f0f4ff; color: #4f6ef7; font-weight: 700; }
    }
    .role-hint { font-size: 11px; color: #f59e0b; }

    .section-sep { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #4f6ef7; text-transform: uppercase; letter-spacing: 0.05em; margin: 4px 0; mat-icon { font-size: 14px; width: 14px; height: 14px; } }
    .member-section { background: #f8f9fc; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; border: 1px dashed #c5d0f5; }
    .active-row { display: flex; align-items: center; justify-content: space-between; }
    .active-label { font-size: 13px; font-weight: 500; color: #374151; }
    .toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px;
      input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #d1d5db; border-radius: 20px; transition: 0.2s;
        &::before { position: absolute; content: ''; height: 14px; width: 14px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
      }
      input:checked + .slider { background: #4f6ef7; }
      input:checked + .slider::before { transform: translateX(16px); }
    }

    mat-dialog-actions { padding: 12px 20px 18px !important; gap: 8px; border-top: 1px solid #f3f4f6; }
    .action-btn { height: 38px; padding: 0 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; mat-icon { font-size: 15px; width: 15px; height: 15px; } }
    .cancel { background: #f3f4f6; color: #6b7280; border: 1.5px solid #e5e7eb; &:hover { background: #e5e7eb; } }
    .save { background: linear-gradient(135deg, #4f6ef7, #6d3af5); color: #fff; margin-left: auto; &:hover:not(:disabled) { opacity: 0.9; } &:disabled { opacity: 0.45; cursor: not-allowed; } }
  `]
})
export class ContactFormDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ContactFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contact?: Contact }
  ) {}

  ngOnInit(): void {
    const c = this.data.contact;
    this.form = this.fb.group({
      name: [c?.name || '', Validators.required],
      roles: [c?.roles || [], []],
      email: [c?.email || ''],
      phone: [c?.phone || ''],
      organization: [c?.organization || ''],
      address: [c?.address || ''],
      memberRole: [c?.memberRole || ''],
      joinDate: [c?.joinDate ? new Date(c.joinDate) : null],
      memberActive: [c?.memberActive !== undefined ? c.memberActive : true],
      notes: [c?.notes || '']
    });
  }

  hasRole(role: ContactRole): boolean {
    return (this.form.get('roles')?.value as ContactRole[]).includes(role);
  }

  toggleRole(role: ContactRole): void {
    const roles: ContactRole[] = [...(this.form.get('roles')?.value || [])];
    const idx = roles.indexOf(role);
    if (idx >= 0) roles.splice(idx, 1); else roles.push(role);
    this.form.patchValue({ roles });
  }

  save(): void {
    if (this.form.invalid || !this.form.get('roles')?.value?.length) return;
    this.dialogRef.close(this.form.value);
  }
}

/* ── Composant principal ────────────────────────────────────────────────── */
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSnackBarModule,
    MatTooltipModule, MatDialogModule],
  template: `
    <div class="contacts-page page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Contacts</h1>
          <p class="page-subtitle">Clients, membres et personnes associées</p>
        </div>
        <button class="btn-primary" (click)="openForm()">
          <mat-icon>person_add</mat-icon> Nouveau contact
        </button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input [(ngModel)]="search" (ngModelChange)="applyFilter()" placeholder="Rechercher un contact…">
        </div>
        <div class="role-filters">
          <button class="rf-btn" [class.active]="roleFilter === ''" (click)="roleFilter = ''; applyFilter()">Tous ({{ contacts.length }})</button>
          <button class="rf-btn" [class.active]="roleFilter === 'client'" (click)="roleFilter = 'client'; applyFilter()">
            <mat-icon>business_center</mat-icon> Clients ({{ clientCount }})
          </button>
          <button class="rf-btn" [class.active]="roleFilter === 'member'" (click)="roleFilter = 'member'; applyFilter()">
            <mat-icon>group</mat-icon> Membres ({{ memberCount }})
          </button>
        </div>
      </div>

      <!-- Split layout -->
      <div class="split-layout" [class.has-detail]="!!selected">

        <!-- List -->
        <div class="contacts-list">
          <div *ngIf="filtered.length === 0" class="empty-state">
            <mat-icon>person_outline</mat-icon>
            <h3>Aucun contact</h3>
            <p>Créez votre premier contact</p>
            <button class="btn-primary" (click)="openForm()"><mat-icon>add</mat-icon> Créer</button>
          </div>
          <div *ngFor="let c of filtered" class="contact-card" [class.active]="selected?.id === c.id" (click)="select(c)">
            <div class="contact-avatar">{{ initials(c.name) }}</div>
            <div class="contact-info">
              <span class="contact-name">{{ c.name }}</span>
              <span class="contact-org" *ngIf="c.organization">{{ c.organization }}</span>
              <div class="contact-chips">
                <span class="chip client" *ngIf="c.roles.includes('client')">Client</span>
                <span class="chip member" *ngIf="c.roles.includes('member')">
                  Membre{{ c.memberActive === false ? ' (inactif)' : '' }}
                </span>
              </div>
            </div>
            <div class="contact-meta">
              <span class="meta-debt" *ngIf="getTotalDebt(c.id) > 0" matTooltip="Dettes en cours">
                <mat-icon>warning_amber</mat-icon> {{ getTotalDebt(c.id) | currency:'EUR':'symbol':'1.0-0':'fr' }}
              </span>
              <span class="meta-credit" *ngIf="getTotalCredit(c.id) > 0" matTooltip="Créances à recevoir">
                <mat-icon>payments</mat-icon> {{ getTotalCredit(c.id) | currency:'EUR':'symbol':'1.0-0':'fr' }}
              </span>
            </div>
            <div class="card-actions">
              <button class="icon-btn" matTooltip="Modifier" (click)="openForm(c); $event.stopPropagation()"><mat-icon>edit</mat-icon></button>
              <button class="icon-btn danger" matTooltip="Supprimer" (click)="delete(c); $event.stopPropagation()"><mat-icon>delete</mat-icon></button>
            </div>
          </div>
        </div>

        <!-- Detail panel -->
        <div class="detail-panel" *ngIf="selected">
          <div class="detail-header">
            <div class="detail-avatar">{{ initials(selected.name) }}</div>
            <div class="detail-meta">
              <h2>{{ selected.name }}</h2>
              <div class="detail-chips">
                <span class="chip client" *ngIf="selected.roles.includes('client')">Client</span>
                <span class="chip member" *ngIf="selected.roles.includes('member')">
                  {{ selected.memberActive === false ? 'Membre inactif' : 'Membre actif' }}
                </span>
              </div>
            </div>
            <button class="icon-btn" matTooltip="Fermer" (click)="selected = null"><mat-icon>close</mat-icon></button>
          </div>

          <div class="detail-body">
            <!-- Coordonnées -->
            <div class="detail-section">
              <div class="section-title">Coordonnées</div>
              <div class="info-grid">
                <div class="info-row" *ngIf="selected.email"><mat-icon>email</mat-icon> <a [href]="'mailto:' + selected.email">{{ selected.email }}</a></div>
                <div class="info-row" *ngIf="selected.phone"><mat-icon>phone</mat-icon> {{ selected.phone }}</div>
                <div class="info-row" *ngIf="selected.organization"><mat-icon>domain</mat-icon> {{ selected.organization }}</div>
                <div class="info-row" *ngIf="selected.address"><mat-icon>place</mat-icon> {{ selected.address }}</div>
                <div class="info-row" *ngIf="selected.memberRole"><mat-icon>badge</mat-icon> {{ selected.memberRole }}</div>
                <div class="info-row" *ngIf="selected.joinDate"><mat-icon>calendar_today</mat-icon> Membre depuis {{ selected.joinDate | date:'MMMM yyyy' }}</div>
              </div>
            </div>

            <!-- Dettes & Créances -->
            <div class="detail-section">
              <div class="section-title">
                Dettes & Créances
                <span class="count-badge">{{ contactDebts.length }}</span>
              </div>
              <div *ngIf="contactDebts.length === 0" class="empty-mini">Aucune dette ou créance liée</div>
              <div *ngFor="let d of contactDebts" class="debt-row">
                <div class="debt-icon" [class.debt]="d.type==='debt'" [class.credit]="d.type==='credit'">
                  <mat-icon>{{ d.type === 'debt' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </div>
                <div class="debt-info">
                  <span class="debt-desc">{{ d.description }}</span>
                  <span class="debt-sub">
                    {{ d.type === 'debt' ? 'Dette' : 'Créance' }} •
                    {{ debtStatusLabel(d.status) }}
                    <span *ngIf="d.dueDate"> • Échéance {{ d.dueDate | date:'dd/MM/yyyy' }}</span>
                  </span>
                </div>
                <div class="debt-amounts">
                  <span class="debt-total">{{ d.amount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                  <span class="debt-remaining" *ngIf="d.paidAmount > 0">
                    Reste: {{ (d.amount - d.paidAmount) | currency:'EUR':'symbol':'1.2-2':'fr' }}
                  </span>
                </div>
                <div class="debt-progress-bar">
                  <div class="progress-fill" [style.width.%]="(d.paidAmount / d.amount) * 100"></div>
                </div>
              </div>
            </div>

            <!-- Dons -->
            <div class="detail-section">
              <div class="section-title">
                Dons reçus
                <span class="count-badge green">{{ contactDons.length }}</span>
                <span class="total-badge" *ngIf="contactDons.length > 0">
                  Total: {{ totalDons | currency:'EUR':'symbol':'1.2-2':'fr' }}
                </span>
              </div>
              <div *ngIf="contactDons.length === 0" class="empty-mini">Aucun don enregistré</div>
              <div *ngFor="let t of contactDons" class="tx-row">
                <div class="tx-dot don"><mat-icon>volunteer_activism</mat-icon></div>
                <div class="tx-info">
                  <span class="tx-title">{{ t.title }}</span>
                  <span class="tx-sub">{{ t.date | date:'dd/MM/yyyy' }}<span *ngIf="t.description"> · {{ t.description }}</span></span>
                </div>
                <span class="tx-amount don">+{{ t.amount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              </div>
            </div>

            <!-- Autres transactions -->
            <div class="detail-section">
              <div class="section-title">
                Autres transactions
                <span class="count-badge">{{ contactOtherTx.length }}</span>
              </div>
              <div *ngIf="contactOtherTx.length === 0" class="empty-mini">Aucune autre transaction</div>
              <div *ngFor="let t of contactOtherTx" class="tx-row">
                <div class="tx-dot" [class.income]="t.type==='income'" [class.expense]="t.type==='expense'">
                  <mat-icon>{{ t.type === 'income' ? 'add' : 'remove' }}</mat-icon>
                </div>
                <div class="tx-info">
                  <span class="tx-title">{{ t.title }}</span>
                  <span class="tx-sub">{{ t.date | date:'dd/MM/yyyy' }} · {{ t.category }}</span>
                </div>
                <span class="tx-amount" [class.income]="t.type==='income'" [class.expense]="t.type==='expense'">
                  {{ t.type === 'income' ? '+' : '−' }}{{ t.amount | currency:'EUR':'symbol':'1.2-2':'fr' }}
                </span>
              </div>
            </div>

            <div *ngIf="selected.notes" class="notes-box">
              <mat-icon>notes</mat-icon> {{ selected.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contacts-page { height: 100%; display: flex; flex-direction: column; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
    .page-title { font-size: 1.75rem; font-weight: 800; color: #0d1117; letter-spacing: -0.5px; margin: 0; }
    .page-subtitle { font-size: 13px; color: #9ca3af; margin: 4px 0 0; }

    .btn-primary {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 18px; border-radius: 8px;
      background: linear-gradient(135deg, #4f6ef7, #6d3af5);
      color: #fff; border: none; cursor: pointer;
      font-size: 13px; font-weight: 600;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { opacity: 0.9; }
    }

    /* Filter bar */
    .filter-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: #fff; border: 1.5px solid #e8ecf4; border-radius: 10px;
      padding: 8px 14px; flex: 1; min-width: 200px;
      mat-icon { color: #9ca3af; font-size: 18px; width: 18px; height: 18px; }
      input { border: none; outline: none; font-size: 13px; color: #0d1117; width: 100%; font-family: 'Inter', sans-serif; background: none; &::placeholder { color: #d1d5db; } }
    }
    .role-filters { display: flex; gap: 8px; }
    .rf-btn {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 13px; border-radius: 8px;
      border: 1.5px solid #e8ecf4; background: #fff;
      font-size: 12px; font-weight: 600; color: #6b7280; cursor: pointer;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { border-color: #4f6ef7; color: #4f6ef7; }
      &.active { border-color: #4f6ef7; background: #f0f4ff; color: #4f6ef7; }
    }

    /* Split layout */
    .split-layout {
      display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;
      .contacts-list { flex: 1; overflow-y: auto; }
      &.has-detail .contacts-list { flex: 0 0 400px; }
    }

    /* Contact card */
    .contact-card {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border: 1.5px solid #e8ecf4;
      border-radius: 12px; padding: 14px 16px;
      margin-bottom: 10px; cursor: pointer;
      transition: all 0.15s;
      &:hover { border-color: #c5d0f5; box-shadow: 0 2px 8px rgba(79,110,247,0.07); }
      &.active { border-color: #4f6ef7; background: #f8faff; box-shadow: 0 2px 12px rgba(79,110,247,0.12); }
    }
    .contact-avatar {
      width: 40px; height: 40px; min-width: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #4f6ef7, #7c3aed);
      color: #fff; font-size: 14px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .contact-info { flex: 1; min-width: 0; }
    .contact-name { display: block; font-size: 14px; font-weight: 600; color: #0d1117; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .contact-org  { display: block; font-size: 11px; color: #9ca3af; margin: 1px 0; }
    .contact-chips { display: flex; gap: 5px; margin-top: 4px; }
    .chip { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px;
      &.client { background: #dbeafe; color: #1d4ed8; }
      &.member { background: #d1fae5; color: #065f46; }
    }
    .contact-meta { display: flex; flex-direction: column; gap: 3px; align-items: flex-end; }
    .meta-debt, .meta-credit { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }
    .meta-debt   { color: #d97706; }
    .meta-credit { color: #0891b2; }
    .card-actions { display: flex; gap: 4px; margin-left: 8px; }
    .icon-btn { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px; color: #9ca3af; display: flex; align-items: center; mat-icon { font-size: 16px; width: 16px; height: 16px; } &:hover { background: #f3f4f6; color: #374151; } &.danger:hover { background: #fee2e2; color: #dc2626; } }

    /* Detail panel */
    .detail-panel {
      flex: 1; background: #fff; border: 1.5px solid #e8ecf4;
      border-radius: 16px; display: flex; flex-direction: column; overflow: hidden;
    }
    .detail-header {
      display: flex; align-items: center; gap: 14px;
      padding: 18px 20px; border-bottom: 1px solid #f3f4f6;
    }
    .detail-avatar {
      width: 52px; height: 52px; min-width: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #4f6ef7, #7c3aed);
      color: #fff; font-size: 18px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .detail-meta h2 { font-size: 18px; font-weight: 700; color: #0d1117; margin: 0; }
    .detail-chips { display: flex; gap: 6px; margin-top: 5px; }
    .detail-body { flex: 1; overflow-y: auto; padding: 16px 20px; }

    .detail-section { margin-bottom: 20px; }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #6b7280;
      padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; margin-bottom: 12px;
    }
    .count-badge { background: #f3f4f6; color: #6b7280; border-radius: 999px; padding: 1px 8px; font-size: 11px; &.green { background: #d1fae5; color: #065f46; } }
    .total-badge { background: #f0f4ff; color: #4f6ef7; border-radius: 999px; padding: 1px 8px; font-size: 11px; margin-left: 4px; }

    .info-grid { display: flex; flex-direction: column; gap: 8px; }
    .info-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; mat-icon { font-size: 15px; width: 15px; height: 15px; color: #9ca3af; } a { color: #4f6ef7; text-decoration: none; &:hover { text-decoration: underline; } } }

    /* Debt rows */
    .debt-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f8f9fc; &:last-child { border-bottom: none; } flex-wrap: wrap; }
    .debt-icon { width: 30px; height: 30px; min-width: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; mat-icon { font-size: 14px; width: 14px; height: 14px; } &.debt { background: #fee2e2; mat-icon { color: #dc2626; } } &.credit { background: #d1fae5; mat-icon { color: #059669; } } }
    .debt-info { flex: 1; min-width: 0; }
    .debt-desc { display: block; font-size: 13px; font-weight: 600; color: #0d1117; }
    .debt-sub  { display: block; font-size: 11px; color: #9ca3af; }
    .debt-amounts { text-align: right; }
    .debt-total { display: block; font-size: 13px; font-weight: 700; color: #0d1117; }
    .debt-remaining { display: block; font-size: 11px; color: #d97706; }
    .debt-progress-bar { width: 100%; height: 3px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #4f6ef7, #10b981); border-radius: 3px; transition: width 0.3s; }

    /* Transaction rows */
    .tx-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f8f9fc; &:last-child { border-bottom: none; } }
    .tx-dot { width: 28px; height: 28px; min-width: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; mat-icon { font-size: 14px; width: 14px; height: 14px; } &.income { background: #d1fae5; mat-icon { color: #059669; } } &.expense { background: #fee2e2; mat-icon { color: #dc2626; } } &.don { background: #ede9fe; mat-icon { color: #7c3aed; } } }
    .tx-info { flex: 1; min-width: 0; }
    .tx-title { display: block; font-size: 12px; font-weight: 600; color: #0d1117; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tx-sub   { display: block; font-size: 11px; color: #9ca3af; }
    .tx-amount { font-size: 12px; font-weight: 700; white-space: nowrap; &.income { color: #059669; } &.expense { color: #dc2626; } &.don { color: #7c3aed; } }

    .empty-mini { font-size: 12px; color: #9ca3af; padding: 8px 0; }
    .notes-box { display: flex; gap: 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #78350f; mat-icon { font-size: 15px; width: 15px; height: 15px; color: #f59e0b; } }
    .empty-state { text-align: center; padding: 60px 32px; color: #9ca3af; mat-icon { font-size: 52px; width: 52px; height: 52px; display: block; margin: 0 auto 12px; opacity: 0.3; } h3 { font-size: 15px; font-weight: 600; color: #6b7280; margin: 0 0 6px; } p { font-size: 13px; margin-bottom: 20px; } }
  `]
})
export class ContactsComponent implements OnInit {
  contacts: Contact[] = [];
  filtered: Contact[] = [];
  selected: Contact | null = null;

  search = '';
  roleFilter = '';

  contactDebts: Debt[] = [];
  contactDons: Transaction[] = [];
  contactOtherTx: Transaction[] = [];

  get clientCount(): number { return this.contacts.filter(c => c.roles.includes('client')).length; }
  get memberCount(): number { return this.contacts.filter(c => c.roles.includes('member')).length; }
  get totalDons(): number { return this.contactDons.reduce((a, t) => a + t.amount, 0); }

  constructor(
    private contactService: ContactService,
    private debtService: DebtService,
    private txService: TransactionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.contacts = this.contactService.getAll().sort((a, b) => a.name.localeCompare(b.name));
    this.applyFilter();
    if (this.selected) {
      this.selected = this.contactService.getById(this.selected.id) || null;
      if (this.selected) this.loadDetail(this.selected);
    }
  }

  applyFilter(): void {
    this.filtered = this.contacts.filter(c => {
      const matchSearch = !this.search || c.name.toLowerCase().includes(this.search.toLowerCase())
        || c.email?.toLowerCase().includes(this.search.toLowerCase())
        || c.organization?.toLowerCase().includes(this.search.toLowerCase());
      const matchRole = !this.roleFilter || c.roles.includes(this.roleFilter as ContactRole);
      return matchSearch && matchRole;
    });
  }

  select(contact: Contact): void {
    this.selected = contact;
    this.loadDetail(contact);
  }

  loadDetail(contact: Contact): void {
    const allDebts = this.debtService.getAll();
    this.contactDebts = allDebts.filter(d => d.contactId === contact.id || d.clientId === contact.id || d.personId === contact.id);

    const allTx = this.txService.getAll()
      .filter(t => t.contactId === contact.id || t.clientId === contact.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.contactDons = allTx.filter(t => t.isDonation || t.category === 'Don');
    this.contactOtherTx = allTx.filter(t => !t.isDonation && t.category !== 'Don');
  }

  getTotalDebt(contactId: string): number {
    return this.debtService.getAll()
      .filter(d => (d.contactId === contactId || d.clientId === contactId || d.personId === contactId) && d.type === 'debt' && d.status !== 'paid' && d.status !== 'cancelled')
      .reduce((a, d) => a + (d.amount - d.paidAmount), 0);
  }

  getTotalCredit(contactId: string): number {
    return this.debtService.getAll()
      .filter(d => (d.contactId === contactId || d.clientId === contactId || d.personId === contactId) && d.type === 'credit' && d.status !== 'paid' && d.status !== 'cancelled')
      .reduce((a, d) => a + (d.amount - d.paidAmount), 0);
  }

  debtStatusLabel(status: string): string {
    const map: Record<string, string> = { pending: 'En attente', partial: 'Partiel', paid: 'Payé', cancelled: 'Annulé' };
    return map[status] || status;
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  openForm(contact?: Contact): void {
    const ref = this.dialog.open(ContactFormDialogComponent, {
      width: '660px',
      data: { contact }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (contact) {
        this.contactService.update(contact.id, result);
        this.snackBar.open('Contact mis à jour ✓', 'Fermer', { duration: 3000 });
      } else {
        this.contactService.add(result);
        this.snackBar.open('Contact créé ✓', 'Fermer', { duration: 3000 });
      }
      this.load();
    });
  }

  delete(contact: Contact): void {
    if (confirm(`Supprimer le contact "${contact.name}" ?`)) {
      this.contactService.delete(contact.id);
      if (this.selected?.id === contact.id) this.selected = null;
      this.snackBar.open('Contact supprimé', 'Fermer', { duration: 3000 });
      this.load();
    }
  }
}
