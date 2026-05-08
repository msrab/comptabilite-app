import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Client } from '../../core/models';

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.client ? 'Modifier' : 'Ajouter' }} un client</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom *</mat-label>
          <input matInput formControlName="name">
          <mat-error>Champ requis</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type *</mat-label>
          <mat-select formControlName="type">
            <mat-option value="individual">Particulier</mat-option>
            <mat-option value="organization">Organisation</mat-option>
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
          <textarea matInput formControlName="notes" rows="3"></textarea>
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
  styles: [`.form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; } .full-width { width: 100%; }`]
})
export class ClientFormDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ClientFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { client?: Client }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data.client?.name || '', Validators.required],
      type: [this.data.client?.type || 'individual', Validators.required],
      email: [this.data.client?.email || ''],
      phone: [this.data.client?.phone || ''],
      address: [this.data.client?.address || ''],
      notes: [this.data.client?.notes || '']
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }
}
