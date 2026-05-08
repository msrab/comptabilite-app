import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../core/services/transaction.service';
import { DebtService } from '../../core/services/debt.service';
import { ProjectService } from '../../core/services/project.service';
import { BudgetService } from '../../core/services/budget.service';
import { Transaction, Debt } from '../../core/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="dashboard page">

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" [class.kpi-positive]="balance >= 0" [class.kpi-negative]="balance < 0">
          <div class="kpi-icon-wrap kpi-balance">
            <mat-icon>account_balance</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Solde actuel</span>
            <span class="kpi-value">{{ balance | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
          </div>
          <div class="kpi-badge" [class.up]="balance >= 0" [class.down]="balance < 0">
            <mat-icon>{{ balance >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-income"><mat-icon>arrow_upward</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-label">Revenus {{ currentYear }}</span>
            <span class="kpi-value income">{{ yearIncome | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-expense"><mat-icon>arrow_downward</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-label">Dépenses {{ currentYear }}</span>
            <span class="kpi-value expense">{{ yearExpense | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-debt"><mat-icon>warning_amber</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-label">Dettes en cours</span>
            <span class="kpi-value warning">{{ pendingDebtAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-credit"><mat-icon>payments</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-label">Créances à recevoir</span>
            <span class="kpi-value success">{{ pendingCreditAmount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-projects"><mat-icon>folder_special</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-label">Projets actifs</span>
            <span class="kpi-value brand">{{ activeProjects }}</span>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <div class="card chart-card large">
          <div class="card-header">
            <h3>Évolution mensuelle — {{ currentYear }}</h3>
            <span class="card-badge">{{ currentYear }}</span>
          </div>
          <div class="card-body">
            <canvas #evolutionChart></canvas>
          </div>
        </div>

        <div class="card chart-card">
          <div class="card-header">
            <h3>Dépenses par catégorie</h3>
          </div>
          <div class="card-body center">
            <canvas #categoryChart></canvas>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div class="bottom-grid">
        <div class="card">
          <div class="card-header">
            <h3>Transactions récentes</h3>
            <a class="see-all" routerLink="/transactions">Voir tout →</a>
          </div>
          <div class="card-body no-pad">
            <div *ngIf="recentTransactions.length === 0" class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              <p>Aucune transaction enregistrée</p>
            </div>
            <div *ngFor="let t of recentTransactions" class="tx-row">
              <div class="tx-dot" [class.income]="t.type==='income'" [class.expense]="t.type==='expense'">
                <mat-icon>{{ t.type === 'income' ? 'add' : 'remove' }}</mat-icon>
              </div>
              <div class="tx-info">
                <span class="tx-title">{{ t.title }}</span>
                <span class="tx-sub">{{ t.category }} · {{ t.date | date:'dd MMM yyyy' }}</span>
              </div>
              <span class="tx-amount" [class.income]="t.type==='income'" [class.expense]="t.type==='expense'">
                {{ t.type === 'income' ? '+' : '−' }}{{ t.amount | currency:'EUR':'symbol':'1.2-2':'fr' }}
              </span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Alertes & Échéances</h3>
            <span *ngIf="overdueDebts.length" class="badge-danger">{{ overdueDebts.length }} échu(s)</span>
          </div>
          <div class="card-body no-pad">
            <div *ngIf="overdueDebts.length === 0 && upcomingDebts.length === 0" class="empty-state">
              <mat-icon>check_circle_outline</mat-icon>
              <p>Aucune alerte pour le moment</p>
            </div>
            <div *ngFor="let d of overdueDebts" class="alert-row overdue">
              <div class="alert-stripe"></div>
              <mat-icon class="alert-ico">error_outline</mat-icon>
              <div class="alert-info">
                <span class="alert-title">{{ d.description }}</span>
                <span class="alert-sub">Échu le {{ d.dueDate | date:'dd MMM yyyy' }}</span>
              </div>
              <span class="alert-amount">{{ (d.amount - d.paidAmount) | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
            </div>
            <div *ngFor="let d of upcomingDebts" class="alert-row upcoming">
              <div class="alert-stripe"></div>
              <mat-icon class="alert-ico">schedule</mat-icon>
              <div class="alert-info">
                <span class="alert-title">{{ d.description }}</span>
                <span class="alert-sub">Échéance le {{ d.dueDate | date:'dd MMM yyyy' }}</span>
              </div>
              <span class="alert-amount">{{ (d.amount - d.paidAmount) | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding-bottom: 32px; }

    /* ── KPI Grid ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #fff;
      border: 1px solid #e8ecf4;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.15s, transform 0.15s;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); transform: translateY(-1px); }
    }
    .kpi-icon-wrap {
      width: 44px; height: 44px; min-width: 44px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #fff; }
    }
    .kpi-balance  { background: linear-gradient(135deg, #4f6ef7, #3d5ce8); }
    .kpi-income   { background: linear-gradient(135deg, #10b981, #059669); }
    .kpi-expense  { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .kpi-debt     { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .kpi-credit   { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    .kpi-projects { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

    .kpi-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .kpi-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; }
    .kpi-value { font-size: 1.2rem; font-weight: 700; color: #0d1117; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-value.income  { color: #059669; }
    .kpi-value.expense { color: #dc2626; }
    .kpi-value.warning { color: #d97706; }
    .kpi-value.success { color: #0891b2; }
    .kpi-value.brand   { color: #4f6ef7; }

    .kpi-badge {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.up   { background: #d1fae5; mat-icon { color: #059669; } }
      &.down { background: #fee2e2; mat-icon { color: #dc2626; } }
    }

    /* ── Generic Card ── */
    .card {
      background: #fff;
      border: 1px solid #e8ecf4;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px 14px;
      border-bottom: 1px solid #f3f4f6;
      h3 { font-size: 14px; font-weight: 600; color: #0d1117; letter-spacing: -0.2px; }
    }
    .card-badge {
      font-size: 11px; font-weight: 600;
      background: #f0f4ff;
      color: #4f6ef7;
      border-radius: 999px;
      padding: 2px 10px;
    }
    .badge-danger {
      font-size: 11px; font-weight: 600;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 999px;
      padding: 2px 10px;
    }
    .see-all { font-size: 12px; font-weight: 600; color: #4f6ef7; text-decoration: none; &:hover { text-decoration: underline; } }
    .card-body { padding: 16px 20px; }
    .card-body.no-pad { padding: 0; }
    .card-body.center { display: flex; align-items: center; justify-content: center; }

    /* ── Charts ── */
    .charts-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .chart-card .card-body { padding: 16px 20px 20px; }
    canvas { max-height: 270px; }

    /* ── Bottom ── */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    /* ── Transactions ── */
    .tx-row {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 20px;
      border-bottom: 1px solid #f8f9fc;
      transition: background 0.1s;
      &:last-child { border-bottom: none; }
      &:hover { background: #fafbfe; }
    }
    .tx-dot {
      width: 32px; height: 32px; min-width: 32px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.income  { background: #d1fae5; mat-icon { color: #059669; } }
      &.expense { background: #fee2e2; mat-icon { color: #dc2626; } }
    }
    .tx-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .tx-title { font-size: 13px; font-weight: 600; color: #0d1117; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tx-sub   { font-size: 11px; color: #9ca3af; margin-top: 1px; }
    .tx-amount { font-size: 13px; font-weight: 700; white-space: nowrap;
      &.income  { color: #059669; }
      &.expense { color: #dc2626; }
    }

    /* ── Alerts ── */
    .alert-row {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 20px;
      border-bottom: 1px solid #f8f9fc;
      position: relative;
      &:last-child { border-bottom: none; }
    }
    .alert-stripe {
      position: absolute;
      left: 0; top: 8px; bottom: 8px;
      width: 3px;
      border-radius: 0 3px 3px 0;
    }
    .overdue .alert-stripe { background: #ef4444; }
    .upcoming .alert-stripe { background: #f59e0b; }
    .alert-ico { font-size: 18px; width: 18px; height: 18px; }
    .overdue .alert-ico  { color: #ef4444; }
    .upcoming .alert-ico { color: #f59e0b; }
    .alert-info { flex: 1; display: flex; flex-direction: column; }
    .alert-title { font-size: 13px; font-weight: 600; color: #0d1117; }
    .alert-sub   { font-size: 11px; color: #9ca3af; margin-top: 1px; }
    .alert-amount { font-size: 13px; font-weight: 700; color: #374151; white-space: nowrap; }

    .empty-state {
      text-align: center; padding: 36px; color: #9ca3af;
      mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.3; display: block; margin: 0 auto 8px; }
      p { font-size: 13px; }
    }

    @media (max-width: 900px) {
      .charts-grid, .bottom-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('evolutionChart') evolutionChartRef!: ElementRef;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef;

  balance = 0;
  yearIncome = 0;
  yearExpense = 0;
  pendingDebtAmount = 0;
  pendingCreditAmount = 0;
  activeProjects = 0;
  recentTransactions: Transaction[] = [];
  overdueDebts: Debt[] = [];
  upcomingDebts: Debt[] = [];
  currentYear = new Date().getFullYear();

  constructor(
    private transactionService: TransactionService,
    private debtService: DebtService,
    private projectService: ProjectService,
    private budgetService: BudgetService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.buildEvolutionChart();
    this.buildCategoryChart();
  }

  private loadData(): void {
    this.balance = this.transactionService.getTotalBalance();
    const yearStart = new Date(this.currentYear, 0, 1);
    const yearEnd = new Date(this.currentYear, 11, 31, 23, 59, 59);
    const yearTransactions = this.transactionService.getByPeriod(yearStart, yearEnd);
    this.yearIncome = yearTransactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    this.yearExpense = yearTransactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

    const pendingDebts = this.debtService.getPendingDebts();
    const pendingCredits = this.debtService.getPendingCredits();
    this.pendingDebtAmount = pendingDebts.reduce((a, d) => a + (d.amount - d.paidAmount), 0);
    this.pendingCreditAmount = pendingCredits.reduce((a, d) => a + (d.amount - d.paidAmount), 0);

    this.activeProjects = this.projectService.getAll().filter(p => p.status === 'active').length;

    const allTx = this.transactionService.getAll();
    this.recentTransactions = [...allTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    const today = new Date();
    const inTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const allDebts = this.debtService.getAll().filter(d => d.status !== 'paid' && d.status !== 'cancelled' && d.dueDate);
    this.overdueDebts = allDebts.filter(d => new Date(d.dueDate!) < today);
    this.upcomingDebts = allDebts.filter(d => { const dd = new Date(d.dueDate!); return dd >= today && dd <= inTwoWeeks; });
  }

  private buildEvolutionChart(): void {
    if (!this.evolutionChartRef) return;
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const incomes: number[] = [];
    const expenses: number[] = [];
    const balances: number[] = [];
    let cumBalance = 0;
    for (let m = 0; m < 12; m++) {
      const txs = this.transactionService.getByMonth(this.currentYear, m);
      const inc = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
      cumBalance += inc - exp;
      incomes.push(inc);
      expenses.push(exp);
      balances.push(cumBalance);
    }
    new Chart(this.evolutionChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Revenus', data: incomes, backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 6, borderSkipped: false },
          { label: 'Dépenses', data: expenses, backgroundColor: 'rgba(239,68,68,0.75)', borderRadius: 6, borderSkipped: false },
          { label: 'Solde cumulé', data: balances, type: 'line', borderColor: '#4f6ef7', backgroundColor: 'rgba(79,110,247,0.08)', fill: true, tension: 0.4, yAxisID: 'y1', pointBackgroundColor: '#4f6ef7', pointRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index' },
        plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } } },
        scales: {
          y:  { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: (v) => v + ' €', font: { size: 11 } } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: (v) => v + ' €', font: { size: 11 } } }
        }
      }
    });
  }

  private buildCategoryChart(): void {
    if (!this.categoryChartRef) return;
    const expenses = this.transactionService.getExpenses();
    const catMap: Record<string, number> = {};
    for (const t of expenses) {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    }
    const labels = Object.keys(catMap);
    const data = Object.values(catMap);
    const colors = ['#4f6ef7','#10b981','#ef4444','#f59e0b','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#6366f1','#84cc16','#e879f9'];
    new Chart(this.categoryChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors.slice(0, labels.length), hoverOffset: 6, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } } }
      }
    });
  }
}
