import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'contacts', loadComponent: () => import('./features/contacts/contacts.component').then(m => m.ContactsComponent) },
      { path: 'clients', redirectTo: 'contacts', pathMatch: 'full' },
      { path: 'members', redirectTo: 'contacts', pathMatch: 'full' },
      { path: 'persons', redirectTo: 'contacts', pathMatch: 'full' },
      { path: 'projects', loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent) },
      { path: 'transactions', loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent) },
      { path: 'debts', loadComponent: () => import('./features/debts/debts.component').then(m => m.DebtsComponent) },
      { path: 'budget', loadComponent: () => import('./features/budget/budget.component').then(m => m.BudgetComponent) },
      { path: 'comptes-annuels', loadComponent: () => import('./features/comptes-annuels/comptes-annuels.component').then(m => m.ComptesAnnuelsComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
