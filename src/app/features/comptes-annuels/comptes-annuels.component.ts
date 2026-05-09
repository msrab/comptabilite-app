import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TransactionService } from '../../core/services/transaction.service';
import { ExportService, AnnualSummary } from '../../core/services/export.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-comptes-annuels',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatFormFieldModule, MatDividerModule, MatTableModule,
    MatTooltipModule, MatChipsModule, MatSnackBarModule,
  ],
  template: `
<div class="page-wrap">

  <!-- En-tête -->
  <div class="page-header">
    <div>
      <h1 class="page-title"><mat-icon>description</mat-icon> Comptes Annuels</h1>
      <p class="page-subtitle">Comptabilité simplifiée – AR 26 juin 2003 – Petites ASBL</p>
    </div>
    <div class="header-actions">
      <mat-form-field appearance="outline" class="year-select">
        <mat-label>Exercice</mat-label>
        <mat-select [(ngModel)]="selectedYear" (ngModelChange)="loadSummary()">
          <mat-option *ngFor="let y of availableYears" [value]="y">{{ y }}</mat-option>
        </mat-select>
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="exportPDF()" [disabled]="!summary">
        <mat-icon>picture_as_pdf</mat-icon> Télécharger PDF
      </button>
      <button mat-raised-button class="excel-btn" (click)="exportExcel()" [disabled]="!summary">
        <mat-icon>table_chart</mat-icon> Télécharger Excel
      </button>
    </div>
  </div>

  <!-- Alerte infos ASBL manquantes -->
  <div class="info-banner" *ngIf="missingInfo">
    <mat-icon>info</mat-icon>
    <span>Complétez le <strong>nom, numéro BCE et adresse</strong> de votre ASBL dans
      <a routerLink="/settings">Paramètres</a> pour qu'ils apparaissent dans les documents exportés.
    </span>
  </div>

  <div *ngIf="summary; else noData">

    <!-- Identité -->
    <mat-card class="identity-card">
      <mat-card-content>
        <div class="identity-grid">
          <div><span class="lbl">Dénomination</span><strong>{{ summary.asblName || '—' }}</strong></div>
          <div><span class="lbl">N° BCE</span><strong>{{ summary.bceNumber || '—' }}</strong></div>
          <div><span class="lbl">Siège social</span><strong>{{ summary.address || '—' }}</strong></div>
          <div><span class="lbl">Exercice</span><strong>01/01/{{ summary.year }} – 31/12/{{ summary.year }}</strong></div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- KPIs -->
    <div class="kpi-row">
      <div class="kpi income">
        <mat-icon>arrow_upward</mat-icon>
        <div>
          <span class="kpi-label">Total Recettes</span>
          <span class="kpi-value">{{ summary.totalIncome | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
        </div>
      </div>
      <div class="kpi expense">
        <mat-icon>arrow_downward</mat-icon>
        <div>
          <span class="kpi-label">Total Dépenses</span>
          <span class="kpi-value">{{ summary.totalExpense | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
        </div>
      </div>
      <div class="kpi" [class.surplus]="summary.netResult >= 0" [class.deficit]="summary.netResult < 0">
        <mat-icon>{{ summary.netResult >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
        <div>
          <span class="kpi-label">{{ summary.netResult >= 0 ? 'Excédent' : 'Déficit' }}</span>
          <span class="kpi-value">{{ summary.netResult | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
        </div>
      </div>
      <div class="kpi neutral">
        <mat-icon>receipt_long</mat-icon>
        <div>
          <span class="kpi-label">Nb transactions</span>
          <span class="kpi-value">{{ summary.transactions.length }}</span>
        </div>
      </div>
    </div>

    <div class="tables-row">

      <!-- Recettes -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-icon class="income-icon">arrow_upward</mat-icon>
          <mat-card-title>I. Recettes par rubrique</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="summary.incomeByCategory" class="full-table">
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Rubrique</th>
              <td mat-cell *matCellDef="let r">{{ r.category }}</td>
              <td mat-footer-cell *matFooterCellDef><strong>TOTAL RECETTES</strong></td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef class="right">Montant</th>
              <td mat-cell *matCellDef="let r" class="right income-amt">
                {{ r.total | currency:'EUR':'symbol':'1.2-2':'fr' }}
              </td>
              <td mat-footer-cell *matFooterCellDef class="right income-amt">
                <strong>{{ summary.totalIncome | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['category','total']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['category','total']"></tr>
            <tr mat-footer-row *matFooterRowDef="['category','total']" class="footer-row"></tr>
          </table>
          <div *ngIf="summary.incomeByCategory.length === 0" class="empty">Aucune recette pour {{ selectedYear }}</div>
        </mat-card-content>
      </mat-card>

      <!-- Dépenses -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-icon class="expense-icon">arrow_downward</mat-icon>
          <mat-card-title>II. Dépenses par rubrique</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="summary.expenseByCategory" class="full-table">
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Rubrique</th>
              <td mat-cell *matCellDef="let r">{{ r.category }}</td>
              <td mat-footer-cell *matFooterCellDef><strong>TOTAL DÉPENSES</strong></td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef class="right">Montant</th>
              <td mat-cell *matCellDef="let r" class="right expense-amt">
                {{ r.total | currency:'EUR':'symbol':'1.2-2':'fr' }}
              </td>
              <td mat-footer-cell *matFooterCellDef class="right expense-amt">
                <strong>{{ summary.totalExpense | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['category','total']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['category','total']"></tr>
            <tr mat-footer-row *matFooterRowDef="['category','total']" class="footer-row"></tr>
          </table>
          <div *ngIf="summary.expenseByCategory.length === 0" class="empty">Aucune dépense pour {{ selectedYear }}</div>
        </mat-card-content>
      </mat-card>

    </div>

    <!-- Mention légale -->
    <mat-card class="legal-card">
      <mat-card-content>
        <mat-icon>gavel</mat-icon>
        <p>
          Document établi conformément à la <strong>loi du 27 juin 1921</strong> sur les ASBL, les AISBL et les fondations,
          et à l'<strong>arrêté royal du 26 juin 2003</strong> relatif à la comptabilité simplifiée de certaines ASBL.<br>
          À déposer à la <strong>Banque Nationale de Belgique</strong> dans les 30 jours suivant l'approbation par l'Assemblée Générale,
          via le portail <strong>e-DOC</strong> (bnb.be).
        </p>
      </mat-card-content>
    </mat-card>

  </div>

  <ng-template #noData>
    <div class="empty-state">
      <mat-icon>inbox</mat-icon>
      <p>Aucune transaction pour l'exercice {{ selectedYear }}</p>
    </div>
  </ng-template>

</div>
  `,
  styles: [`
    .page-wrap { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
    .page-title { display: flex; align-items: center; gap: 8px; font-size: 1.6rem; font-weight: 700; margin: 0; }
    .page-subtitle { color: #666; margin: 4px 0 0; font-size: 0.9rem; }
    .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .year-select { width: 120px; }
    .excel-btn { background: #1b7340; color: white; }

    .info-banner { background: #e3f2fd; border-left: 4px solid #1976d2; border-radius: 4px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; font-size: 0.9rem; }
    .info-banner a { color: #1976d2; font-weight: 600; }

    .identity-card { margin-bottom: 20px; border-left: 4px solid #1976d2; }
    .identity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .identity-grid div { display: flex; flex-direction: column; }
    .lbl { font-size: 0.75rem; color: #888; text-transform: uppercase; margin-bottom: 2px; }

    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi { display: flex; align-items: center; gap: 14px; background: white; border-radius: 10px; padding: 16px 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
    .kpi mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .kpi-label { display: block; font-size: 0.8rem; color: #666; }
    .kpi-value { display: block; font-size: 1.3rem; font-weight: 700; }
    .kpi.income mat-icon, .kpi.income .kpi-value { color: #2e7d32; }
    .kpi.expense mat-icon, .kpi.expense .kpi-value { color: #c62828; }
    .kpi.surplus mat-icon, .kpi.surplus .kpi-value { color: #1976d2; }
    .kpi.deficit mat-icon, .kpi.deficit .kpi-value { color: #e65100; }
    .kpi.neutral mat-icon { color: #546e7a; }

    .tables-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    @media (max-width: 768px) { .tables-row { grid-template-columns: 1fr; } }
    .table-card mat-card-header { display: flex; align-items: center; gap: 8px; padding-bottom: 8px; }
    .income-icon { color: #2e7d32; }
    .expense-icon { color: #c62828; }
    .full-table { width: 100%; }
    .right { text-align: right !important; }
    .income-amt { color: #2e7d32; font-weight: 500; }
    .expense-amt { color: #c62828; font-weight: 500; }
    .footer-row { background: #f5f5f5; font-weight: 700; }
    .empty { text-align: center; color: #aaa; padding: 20px; }

    .legal-card { background: #fafafa; border-left: 4px solid #78909c; }
    .legal-card mat-card-content { display: flex; align-items: flex-start; gap: 10px; }
    .legal-card mat-icon { color: #546e7a; margin-top: 2px; flex-shrink: 0; }
    .legal-card p { font-size: 0.85rem; color: #546e7a; line-height: 1.6; margin: 0; }

    .empty-state { text-align: center; padding: 60px 20px; color: #aaa; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; display: block; margin: 0 auto 16px; }
  `],
})
export class ComptesAnnuelsComponent implements OnInit {
  private txService  = inject(TransactionService);
  private exportSvc  = inject(ExportService);
  private settings   = inject(SettingsService);
  private snack      = inject(MatSnackBar);

  selectedYear = new Date().getFullYear();
  availableYears: number[] = [];
  summary: AnnualSummary | null = null;
  missingInfo = false;

  ngOnInit(): void {
    const transactions = this.txService.getAll();
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    const cur = new Date().getFullYear();
    for (let y = cur; y >= cur - 5; y--) years.add(y);
    this.availableYears = Array.from(years).sort((a, b) => b - a);
    this.loadSummary();
    this.missingInfo = !this.settings.getAsblName() || !this.settings.getBceNumber();
  }

  loadSummary(): void {
    const transactions = this.txService.getAll();
    const s = this.exportSvc.buildSummary(transactions, this.selectedYear);
    this.summary = s.transactions.length > 0 ? s : null;
  }

  exportPDF(): void {
    if (!this.summary) return;
    this.exportSvc.exportPDF(this.summary);
    this.snack.open('PDF téléchargé', 'OK', { duration: 3000 });
  }

  exportExcel(): void {
    if (!this.summary) return;
    this.exportSvc.exportExcel(this.summary);
    this.snack.open('Excel téléchargé', 'OK', { duration: 3000 });
  }
}
