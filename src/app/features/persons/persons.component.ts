import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PersonService } from '../../core/services/person.service';
import { DebtService } from '../../core/services/debt.service';
import { Person } from '../../core/models';

@Component({
  selector: 'app-person-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.person ? 'Modifier' : 'Ajouter' }} un créancier / débiteur</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom complet *</mat-label>
          <input matInput formControlName="name">
          <mat-error>Champ requis</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type *</mat-label>
          <mat-select formControlName="type">
            <mat-option value="creditor">Créancier (nous lui devons de l'argent)</mat-option>
            <mat-option value="debtor">Débiteur (il nous doit de l'argent)</mat-option>
            <mat-option value="both">Les deux</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Téléphone</mat-label>
          <input matInput formControlName="phone">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Adresse</mat-label>
          <input matInput formControlName="address">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        <mat-icon>save</mat-icon> Enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; min-width: 460px; } .full-width { width: 100%; }`]
})
export class PersonFormDialogComponent implements OnInit {
  form!: FormGroup;
  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<PersonFormDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { person?: Person }) {}
  ngOnInit(): void {
    const p = this.data.person;
    this.form = this.fb.group({
      name: [p?.name || '', Validators.required],
      type: [p?.type || 'debtor', Validators.required],
      email: [p?.email || ''],
      phone: [p?.phone || ''],
      address: [p?.address || ''],
      notes: [p?.notes || '']
    });
  }
  save(): void { if (this.form.valid) this.dialogRef.close(this.form.value); }
}

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule, MatTooltipModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Créanciers & Débiteurs</h2>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Ajouter
        </button>
      </div>

      <div *ngIf="persons.length === 0" class="empty-state">
        <mat-icon>people_outline</mat-icon>
        <h3>Aucun créancier/débiteur</h3>
        <button mat-raised-button color="primary" (click)="openForm()">Ajouter</button>
      </div>

      <div class="persons-grid" *ngIf="persons.length > 0">
        <mat-card *ngFor="let p of persons" class="person-card">
          <mat-card-header>
            <div mat-card-avatar class="person-avatar" [ngClass]="p.type">
              <mat-icon>{{ p.type === 'creditor' ? 'arrow_upward' : p.type === 'debtor' ? 'arrow_downward' : 'swap_vert' }}</mat-icon>
            </div>
            <mat-card-title>{{ p.name }}</mat-card-title>
            <mat-card-subtitle>
              <span class="type-badge" [ngClass]="p.type">{{ typeLabel(p.type) }}</span>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="info-line" *ngIf="p.email"><mat-icon>email</mat-icon> {{ p.email }}</div>
            <div class="info-line" *ngIf="p.phone"><mat-icon>phone</mat-icon> {{ p.phone }}</div>
            <div class="debt-summary">
              <div class="debt-row">
                <span>Dettes envers lui:</span>
                <span class="debt-amount">{{ getPendingDebtAmount(p.id) | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              </div>
              <div class="debt-row">
                <span>Il nous doit:</span>
                <span class="credit-amount">{{ getPendingCreditAmount(p.id) | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-icon-button color="primary" matTooltip="Modifier" (click)="openForm(p)"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="delete(p)"><mat-icon>delete</mat-icon></button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1a237e; margin: 0; }
    .empty-state { text-align: center; padding: 64px; color: #999; mat-icon { font-size: 64px; width: 64px; height: 64px; } h3 { margin: 16px 0 8px; } }
    .persons-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .person-card { border-radius: 12px !important; }
    .person-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      &.creditor { background: #c62828; mat-icon { color: white; } }
      &.debtor { background: #2e7d32; mat-icon { color: white; } }
      &.both { background: #6a1b9a; mat-icon { color: white; } }
    }
    .type-badge {
      padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;
      &.creditor { background: #ffebee; color: #c62828; }
      &.debtor { background: #e8f5e9; color: #2e7d32; }
      &.both { background: #f3e5f5; color: #6a1b9a; }
    }
    .info-line { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; margin-bottom: 4px; mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    .debt-summary { background: #f5f5f5; border-radius: 8px; padding: 10px; margin-top: 8px; }
    .debt-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
    .debt-amount { color: #c62828; font-weight: 600; }
    .credit-amount { color: #2e7d32; font-weight: 600; }
  `]
})
export class PersonsComponent implements OnInit {
  persons: Person[] = [];

  constructor(private personService: PersonService, private debtService: DebtService, private dialog: MatDialog, private snackBar: MatSnackBar) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.persons = this.personService.getAll(); }

  openForm(person?: Person): void {
    const ref = this.dialog.open(PersonFormDialogComponent, { width: '520px', data: { person } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        if (person) { this.personService.update(person.id, result); this.snackBar.open('Mis à jour', 'Fermer', { duration: 3000 }); }
        else { this.personService.add(result); this.snackBar.open('Ajouté', 'Fermer', { duration: 3000 }); }
        this.load();
      }
    });
  }

  delete(person: Person): void {
    if (confirm(`Supprimer "${person.name}" ?`)) {
      this.personService.delete(person.id);
      this.snackBar.open('Supprimé', 'Fermer', { duration: 3000 });
      this.load();
    }
  }

  getPendingDebtAmount(personId: string): number {
    return this.debtService.getByPerson(personId).filter(d => d.type === 'debt' && d.status !== 'paid' && d.status !== 'cancelled').reduce((a, d) => a + (d.amount - d.paidAmount), 0);
  }
  getPendingCreditAmount(personId: string): number {
    return this.debtService.getByPerson(personId).filter(d => d.type === 'credit' && d.status !== 'paid' && d.status !== 'cancelled').reduce((a, d) => a + (d.amount - d.paidAmount), 0);
  }

  typeLabel(type: string): string {
    const m: Record<string, string> = { creditor: 'Créancier', debtor: 'Débiteur', both: 'Créancier & Débiteur' };
    return m[type] || type;
  }
}
