import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { SettingsService } from './settings.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface AnnualSummary {
  year: number;
  asblName: string;
  bceNumber: string;
  address: string;
  incomeByCategory: { category: string; total: number }[];
  expenseByCategory: { category: string; total: number }[];
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  transactions: Transaction[];
}

@Injectable({ providedIn: 'root' })
export class ExportService {

  constructor(private settings: SettingsService) {}

  buildSummary(transactions: Transaction[], year: number): AnnualSummary {
    const filtered = transactions.filter(t => new Date(t.date).getFullYear() === year);

    const incomes  = filtered.filter(t => t.type === 'income');
    const expenses = filtered.filter(t => t.type === 'expense');

    const groupBy = (txs: Transaction[]) => {
      const map = new Map<string, number>();
      for (const t of txs) {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
      }
      return Array.from(map.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
    };

    const totalIncome  = incomes.reduce((s, t) => s + t.amount, 0);
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

    return {
      year,
      asblName:   this.settings.getAsblName(),
      bceNumber:  this.settings.getBceNumber(),
      address:    this.settings.getAsblAddress(),
      incomeByCategory:  groupBy(incomes),
      expenseByCategory: groupBy(expenses),
      totalIncome,
      totalExpense,
      netResult: totalIncome - totalExpense,
      transactions: filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────

  exportPDF(summary: AnnualSummary): void {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    // ── En-tête ─────────────────────────────────────────────────────────────
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPTES ANNUELS – ASBL', pageW / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Comptabilité simplifiée – AR du 26 juin 2003`, pageW / 2, 20, { align: 'center' });
    doc.text(`Exercice ${summary.year}`, pageW / 2, 26, { align: 'center' });

    y = 36;
    doc.setTextColor(40, 40, 40);

    // ── Identité ASBL ────────────────────────────────────────────────────────
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('IDENTIFICATION DE L\'ASSOCIATION', 14, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Dénomination : ${summary.asblName || '(à compléter dans Paramètres)'}`, 14, y); y += 5;
    doc.text(`N° d'entreprise (BCE) : ${summary.bceNumber || '(à compléter dans Paramètres)'}`, 14, y); y += 5;
    doc.text(`Siège social : ${summary.address || '(à compléter dans Paramètres)'}`, 14, y); y += 5;
    doc.text(`Période comptable : 1er janvier ${summary.year} – 31 décembre ${summary.year}`, 14, y); y += 5;
    doc.text(`Document généré le : ${new Date().toLocaleDateString('fr-BE')}`, 14, y); y += 10;

    // ── Recettes ─────────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(25, 118, 210);
    doc.text('I. RECETTES', 14, y); y += 4;
    doc.setTextColor(40, 40, 40);

    autoTable(doc, {
      startY: y,
      head: [['Rubrique', 'Montant (€)']],
      body: [
        ...summary.incomeByCategory.map(r => [r.category, this.fmt(r.total)]),
        [{ content: 'TOTAL DES RECETTES', styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } },
         { content: this.fmt(summary.totalIncome), styles: { fontStyle: 'bold', fillColor: [232, 245, 233], halign: 'right' } }],
      ],
      columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
      headStyles: { fillColor: [25, 118, 210] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Dépenses ─────────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(211, 47, 47);
    doc.text('II. DÉPENSES', 14, y); y += 4;
    doc.setTextColor(40, 40, 40);

    autoTable(doc, {
      startY: y,
      head: [['Rubrique', 'Montant (€)']],
      body: [
        ...summary.expenseByCategory.map(r => [r.category, this.fmt(r.total)]),
        [{ content: 'TOTAL DES DÉPENSES', styles: { fontStyle: 'bold', fillColor: [255, 235, 238] } },
         { content: this.fmt(summary.totalExpense), styles: { fontStyle: 'bold', fillColor: [255, 235, 238], halign: 'right' } }],
      ],
      columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
      headStyles: { fillColor: [211, 47, 47] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Résultat ─────────────────────────────────────────────────────────────
    const resultColor: [number, number, number] = summary.netResult >= 0 ? [25, 118, 210] : [211, 47, 47];
    autoTable(doc, {
      startY: y,
      head: [['RÉSULTAT DE L\'EXERCICE (Recettes – Dépenses)', 'Montant (€)']],
      body: [[
        summary.netResult >= 0 ? 'Excédent' : 'Déficit',
        this.fmt(Math.abs(summary.netResult)),
      ]],
      columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
      headStyles: { fillColor: resultColor },
      bodyStyles: { fontStyle: 'bold' },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 14;

    // ── Mention légale ────────────────────────────────────────────────────────
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    const mention = [
      'Document établi conformément à la loi du 27 juin 1921 sur les ASBL, les AISBL et les fondations,',
      'et à l\'arrêté royal du 26 juin 2003 relatif à la comptabilité simplifiée de certaines ASBL.',
      'À déposer à la Banque Nationale de Belgique dans les 30 jours suivant l\'approbation par l\'AG.',
    ];
    mention.forEach(line => { doc.text(line, 14, y); y += 4; });

    // ── Page 2 : détail des transactions ─────────────────────────────────────
    doc.addPage();
    y = 15;
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`DÉTAIL DES TRANSACTIONS – Exercice ${summary.year}`, 14, y); y += 8;

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Titre', 'Catégorie', 'Montant (€)']],
      body: summary.transactions.map(t => [
        new Date(t.date).toLocaleDateString('fr-BE'),
        t.type === 'income' ? 'Recette' : 'Dépense',
        t.title,
        t.category,
        this.fmt(t.amount),
      ]),
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 20 },
        4: { halign: 'right', cellWidth: 28 },
      },
      headStyles: { fillColor: [55, 71, 79] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    doc.save(`comptes-annuels-${summary.year}.pdf`);
  }

  // ─── Excel ────────────────────────────────────────────────────────────────

  exportExcel(summary: AnnualSummary): void {
    const wb = XLSX.utils.book_new();
    const fmt = (n: number) => Math.round(n * 100) / 100;

    // ── Feuille 1 : Synthèse ──────────────────────────────────────────────
    const synthData: any[][] = [
      [`COMPTES ANNUELS – ${summary.asblName || 'ASBL'} – Exercice ${summary.year}`],
      [],
      ['IDENTIFICATION'],
      ['Dénomination', summary.asblName],
      ['N° BCE', summary.bceNumber],
      ['Siège social', summary.address],
      ['Exercice', `01/01/${summary.year} – 31/12/${summary.year}`],
      ['Généré le', new Date().toLocaleDateString('fr-BE')],
      [],
      ['I. RECETTES', '', 'Montant (€)'],
      ...summary.incomeByCategory.map(r => ['', r.category, fmt(r.total)]),
      ['', 'TOTAL RECETTES', fmt(summary.totalIncome)],
      [],
      ['II. DÉPENSES', '', 'Montant (€)'],
      ...summary.expenseByCategory.map(r => ['', r.category, fmt(r.total)]),
      ['', 'TOTAL DÉPENSES', fmt(summary.totalExpense)],
      [],
      ['RÉSULTAT (Recettes – Dépenses)', '', fmt(summary.netResult)],
      [summary.netResult >= 0 ? 'Excédent' : 'Déficit', '', fmt(Math.abs(summary.netResult))],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(synthData);
    ws1['!cols'] = [{ wch: 35 }, { wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Synthèse');

    // ── Feuille 2 : Détail transactions ───────────────────────────────────
    const txData: any[][] = [
      ['Date', 'Type', 'Titre', 'Description', 'Catégorie', 'Projet', 'Montant (€)'],
      ...summary.transactions.map(t => [
        new Date(t.date).toLocaleDateString('fr-BE'),
        t.type === 'income' ? 'Recette' : 'Dépense',
        t.title,
        t.description ?? '',
        t.category,
        t.projectId ?? '',
        fmt(t.amount),
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(txData);
    ws2['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 35 }, { wch: 22 }, { wch: 20 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Transactions');

    // ── Feuille 3 : Recettes par catégorie ────────────────────────────────
    const incData: any[][] = [
      [`RECETTES ${summary.year}`],
      ['Catégorie', 'Montant (€)'],
      ...summary.incomeByCategory.map(r => [r.category, fmt(r.total)]),
      ['TOTAL', fmt(summary.totalIncome)],
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(incData);
    ws3['!cols'] = [{ wch: 30 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Recettes');

    // ── Feuille 4 : Dépenses par catégorie ───────────────────────────────
    const expData: any[][] = [
      [`DÉPENSES ${summary.year}`],
      ['Catégorie', 'Montant (€)'],
      ...summary.expenseByCategory.map(r => [r.category, fmt(r.total)]),
      ['TOTAL', fmt(summary.totalExpense)],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(expData);
    ws4['!cols'] = [{ wch: 30 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Dépenses');

    XLSX.writeFile(wb, `comptes-annuels-${summary.year}.xlsx`);
  }

  private fmt(n: number): string {
    return n.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
}
