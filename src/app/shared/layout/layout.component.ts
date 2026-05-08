import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="app-shell" [class.collapsed]="!sidenavOpen()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon-wrap">
            <mat-icon>account_balance</mat-icon>
          </div>
          <div class="brand-text" *ngIf="sidenavOpen()">
            <span class="brand-name">ASBL Compta</span>
            <span class="brand-sub">Gestion financière</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label" *ngIf="sidenavOpen()">Principal</div>
          <a *ngFor="let item of mainNavItems" [routerLink]="item.route" routerLinkActive="active" class="nav-link" [matTooltip]="!sidenavOpen() ? item.label : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label" *ngIf="sidenavOpen()">{{ item.label }}</span>
            <span class="active-dot" *ngIf="sidenavOpen()"></span>
          </a>

          <div class="nav-section-label" style="margin-top:8px" *ngIf="sidenavOpen()">Finance</div>
          <a *ngFor="let item of financeNavItems" [routerLink]="item.route" routerLinkActive="active" class="nav-link" [matTooltip]="!sidenavOpen() ? item.label : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label" *ngIf="sidenavOpen()">{{ item.label }}</span>
            <span class="active-dot" *ngIf="sidenavOpen()"></span>
          </a>

          <div class="nav-section-label" style="margin-top:8px" *ngIf="sidenavOpen()">Organisation</div>
          <a *ngFor="let item of orgNavItems" [routerLink]="item.route" routerLinkActive="active" class="nav-link" [matTooltip]="!sidenavOpen() ? item.label : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label" *ngIf="sidenavOpen()">{{ item.label }}</span>
            <span class="active-dot" *ngIf="sidenavOpen()"></span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a [routerLink]="'/settings'" routerLinkActive="active" class="nav-link" [matTooltip]="!sidenavOpen() ? 'Paramètres' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">settings</mat-icon>
            <span class="nav-label" *ngIf="sidenavOpen()">Paramètres</span>
          </a>
          <button class="nav-link logout-btn" (click)="logout()" [matTooltip]="!sidenavOpen() ? 'Déconnexion' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">logout</mat-icon>
            <span class="nav-label" *ngIf="sidenavOpen()">Déconnexion</span>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-area">
        <header class="topbar">
          <button class="menu-btn" (click)="toggleSidenav()">
            <mat-icon>{{ sidenavOpen() ? 'menu_open' : 'menu' }}</mat-icon>
          </button>
          <div class="topbar-title">
            <h2>{{ getPageTitle() }}</h2>
          </div>
          <div class="topbar-right">
            <div class="user-chip">
              <div class="user-avatar">{{ getInitials() }}</div>
              <span *ngIf="sidenavOpen()">{{ auth.currentUser()?.displayName }}</span>
            </div>
          </div>
        </header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
        <!-- FAB enregistrer une transaction -->
        <div class="fab-container">
          <button class="fab-btn expense" (click)="quickTransaction('expense')" matTooltip="Enregistrer une dépense" matTooltipPosition="left">
            <mat-icon>remove</mat-icon>
          </button>
          <button class="fab-btn income" (click)="quickTransaction('income')" matTooltip="Enregistrer un revenu" matTooltipPosition="left">
            <mat-icon>add</mat-icon>
          </button>
          <div class="fab-label">Transaction</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #f8f9fc;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 256px;
      min-width: 256px;
      background: #0d1117;
      display: flex;
      flex-direction: column;
      transition: all 0.25s cubic-bezier(.4,0,.2,1);
      overflow: hidden;
      z-index: 100;
    }
    .app-shell.collapsed .sidebar {
      width: 68px;
      min-width: 68px;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      min-height: 72px;
    }
    .brand-icon-wrap {
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #4f6ef7, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { color: #fff; font-size: 20px; width: 20px; height: 20px; }
    }
    .brand-name { display: block; font-size: 14px; font-weight: 700; color: #fff; }
    .brand-sub  { display: block; font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px; }

    .sidebar-nav {
      flex: 1;
      padding: 16px 10px 0;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .nav-section-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.25);
      padding: 0 8px;
      margin-bottom: 4px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 8px;
      margin-bottom: 2px;
      color: rgba(255,255,255,0.55);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      position: relative;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;

      &:hover {
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.85);
        .nav-icon { color: rgba(255,255,255,0.85); }
      }
      &.active {
        background: rgba(79,110,247,0.18);
        color: #7da3ff;
        .nav-icon { color: #7da3ff; }
        &::before {
          content: '';
          position: absolute;
          left: 0; top: 6px; bottom: 6px;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: #4f6ef7;
        }
      }
    }
    .nav-icon {
      font-size: 18px; width: 18px; height: 18px;
      flex-shrink: 0;
      color: rgba(255,255,255,0.35);
    }
    .nav-label { flex: 1; }
    .logout-btn { color: rgba(239,68,68,0.55); .nav-icon { color: rgba(239,68,68,0.5); } &:hover { background: rgba(239,68,68,0.1); color: #ef4444; .nav-icon { color: #ef4444; } } }

    .sidebar-footer {
      padding: 10px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    /* ── Main ── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .topbar {
      height: 60px;
      min-height: 60px;
      background: #fff;
      border-bottom: 1px solid #e8ecf4;
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 12px;
      box-shadow: 0 1px 0 #e8ecf4;
    }
    .menu-btn {
      width: 36px; height: 36px;
      border-radius: 8px;
      background: none;
      border: 1px solid #e8ecf4;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      color: #6b7280;
      &:hover { background: #f3f4f6; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .topbar-title h2 {
      font-size: 15px;
      font-weight: 600;
      color: #0d1117;
      letter-spacing: -0.2px;
    }
    .topbar-right { margin-left: auto; }
    .user-chip {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 12px 5px 5px;
      border-radius: 999px;
      background: #f3f4f6;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }
    .user-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f6ef7, #7c3aed);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 28px 28px;
    }

    /* ── FAB ── */
    .fab-container {
      position: fixed;
      bottom: 28px;
      right: 28px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      z-index: 200;
    }
    .fab-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #9ca3af;
      text-align: right;
    }
    .fab-btn {
      width: 48px; height: 48px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      transition: transform 0.15s, box-shadow 0.15s;
      mat-icon { font-size: 22px; width: 22px; height: 22px; color: #fff; }
      &:hover { transform: scale(1.08); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }
      &.income  { background: linear-gradient(135deg, #10b981, #059669); }
      &.expense { background: linear-gradient(135deg, #ef4444, #dc2626); }
    }
  `]
})
export class LayoutComponent {
  sidenavOpen = signal(true);

  mainNavItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
  ];
  financeNavItems: NavItem[] = [
    { label: 'Transactions', icon: 'swap_horiz', route: '/transactions' },
    { label: 'Dettes & Créances', icon: 'account_balance_wallet', route: '/debts' },
    { label: 'Budget', icon: 'bar_chart', route: '/budget' },
  ];
  orgNavItems: NavItem[] = [
    { label: 'Contacts', icon: 'contacts', route: '/contacts' },
    { label: 'Projets', icon: 'folder_special', route: '/projects' },
  ];

  get navItems(): NavItem[] {
    return [...this.mainNavItems, ...this.financeNavItems, ...this.orgNavItems];
  }

  constructor(public auth: AuthService, private router: Router) {}

  toggleSidenav(): void { this.sidenavOpen.update(v => !v); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getPageTitle(): string {
    const url = this.router.url;
    const found = this.navItems.find(n => n.route === url.split('?')[0]);
    if (found) return found.label;
    if (url.includes('settings')) return 'Paramètres';
    return 'ASBL Comptabilité';
  }

  getInitials(): string {
    const name = this.auth.currentUser()?.displayName ?? 'Admin';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  quickTransaction(type: 'income' | 'expense'): void {
    this.router.navigate(['/transactions'], { queryParams: { new: type } });
  }
}
