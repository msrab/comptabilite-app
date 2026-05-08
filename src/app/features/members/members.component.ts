import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MemberService } from '../../core/services/member.service';
import { Member } from '../../core/models';

@Component({
  selector: 'app-member-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ data.member ? 'Modifier' : 'Ajouter' }} un membre</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Prénom *</mat-label>
            <input matInput formControlName="firstName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Nom *</mat-label>
            <input matInput formControlName="lastName">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rôle / Fonction *</mat-label>
          <input matInput formControlName="role">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Téléphone</mat-label>
          <input matInput formControlName="phone">
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Date d'adhésion</mat-label>
            <input matInput [matDatepicker]="dp1" formControlName="joinDate">
            <mat-datepicker-toggle matSuffix [for]="dp1"></mat-datepicker-toggle>
            <mat-datepicker #dp1></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Date de fin</mat-label>
            <input matInput [matDatepicker]="dp2" formControlName="endDate">
            <mat-datepicker-toggle matSuffix [for]="dp2"></mat-datepicker-toggle>
            <mat-datepicker #dp2></mat-datepicker>
          </mat-form-field>
        </div>
        <mat-checkbox formControlName="active">Membre actif</mat-checkbox>
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
  styles: [`.form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; min-width: 480px; } .full-width { width: 100%; } .row { display: flex; gap: 12px; mat-form-field { flex: 1; } }`]
})
export class MemberFormDialogComponent implements OnInit {
  form!: FormGroup;
  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<MemberFormDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { member?: Member }) {}
  ngOnInit(): void {
    const m = this.data.member;
    this.form = this.fb.group({
      firstName: [m?.firstName || '', Validators.required],
      lastName: [m?.lastName || '', Validators.required],
      role: [m?.role || '', Validators.required],
      email: [m?.email || ''],
      phone: [m?.phone || ''],
      joinDate: [m?.joinDate ? new Date(m.joinDate) : null],
      endDate: [m?.endDate ? new Date(m.endDate) : null],
      active: [m?.active !== undefined ? m.active : true],
      notes: [m?.notes || '']
    });
  }
  save(): void { if (this.form.valid) this.dialogRef.close(this.form.value); }
}

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule, MatTooltipModule, MatTableModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Membres</h2>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Ajouter un membre
        </button>
      </div>

      <div *ngIf="members.length === 0" class="empty-state">
        <mat-icon>group</mat-icon>
        <h3>Aucun membre</h3>
        <button mat-raised-button color="primary" (click)="openForm()">Ajouter</button>
      </div>

      <div class="stats-row" *ngIf="members.length > 0">
        <mat-card class="stat-mini">
          <mat-icon>group</mat-icon>
          <div>
            <span class="stat-val">{{ members.length }}</span>
            <span class="stat-lbl">Total membres</span>
          </div>
        </mat-card>
        <mat-card class="stat-mini">
          <mat-icon style="color:#2e7d32">check_circle</mat-icon>
          <div>
            <span class="stat-val">{{ activeCount }}</span>
            <span class="stat-lbl">Membres actifs</span>
          </div>
        </mat-card>
      </div>

      <div class="members-grid" *ngIf="members.length > 0">
        <mat-card *ngFor="let m of members" class="member-card" [class.inactive]="!m.active">
          <mat-card-header>
            <div mat-card-avatar class="member-avatar" [class.inactive]="!m.active">
              <span>{{ m.firstName[0] }}{{ m.lastName[0] }}</span>
            </div>
            <mat-card-title>{{ m.firstName }} {{ m.lastName }}</mat-card-title>
            <mat-card-subtitle>
              {{ m.role }}
              <span class="active-badge" *ngIf="m.active">Actif</span>
              <span class="inactive-badge" *ngIf="!m.active">Inactif</span>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="info-line" *ngIf="m.email"><mat-icon>email</mat-icon> {{ m.email }}</div>
            <div class="info-line" *ngIf="m.phone"><mat-icon>phone</mat-icon> {{ m.phone }}</div>
            <div class="info-line" *ngIf="m.joinDate"><mat-icon>calendar_today</mat-icon> Depuis {{ m.joinDate | date:'dd/MM/yyyy' }}</div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-icon-button color="primary" matTooltip="Modifier" (click)="openForm(m)"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="delete(m)"><mat-icon>delete</mat-icon></button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1a237e; margin: 0; }
    .empty-state { text-align: center; padding: 64px; color: #999; mat-icon { font-size: 64px; width: 64px; height: 64px; } h3 { margin: 16px 0 8px; } }
    .stats-row { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-mini { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px !important; mat-icon { font-size: 32px; width: 32px; height: 32px; color: #1a237e; } .stat-val { display: block; font-size: 1.5rem; font-weight: 700; } .stat-lbl { font-size: 12px; color: #888; } }
    .members-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
    .member-card { border-radius: 12px !important; &.inactive { opacity: 0.7; } }
    .member-avatar {
      width: 40px; height: 40px; border-radius: 50%; background: #1a237e;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 14px;
      &.inactive { background: #aaa; }
    }
    .active-badge { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 6px; }
    .inactive-badge { background: #fce4ec; color: #c62828; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 6px; }
    .info-line { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; margin-bottom: 4px; mat-icon { font-size: 16px; width: 16px; height: 16px; } }
  `]
})
export class MembersComponent implements OnInit {
  members: Member[] = [];
  get activeCount(): number { return this.members.filter(m => m.active).length; }

  constructor(private memberService: MemberService, private dialog: MatDialog, private snackBar: MatSnackBar) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.members = this.memberService.getAll(); }

  openForm(member?: Member): void {
    const ref = this.dialog.open(MemberFormDialogComponent, { width: '600px', data: { member } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        if (member) { this.memberService.update(member.id, result); this.snackBar.open('Membre mis à jour', 'Fermer', { duration: 3000 }); }
        else { this.memberService.add(result); this.snackBar.open('Membre ajouté', 'Fermer', { duration: 3000 }); }
        this.load();
      }
    });
  }

  delete(member: Member): void {
    if (confirm(`Supprimer ${member.firstName} ${member.lastName} ?`)) {
      this.memberService.delete(member.id);
      this.snackBar.open('Membre supprimé', 'Fermer', { duration: 3000 });
      this.load();
    }
  }
}
