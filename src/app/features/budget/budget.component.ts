import { Component, OnInit, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { BudgetService } from '../../core/services/budget.service';
import { ProjectService } from '../../core/services/project.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Budget, BudgetLine, Project } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

function genId(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

@Component({
  selector: 'app-budget-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>{{ data.budget ? 'Modifier' : 'Créer' }} un budget</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom du budget *</mat-label>
          <input matInput formControlName="name">
          <mat-error>Champ requis</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type *</mat-label>
          <mat-select formControlName="type" (selectionChange)="onTypeChange()">
            <mat-option value="annual">Budget annuel prévisionnel</mat-option>
            <mat-option value="project">Budget de projet</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field *ngIf="form.get('type')?.value === 'annual'" appearance="outline" class="full-width">
          <mat-label>Année *</mat-label>
          <mat-select formControlName="year">
            <mat-option *ngFor="let y of years" [value]="y">{{ y }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field *ngIf="form.get('type')?.value === 'project'" appearance="outline" class="full-width">
          <mat-label>Projet *</mat-label>
          <mat-select formControlName="projectId">
            <mat-option *ngFor="let p of projects" [value]="p.id">{{ p.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>

        <mat-divider></mat-divider>
        <div class="lines-header">
          <h4>Lignes budgétaires</h4>
          <button type="button" mat-stroked-button color="primary" (click)="addLine('income')">
            <mat-icon>add</mat-icon> Revenu
          </button>
          <button type="button" mat-stroked-button color="warn" (click)="addLine('expense')">
            <mat-icon>add</mat-icon> Dépense
          </button>
        </div>

        <div formArrayName="lines">
          <div *ngFor="let line of linesArray.controls; let i = index" [formGroupName]="i" class="budget-line" [class.income-line]="line.get('type')?.value === 'income'" [class.expense-line]="line.get('type')?.value === 'expense'">
            <mat-icon>{{ line.get('type')?.value === 'income' ? 'add_circle' : 'remove_circle' }}</mat-icon>
            <mat-form-field appearance="outline" class="line-cat">
              <mat-label>Catégorie</mat-label>
              <mat-select formControlName="category">
                <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="line-desc">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description">
            </mat-form-field>
            <mat-form-field appearance="outline" class="line-amount">
              <mat-label>Montant (€)</mat-label>
              <input matInput formControlName="plannedAmount" type="number" min="0">
            </mat-form-field>
            <button type="button" mat-icon-button color="warn" (click)="removeLine(i)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <div class="budget-totals" *ngIf="linesArray.length > 0">
          <span class="total-income">Revenus prévus: {{ totalPlannedIncome | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
          <span class="total-expense">Dépenses prévues: {{ totalPlannedExpense | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
          <span [class.positive]="totalPlannedIncome - totalPlannedExpense >= 0" [class.negative]="totalPlannedIncome - totalPlannedExpense < 0">
            Solde prévu: {{ (totalPlannedIncome - totalPlannedExpense) | currency:'EUR':'symbol':'1.2-2':'fr' }}
          </span>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        <mat-icon>save</mat-icon> Enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; min-width: 620px; }
    .full-width { width: 100%; }
    .lines-header { display: flex; align-items: center; gap: 8px; margin: 8px 0; h4 { flex: 1; margin: 0; } }
    .budget-line { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 8px; margin-bottom: 4px;
      mat-icon { flex-shrink: 0; }
      &.income-line { background: #e8f5e9; mat-icon { color: #2e7d32; } }
      &.expense-line { background: #ffebee; mat-icon { color: #c62828; } }
    }
    .line-cat { width: 180px; flex-shrink: 0; }
    .line-desc { flex: 1; }
    .line-amount { width: 130px; flex-shrink: 0; }
    .budget-totals { display: flex; gap: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 13px; font-weight: 500; }
    .total-income { color: #2e7d32; }
    .total-expense { color: #c62828; }
    .positive { color: #2e7d32; font-weight: 700; }
    .negative { color: #c62828; font-weight: 700; }
  `]
})
export class BudgetFormDialogComponent implements OnInit {
  form!: FormGroup;
  categories: string[] = [];
  projects: Project[] = [];
  years: number[] = [];

  get linesArray(): FormArray { return this.form.get('lines') as FormArray; }
  get totalPlannedIncome(): number { return this.linesArray.controls.filter(c => c.get('type')?.value === 'income').reduce((a, c) => a + (+c.get('plannedAmount')?.value || 0), 0); }
  get totalPlannedExpense(): number { return this.linesArray.controls.filter(c => c.get('type')?.value === 'expense').reduce((a, c) => a + (+c.get('plannedAmount')?.value || 0), 0); }

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    public dialogRef: MatDialogRef<BudgetFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { budget?: Budget; projects: Project[] }
  ) { this.projects = data.projects; }

  ngOnInit(): void {
    this.categories = this.settingsService.getCategories();
    const b = this.data.budget;
    const cur = new Date().getFullYear();
    this.years = [cur - 1, cur, cur + 1, cur + 2];

    this.form = this.fb.group({
      name: [b?.name || '', Validators.required],
      type: [b?.type || 'annual', Validators.required],
      year: [b?.year || cur + 1],
      projectId: [b?.projectId || ''],
      notes: [b?.notes || ''],
      lines: this.fb.array(b?.lines?.map(l => this.buildLine(l)) || [])
    });
  }

  buildLine(line?: Partial<BudgetLine>): FormGroup {
    return this.fb.group({
      id: [line?.id || genId()],
      category: [line?.category || ''],
      description: [line?.description || ''],
      plannedAmount: [line?.plannedAmount || 0],
      type: [line?.type || 'expense']
    });
  }

  addLine(type: 'income' | 'expense'): void { this.linesArray.push(this.buildLine({ type })); }
  removeLine(i: number): void { this.linesArray.removeAt(i); }
  onTypeChange(): void {}

  save(): void {
    if (this.form.valid) {
      const val = { ...this.form.value, lines: this.linesArray.value };
      this.dialogRef.close(val);
    }
  }
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule, MatTooltipModule, MatTabsModule, MatDividerModule, MatProgressBarModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Budgets & Prévisions</h2>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Créer un budget
        </button>
      </div>

      <mat-tab-group>
        <mat-tab label="Budgets annuels">
          <div class="budgets-list">
            <div *ngIf="annualBudgets.length === 0" class="empty-state">
              <mat-icon>bar_chart</mat-icon>
              <h3>Aucun budget annuel</h3>
              <button mat-raised-button color="primary" (click)="openForm('annual')">Créer</button>
            </div>
            <mat-card *ngFor="let b of annualBudgets" class="budget-card">
              <mat-card-header>
                <div mat-card-avatar class="budget-avatar"><mat-icon>calendar_today</mat-icon></div>
                <mat-card-title>{{ b.name }}</mat-card-title>
                <mat-card-subtitle>Année {{ b.year }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="budget-summary">
                  <div class="bs-item income">
                    <span class="bs-lbl">Revenus prévus</span>
                    <span class="bs-val">{{ getTotalPlanned(b, 'income') | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                    <span class="bs-actual">Réel: {{ getActual(b, 'income') | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                    <mat-progress-bar [value]="getPercent(b, 'income')" color="primary"></mat-progress-bar>
                    <small>{{ getPercent(b, 'income') | number:'1.0-0' }}% atteint</small>
                  </div>
                  <div class="bs-item expense">
                    <span class="bs-lbl">Dépenses prévues</span>
                    <span class="bs-val">{{ getTotalPlanned(b, 'expense') | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                    <span class="bs-actual">Réel: {{ getActual(b, 'expense') | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                    <mat-progress-bar [value]="getPercent(b, 'expense')" [color]="getPercent(b, 'expense') > 100 ? 'warn' : 'accent'"></mat-progress-bar>
                    <small>{{ getPercent(b, 'expense') | number:'1.0-0' }}% consommé</small>
                  </div>
                </div>
                <mat-divider></mat-divider>
                <div class="budget-lines-preview">
                  <div *ngFor="let line of b.lines.slice(0, 4)" class="line-preview" [class.income]="line.type === 'income'" [class.expense]="line.type === 'expense'">
                    <span>{{ line.category }}</span>
                    <span>{{ line.plannedAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                  </div>
                  <small *ngIf="b.lines.length > 4" class="more">+{{ b.lines.length - 4 }} lignes</small>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-icon-button color="primary" matTooltip="Modifier" (click)="openForm(undefined, b)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="delete(b)"><mat-icon>delete</mat-icon></button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Budgets de projets">
          <div class="budgets-list">
            <div *ngIf="projectBudgets.length === 0" class="empty-state">
              <mat-icon>folder_special</mat-icon>
              <h3>Aucun budget de projet</h3>
              <button mat-raised-button color="primary" (click)="openForm('project')">Créer</button>
            </div>
            <mat-card *ngFor="let b of projectBudgets" class="budget-card">
              <mat-card-header>
                <div mat-card-avatar class="budget-avatar project"><mat-icon>folder_special</mat-icon></div>
                <mat-card-title>{{ b.name }}</mat-card-title>
                <mat-card-subtitle>Projet: {{ getProjectName(b.projectId) }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="budget-summary">
                  <div class="bs-item income">
                    <span class="bs-lbl">Revenus prévus</span>
                    <span class="bs-val">{{ getTotalPlanned(b, 'income') | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                    <span class="bs-actual">Réel: {{ getActual(b, 'income') | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                    <mat-progress-bar [value]="getPercent(b, 'income')" color="primary"></mat-progress-bar>
                  </div>
                  <div class="bs-item expense">
                    <span class="bs-lbl">Dépenses prévues</span>
                    <span class="bs-val">{{ getTotalPlanned(b, 'expense') | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                    <span class="bs-actual">Réel: {{ getActual(b, 'expense') | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                    <mat-progress-bar [value]="getPercent(b, 'expense')" [color]="getPercent(b, 'expense') > 100 ? 'warn' : 'accent'"></mat-progress-bar>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-icon-button color="primary" matTooltip="Modifier" (click)="openForm(undefined, b)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="delete(b)"><mat-icon>delete</mat-icon></button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1a237e; margin: 0; }
    .budgets-list { padding: 16px 0; display: flex; flex-direction: column; gap: 16px; }
    .empty-state { text-align: center; padding: 64px; color: #999; mat-icon { font-size: 64px; width: 64px; height: 64px; } h3 { margin: 16px 0 8px; } }
    .budget-card { border-radius: 12px !important; }
    .budget-avatar { width: 40px; height: 40px; border-radius: 50%; background: #1a237e; display: flex; align-items: center; justify-content: center; mat-icon { color: white; } &.project { background: #6a1b9a; } }
    .budget-summary { display: flex; gap: 24px; margin: 12px 0; }
    .bs-item { flex: 1; .bs-lbl { display: block; font-size: 12px; color: #666; } .bs-val { display: block; font-size: 1.1rem; font-weight: 700; margin: 4px 0; } .bs-actual { display: block; font-size: 12px; margin-bottom: 6px; }
      &.income .bs-val { color: #2e7d32; } &.expense .bs-val { color: #c62828; }
    }
    .budget-lines-preview { margin-top: 12px; }
    .line-preview { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 8px; border-radius: 4px; margin-bottom: 2px;
      &.income { background: #e8f5e9; color: #2e7d32; }
      &.expense { background: #ffebee; color: #c62828; }
    }
    .more { color: #888; font-size: 12px; }
  `]
})
export class BudgetComponent implements OnInit {
  annualBudgets: Budget[] = [];
  projectBudgets: Budget[] = [];
  projects: Project[] = [];

  constructor(
    private budgetService: BudgetService,
    private projectService: ProjectService,
    private txService: TransactionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.projects = this.projectService.getAll();
    this.annualBudgets = this.budgetService.getAnnual();
    this.projectBudgets = this.budgetService.getProjectBudgets();
  }

  openForm(type?: string, budget?: Budget): void {
    const ref = this.dialog.open(BudgetFormDialogComponent, { width: '780px', data: { budget, projects: this.projects } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        if (budget) { this.budgetService.update(budget.id, result); this.snackBar.open('Budget mis à jour', 'Fermer', { duration: 3000 }); }
        else { this.budgetService.add(result); this.snackBar.open('Budget créé', 'Fermer', { duration: 3000 }); }
        this.load();
      }
    });
  }

  delete(budget: Budget): void {
    if (confirm(`Supprimer le budget "${budget.name}" ?`)) {
      this.budgetService.delete(budget.id);
      this.snackBar.open('Supprimé', 'Fermer', { duration: 3000 });
      this.load();
    }
  }

  getTotalPlanned(b: Budget, type: 'income' | 'expense'): number {
    return b.lines.filter(l => l.type === type).reduce((a, l) => a + l.plannedAmount, 0);
  }

  getActual(b: Budget, type: 'income' | 'expense'): number {
    const all = this.txService.getAll();
    if (b.type === 'annual' && b.year) {
      return all.filter(t => t.type === type && new Date(t.date).getFullYear() === b.year).reduce((a, t) => a + t.amount, 0);
    }
    if (b.type === 'project' && b.projectId) {
      return all.filter(t => t.type === type && t.projectId === b.projectId).reduce((a, t) => a + t.amount, 0);
    }
    return 0;
  }

  getPercent(b: Budget, type: 'income' | 'expense'): number {
    const planned = this.getTotalPlanned(b, type);
    if (!planned) return 0;
    return Math.min(200, (this.getActual(b, type) / planned) * 100);
  }

  getProjectName(id?: string): string {
    if (!id) return '';
    return this.projects.find(p => p.id === id)?.name || '';
  }
}
