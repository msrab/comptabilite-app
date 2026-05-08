import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClientService } from '../../core/services/client.service';
import { ProjectService } from '../../core/services/project.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Client } from '../../core/models';
import { ClientFormDialogComponent } from './client-form-dialog.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatDialogModule, MatTableModule,
    MatTooltipModule, MatChipsModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Clients</h2>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Ajouter un client
        </button>
      </div>

      <mat-card class="search-card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Rechercher un client</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput (input)="filterClients($event)" placeholder="Nom, email...">
        </mat-form-field>
      </mat-card>

      <div *ngIf="filtered().length === 0" class="empty-state">
        <mat-icon>business</mat-icon>
        <h3>Aucun client</h3>
        <p>Commencez par ajouter un client</p>
        <button mat-raised-button color="primary" (click)="openForm()">Ajouter</button>
      </div>

      <div class="clients-grid" *ngIf="filtered().length > 0">
        <mat-card *ngFor="let client of filtered()" class="client-card">
          <mat-card-header>
            <div mat-card-avatar class="client-avatar" [class.org]="client.type === 'organization'">
              <mat-icon>{{ client.type === 'organization' ? 'domain' : 'person' }}</mat-icon>
            </div>
            <mat-card-title>{{ client.name }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip [class]="'type-chip ' + client.type">
                {{ client.type === 'organization' ? 'Organisation' : 'Particulier' }}
              </mat-chip>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="client-info" *ngIf="client.email">
              <mat-icon>email</mat-icon> {{ client.email }}
            </div>
            <div class="client-info" *ngIf="client.phone">
              <mat-icon>phone</mat-icon> {{ client.phone }}
            </div>
            <div class="client-info" *ngIf="client.address">
              <mat-icon>location_on</mat-icon> {{ client.address }}
            </div>
            <div class="client-stats">
              <span>{{ getProjectCount(client.id) }} projet(s)</span>
              <span>{{ getTransactionCount(client.id) }} transaction(s)</span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-icon-button color="primary" matTooltip="Modifier" (click)="openForm(client)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="deleteClient(client)">
              <mat-icon>delete</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1a237e; margin: 0; }
    .search-card { margin-bottom: 24px; border-radius: 12px !important; }
    .search-field { width: 100%; padding: 8px; }
    .empty-state { text-align: center; padding: 64px; color: #999; mat-icon { font-size: 64px; width: 64px; height: 64px; } h3 { margin: 16px 0 8px; } }
    .clients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .client-card { border-radius: 12px !important; }
    .client-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #1a237e;
      &.org { background: #6a1b9a; }
      mat-icon { color: white; font-size: 20px; }
    }
    .client-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; margin-bottom: 6px; mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    .client-stats { display: flex; gap: 12px; margin-top: 12px; font-size: 12px; color: #888; padding-top: 8px; border-top: 1px solid #f0f0f0; }
    .type-chip { font-size: 11px !important; height: 20px !important; }
  `]
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  filtered = signal<Client[]>([]);

  constructor(
    private clientService: ClientService,
    private projectService: ProjectService,
    private transactionService: TransactionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.clients = this.clientService.getAll();
    this.filtered.set(this.clients);
  }

  filterClients(event: Event): void {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.filtered.set(this.clients.filter(c => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)));
  }

  openForm(client?: Client): void {
    const ref = this.dialog.open(ClientFormDialogComponent, { width: '500px', data: { client } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        if (client) {
          this.clientService.update(client.id, result);
          this.snackBar.open('Client mis à jour', 'Fermer', { duration: 3000 });
        } else {
          this.clientService.add(result);
          this.snackBar.open('Client ajouté', 'Fermer', { duration: 3000 });
        }
        this.load();
      }
    });
  }

  deleteClient(client: Client): void {
    if (confirm(`Supprimer le client "${client.name}" ?`)) {
      this.clientService.delete(client.id);
      this.snackBar.open('Client supprimé', 'Fermer', { duration: 3000 });
      this.load();
    }
  }

  getProjectCount(clientId: string): number { return this.projectService.getByClient(clientId).length; }
  getTransactionCount(clientId: string): number { return this.transactionService.getByClient(clientId).length; }
}
