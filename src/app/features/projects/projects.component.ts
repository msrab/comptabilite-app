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
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProjectService } from '../../core/services/project.service';
import { ClientService } from '../../core/services/client.service';
import { TransactionService } from '../../core/services/transaction.service';
import { BudgetService } from '../../core/services/budget.service';
import { Project, Client } from '../../core/models';

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <h2 mat-dialog-title>{{ data.project ? 'Modifier' : 'Ajouter' }} un projet</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom du projet *</mat-label>
          <input matInput formControlName="name">
          <mat-error>Champ requis</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Client associé</mat-label>
          <mat-select formControlName="clientId">
            <mat-option value="">Aucun</mat-option>
            <mat-option *ngFor="let c of clients" [value]="c.id">{{ c.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Statut</mat-label>
          <mat-select formControlName="status">
            <mat-option value="planned">Planifié</mat-option>
            <mat-option value="active">Actif</mat-option>
            <mat-option value="completed">Terminé</mat-option>
            <mat-option value="cancelled">Annulé</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Date de début</mat-label>
            <input matInput [matDatepicker]="dp1" formControlName="startDate">
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
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Budget prévu (€)</mat-label>
          <input matInput formControlName="budget" type="number" min="0">
          <span matPrefix>€&nbsp;</span>
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
  styles: [`.form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; min-width: 480px; } .full-width { width: 100%; } .row { display: flex; gap: 12px; mat-form-field { flex: 1; } }`]
})
export class ProjectFormDialogComponent implements OnInit {
  form!: FormGroup;
  clients: Client[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProjectFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project?: Project; clients: Client[] }
  ) { this.clients = data.clients; }

  ngOnInit(): void {
    const p = this.data.project;
    this.form = this.fb.group({
      name: [p?.name || '', Validators.required],
      description: [p?.description || ''],
      clientId: [p?.clientId || ''],
      status: [p?.status || 'planned', Validators.required],
      startDate: [p?.startDate ? new Date(p.startDate) : null],
      endDate: [p?.endDate ? new Date(p.endDate) : null],
      budget: [p?.budget || null],
      notes: [p?.notes || '']
    });
  }

  save(): void { if (this.form.valid) this.dialogRef.close(this.form.value); }
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule, MatTooltipModule, MatProgressBarModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Projets</h2>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nouveau projet
        </button>
      </div>

      <div *ngIf="projects.length === 0" class="empty-state">
        <mat-icon>folder_special</mat-icon>
        <h3>Aucun projet</h3>
        <button mat-raised-button color="primary" (click)="openForm()">Ajouter</button>
      </div>

      <div class="projects-grid">
        <mat-card *ngFor="let project of projects" class="project-card">
          <mat-card-header>
            <div mat-card-avatar class="project-avatar" [ngClass]="project.status">
              <mat-icon>folder_special</mat-icon>
            </div>
            <mat-card-title>{{ project.name }}</mat-card-title>
            <mat-card-subtitle>
              <span class="status-chip" [ngClass]="project.status">{{ statusLabel(project.status) }}</span>
              <span *ngIf="getClientName(project.clientId)" class="client-tag">
                <mat-icon>business</mat-icon> {{ getClientName(project.clientId) }}
              </span>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p *ngIf="project.description" class="description">{{ project.description }}</p>
            <div class="project-meta">
              <span *ngIf="project.startDate"><mat-icon>calendar_today</mat-icon> Début: {{ project.startDate | date:'dd/MM/yyyy' }}</span>
              <span *ngIf="project.endDate"><mat-icon>event</mat-icon> Fin: {{ project.endDate | date:'dd/MM/yyyy' }}</span>
            </div>
            <div *ngIf="project.budget" class="budget-info">
              <div class="budget-row">
                <span>Budget: {{ project.budget | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                <span>Dépensé: {{ getActualExpense(project.id) | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              </div>
              <mat-progress-bar [value]="getBudgetPercent(project)" [color]="getBudgetPercent(project) > 90 ? 'warn' : 'primary'"></mat-progress-bar>
              <small>{{ getBudgetPercent(project) | number:'1.0-0' }}% utilisé</small>
            </div>
            <div class="actual-finances">
              <div class="fin-row income">
                <mat-icon>arrow_upward</mat-icon>
                <span>Entrées réelles</span>
                <strong>{{ getActualIncome(project.id) | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
              </div>
              <div class="fin-row expense">
                <mat-icon>arrow_downward</mat-icon>
                <span>Dépenses réelles</span>
                <strong>{{ getActualExpense(project.id) | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
              </div>
              <div class="fin-row balance" [class.positive]="getActualIncome(project.id) - getActualExpense(project.id) >= 0" [class.negative]="getActualIncome(project.id) - getActualExpense(project.id) < 0">
                <mat-icon>account_balance</mat-icon>
                <span>Solde</span>
                <strong>{{ (getActualIncome(project.id) - getActualExpense(project.id)) | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
              </div>
            </div>
            <div class="project-stats">
              <span><mat-icon>receipt</mat-icon> {{ getTxCount(project.id) }} transaction(s)</span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-icon-button color="primary" matTooltip="Modifier" (click)="openForm(project)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="delete(project)">
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
    .empty-state { text-align: center; padding: 64px; color: #999; mat-icon { font-size: 64px; width: 64px; height: 64px; } h3 { margin: 16px 0 8px; } }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .project-card { border-radius: 12px !important; }
    .project-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      &.active { background: #2e7d32; } &.planned { background: #1565c0; }
      &.completed { background: #37474f; } &.cancelled { background: #c62828; }
      mat-icon { color: white; }
    }
    .status-chip {
      padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;
      &.active { background: #e8f5e9; color: #2e7d32; }
      &.planned { background: #e3f2fd; color: #1565c0; }
      &.completed { background: #eceff1; color: #37474f; }
      &.cancelled { background: #ffebee; color: #c62828; }
    }
    .client-tag { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; margin-left: 8px; mat-icon { font-size: 14px; width: 14px; height: 14px; } }
    .description { font-size: 13px; color: #555; margin-bottom: 8px; }
    .project-meta { display: flex; gap: 12px; font-size: 12px; color: #888; margin-bottom: 8px; span { display: inline-flex; align-items: center; gap: 4px; mat-icon { font-size: 14px; width: 14px; height: 14px; } } }
    .budget-info { background: #f5f5f5; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
    .budget-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .actual-finances { border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 8px; }
    .fin-row { display: flex; align-items: center; gap: 8px; padding: 7px 12px; font-size: 13px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      span { flex: 1; }
      strong { font-weight: 600; }
      &.income  { background: #f0fdf4; color: #15803d; mat-icon { color: #16a34a; } }
      &.expense { background: #fff7f7; color: #b91c1c; mat-icon { color: #dc2626; } }
      &.balance { background: #f8fafc; border-top: 1px solid #e5e7eb;
        &.positive strong { color: #15803d; } &.negative strong { color: #b91c1c; }
      }
    }
    .project-stats { display: flex; gap: 12px; font-size: 12px; color: #888; span { display: inline-flex; align-items: center; gap: 4px; mat-icon { font-size: 14px; width: 14px; height: 14px; } } }
  `]
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  clients: Client[] = [];

  constructor(
    private projectService: ProjectService,
    private clientService: ClientService,
    private transactionService: TransactionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.clients = this.clientService.getAll();
    this.projects = this.projectService.getAll();
  }

  openForm(project?: Project): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '600px', data: { project, clients: this.clients } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        if (project) { this.projectService.update(project.id, result); this.snackBar.open('Projet mis à jour', 'Fermer', { duration: 3000 }); }
        else { this.projectService.add(result); this.snackBar.open('Projet ajouté', 'Fermer', { duration: 3000 }); }
        this.load();
      }
    });
  }

  delete(project: Project): void {
    if (confirm(`Supprimer le projet "${project.name}" ?`)) {
      this.projectService.delete(project.id);
      this.snackBar.open('Projet supprimé', 'Fermer', { duration: 3000 });
      this.load();
    }
  }

  getClientName(clientId?: string): string {
    if (!clientId) return '';
    return this.clients.find(c => c.id === clientId)?.name || '';
  }

  getActualExpense(projectId: string): number {
    return this.transactionService.getByProject(projectId).filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  }

  getActualIncome(projectId: string): number {
    return this.transactionService.getByProject(projectId).filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  }

  getBudgetPercent(project: Project): number {
    if (!project.budget || project.budget === 0) return 0;
    return (this.getActualExpense(project.id) / project.budget) * 100;
  }

  getTxCount(projectId: string): number { return this.transactionService.getByProject(projectId).length; }

  statusLabel(status: string): string {
    const map: Record<string, string> = { planned: 'Planifié', active: 'Actif', completed: 'Terminé', cancelled: 'Annulé' };
    return map[status] || status;
  }
}
