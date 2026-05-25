import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatDividerModule, MatSnackBarModule, MatTableModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="page">
      <h2 class="page-title">Parametres</h2>

      <!-- Informations ASBL -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>business</mat-icon>
          <mat-card-title>Informations de l'ASBL</mat-card-title>
          <mat-card-subtitle>Apparaissent dans les documents &quot;Comptes Annuels&quot;</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Dénomination de l'ASBL</mat-label>
            <input matInput [(ngModel)]="asblName" placeholder="Ex: Association XYZ ASBL">
            <mat-icon matSuffix>corporate_fare</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Numéro d'entreprise BCE</mat-label>
            <input matInput [(ngModel)]="bceNumber" placeholder="Ex: 0123.456.789">
            <mat-icon matSuffix>tag</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Siège social (adresse complète)</mat-label>
            <input matInput [(ngModel)]="asblAddress" placeholder="Ex: Rue de la Loi 1, 1000 Bruxelles">
            <mat-icon matSuffix>location_on</mat-icon>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="saveAsblInfo()">
            <mat-icon>save</mat-icon> Enregistrer
          </button>
        </mat-card-content>
      </mat-card>

      <!-- Categories -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>label</mat-icon>
          <mat-card-title>Categories de transactions</mat-card-title>
          <mat-card-subtitle>Ajoutez ou supprimez des categories</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="chips-wrap">
            <span *ngFor="let cat of categories" class="cat-chip">
              {{ cat }}
              <button class="chip-del" matTooltip="Supprimer" (click)="deleteCategory(cat)">
                <mat-icon>close</mat-icon>
              </button>
            </span>
          </div>
          <div class="add-cat-row">
            <mat-form-field appearance="outline" class="cat-input">
              <mat-label>Nouvelle categorie</mat-label>
              <input matInput [(ngModel)]="newCategoryName" (keydown.enter)="addCategory()" placeholder="Ex: Frais juridiques">
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="addCategory()" [disabled]="!newCategoryName.trim()">
              <mat-icon>add</mat-icon> Ajouter
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Taux et defraiements -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>calculate</mat-icon>
          <mat-card-title>Taux et defraiements</mat-card-title>
          <mat-card-subtitle>Baremes utilises pour les calculs automatiques</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="ratesForm" (ngSubmit)="saveRates()" class="rates-form">
            <div class="rate-row">
              <div class="rate-label">
                <mat-icon>volunteer_activism</mat-icon>
                <div>
                  <strong>Defraiement journalier benevoles</strong>
                  <small>Montant forfaitaire par jour de benevol</small>
                </div>
              </div>
              <mat-form-field appearance="outline" class="rate-field">
                <mat-label>Montant (euro/jour)</mat-label>
                <input matInput type="number" formControlName="dailyAllowance" min="0" step="0.01">
                <span matSuffix>euro/j</span>
              </mat-form-field>
            </div>
            <mat-divider></mat-divider>
            <div class="rate-row">
              <div class="rate-label">
                <mat-icon>directions_car</mat-icon>
                <div>
                  <strong>Forfait kilometrique voiture</strong>
                  <small>Remboursement par km en voiture (bareme officiel belge 2024: 0,3562 euro)</small>
                </div>
              </div>
              <mat-form-field appearance="outline" class="rate-field">
                <mat-label>Taux (euro/km)</mat-label>
                <input matInput type="number" formControlName="kmRateCar" min="0" step="0.0001">
                <span matSuffix>euro/km</span>
              </mat-form-field>
            </div>
            <mat-divider></mat-divider>
            <div class="rate-row">
              <div class="rate-label">
                <mat-icon>pedal_bike</mat-icon>
                <div>
                  <strong>Forfait kilometrique velo</strong>
                  <small>Remboursement par km a velo</small>
                </div>
              </div>
              <mat-form-field appearance="outline" class="rate-field">
                <mat-label>Taux (euro/km)</mat-label>
                <input matInput type="number" formControlName="kmRateBike" min="0" step="0.0001">
                <span matSuffix>euro/km</span>
              </mat-form-field>
            </div>
            <div class="save-rates-row">
              <button mat-raised-button color="primary" type="submit" [disabled]="ratesForm.invalid">
                <mat-icon>save</mat-icon> Enregistrer les taux
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Change password -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>lock</mat-icon>
          <mat-card-title>Changer le mot de passe</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="form">
            <mat-form-field appearance="outline">
              <mat-label>Mot de passe actuel</mat-label>
              <input matInput type="password" formControlName="currentPassword">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Nouveau mot de passe</mat-label>
              <input matInput type="password" formControlName="newPassword">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Confirmer le mot de passe</mat-label>
              <input matInput type="password" formControlName="confirmPassword">
            </mat-form-field>
            <div *ngIf="passwordError" class="error-msg"><mat-icon>error</mat-icon> {{ passwordError }}</div>
            <button mat-raised-button color="primary" type="submit" [disabled]="passwordForm.invalid">
              <mat-icon>save</mat-icon> Mettre a jour
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Users management (admin only) -->
      <mat-card class="settings-card" *ngIf="isAdmin">
        <mat-card-header>
          <mat-icon mat-card-avatar>manage_accounts</mat-icon>
          <mat-card-title>Gestion des utilisateurs</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table class="users-table" *ngIf="users.length > 0">
            <thead><tr><th>Nom d'utilisateur</th><th>Nom affiche</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let u of users">
                <td>{{ u.username }}</td>
                <td>{{ u.displayName }}</td>
                <td><span class="role-badge" [ngClass]="u.role">{{ roleLabel(u.role) }}</span></td>
                <td>
                  <button mat-icon-button color="warn" matTooltip="Supprimer" (click)="deleteUser(u)" [disabled]="u.id === currentUser?.id">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <mat-divider style="margin: 16px 0"></mat-divider>
          <h4>Ajouter un utilisateur</h4>
          <form [formGroup]="addUserForm" (ngSubmit)="addUser()" class="form">
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Nom d'utilisateur *</mat-label>
                <input matInput formControlName="username">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nom affiche *</mat-label>
                <input matInput formControlName="displayName">
              </mat-form-field>
            </div>
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Mot de passe *</mat-label>
                <input matInput type="password" formControlName="password">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="admin">Administrateur</mat-option>
                  <mat-option value="editor">Editeur</mat-option>
                  <mat-option value="viewer">Lecteur</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <button mat-raised-button color="primary" type="submit" [disabled]="addUserForm.invalid">
              <mat-icon>person_add</mat-icon> Ajouter
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Cloture d'exercice -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>lock_clock</mat-icon>
          <mat-card-title>Clôture d'exercice comptable</mat-card-title>
          <mat-card-subtitle>Un exercice clôturé ne permet plus d'enregistrer de nouvelles transactions</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="years-list">
            <div *ngFor="let year of availableYears" class="year-row">
              <div class="year-info">
                <mat-icon [style.color]="isYearClosed(year) ? '#c62828' : '#2e7d32'">{{ isYearClosed(year) ? 'lock' : 'lock_open' }}</mat-icon>
                <span class="year-label">Exercice {{ year }}</span>
                <span class="year-badge" [class.closed]="isYearClosed(year)" [class.open]="!isYearClosed(year)">
                  {{ isYearClosed(year) ? 'Clôturé' : 'Ouvert' }}
                </span>
              </div>
              <button *ngIf="!isYearClosed(year)" mat-stroked-button color="warn" (click)="closeYear(year)">
                <mat-icon>lock</mat-icon> Clôturer
              </button>
              <button *ngIf="isYearClosed(year)" mat-stroked-button color="primary" (click)="reopenYear(year)">
                <mat-icon>lock_open</mat-icon> Réouvrir
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Data management -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>storage</mat-icon>
          <mat-card-title>Gestion des donnees</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Exportez ou importez toutes les donnees de l'application.</p>
          <div class="data-actions">
            <button mat-stroked-button color="primary" (click)="exportData()">
              <mat-icon>download</mat-icon> Exporter (JSON)
            </button>
            <button mat-stroked-button color="warn" (click)="fileInput.click()">
              <mat-icon>upload</mat-icon> Importer des donnees
            </button>
            <input #fileInput type="file" hidden accept=".json" (change)="importData($event)">
            <button mat-stroked-button color="warn" (click)="clearData()">
              <mat-icon>delete_forever</mat-icon> Effacer toutes les donnees
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.8rem; font-weight: 700; color: #1a237e; margin-bottom: 24px; }
    .settings-card { border-radius: 12px !important; margin-bottom: 16px; }

    /* Categories */
    .chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; padding-top: 8px; }
    .cat-chip { display: inline-flex; align-items: center; gap: 4px; background: #e3f2fd; color: #1565c0;
      padding: 5px 10px; border-radius: 20px; font-size: 13px; font-weight: 500; }
    .chip-del { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #1565c0; opacity: 0.6;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
      &:hover { opacity: 1; }
    }
    .add-cat-row { display: flex; gap: 12px; align-items: flex-start; margin-top: 4px; }
    .cat-input { flex: 1; max-width: 400px; }

    /* Rates */
    .rates-form { display: flex; flex-direction: column; gap: 0; padding-top: 8px; }
    .rate-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 0; }
    .rate-label { display: flex; align-items: flex-start; gap: 12px;
      mat-icon { color: #4f6ef7; font-size: 28px; width: 28px; height: 28px; margin-top: 2px; }
      strong { display: block; font-size: 14px; }
      small { display: block; font-size: 12px; color: #888; margin-top: 2px; }
    }
    .rate-field { width: 200px; flex-shrink: 0; }
    .save-rates-row { display: flex; justify-content: flex-end; padding-top: 8px; }

    /* Form */
    .form { display: flex; flex-direction: column; gap: 8px; max-width: 500px; padding-top: 8px; }
    .row { display: flex; gap: 12px; mat-form-field { flex: 1; } }
    .error-msg { display: flex; align-items: center; gap: 8px; color: #c62828; background: #ffebee; padding: 8px 12px; border-radius: 8px; font-size: 13px; }
    .users-table { width: 100%; border-collapse: collapse; th, td { padding: 10px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; } th { background: #f5f5f5; font-size: 12px; text-transform: uppercase; color: #666; } }
    .role-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;
      &.admin  { background: #fce4ec; color: #c2185b; }
      &.editor { background: #e3f2fd; color: #1565c0; }
      &.viewer { background: #f3e5f5; color: #6a1b9a; }
    }
    .data-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }

    /* Year closing */
    .years-list { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
    .year-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 10px; }
    .year-info { display: flex; align-items: center; gap: 10px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .year-label { font-size: 15px; font-weight: 500; }
    .year-badge { padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
      &.open   { background: #e8f5e9; color: #2e7d32; }
      &.closed { background: #ffebee; color: #c62828; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  passwordForm!: FormGroup;
  addUserForm!: FormGroup;
  ratesForm!: FormGroup;
  users: User[] = [];
  passwordError = '';
  currentUser: User | null = null;
  categories: string[] = [];
  newCategoryName = '';
  asblName = '';
  bceNumber = '';
  asblAddress = '';
  closedYears: number[] = [];
  availableYears: number[] = [];

  get isAdmin(): boolean { return this.currentUser?.role === 'admin'; }

  constructor(
    private auth: AuthService,
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.currentUser();
    this.categories = this.settingsService.getCategories();
    this.asblName    = this.settingsService.getAsblName();
    this.bceNumber   = this.settingsService.getBceNumber();
    this.asblAddress = this.settingsService.getAsblAddress();

    this.ratesForm = this.fb.group({
      dailyAllowance: [this.settingsService.getDailyAllowance(), [Validators.required, Validators.min(0)]],
      kmRateCar:      [this.settingsService.getKmRateCar(),      [Validators.required, Validators.min(0)]],
      kmRateBike:     [this.settingsService.getKmRateBike(),     [Validators.required, Validators.min(0)]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

    this.addUserForm = this.fb.group({
      username:    ['', Validators.required],
      displayName: ['', Validators.required],
      password:    ['', [Validators.required, Validators.minLength(6)]],
      role:        ['editor', Validators.required]
    });

    this.loadUsers();

    // Années disponibles : de l'année courante -1 jusqu'à 5 ans en arrière
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);
    this.closedYears = this.settingsService.getClosedYears();
  }

  isYearClosed(year: number): boolean { return this.settingsService.isYearClosed(year); }

  closeYear(year: number): void {
    if (confirm(`Cl\u00f4turer d\u00e9finitivement l'exercice ${year} ? Aucune transaction ne pourra plus \u00eatre enregistr\u00e9e pour cette ann\u00e9e.`)) {
      this.settingsService.closeYear(year).then(() => {
        this.closedYears = this.settingsService.getClosedYears();
        this.snackBar.open(`Exercice ${year} cl\u00f4tur\u00e9`, 'Fermer', { duration: 3000 });
      });
    }
  }

  reopenYear(year: number): void {
    if (confirm(`R\u00e9ouvrir l'exercice ${year} ?`)) {
      this.settingsService.reopenYear(year).then(() => {
        this.closedYears = this.settingsService.getClosedYears();
        this.snackBar.open(`Exercice ${year} r\u00e9ouvert`, 'Fermer', { duration: 3000 });
      });
    }
  }

  loadUsers(): void { this.auth.getUsers().then((users: any[]) => this.users = users); }

  addCategory(): void {
    if (!this.newCategoryName.trim()) return;
    this.settingsService.addCategory(this.newCategoryName);
    this.categories = this.settingsService.getCategories();
    this.newCategoryName = '';
    this.snackBar.open('Categorie ajoutee', 'Fermer', { duration: 2000 });
  }

  deleteCategory(cat: string): void {
    if (confirm(`Supprimer la categorie "${cat}" ?`)) {
      this.settingsService.deleteCategory(cat);
      this.categories = this.settingsService.getCategories();
    }
  }

  saveAsblInfo(): void {
    this.settingsService.setAsblName(this.asblName.trim());
    this.settingsService.setBceNumber(this.bceNumber.trim());
    this.settingsService.setAsblAddress(this.asblAddress.trim());
    this.snackBar.open('Informations ASBL enregistrées', 'Fermer', { duration: 3000 });
  }

  saveRates(): void {
    if (this.ratesForm.invalid) return;
    const v = this.ratesForm.value;
    this.settingsService.setDailyAllowance(v.dailyAllowance);
    this.settingsService.setKmRateCar(v.kmRateCar);
    this.settingsService.setKmRateBike(v.kmRateBike);
    this.snackBar.open('Taux enregistres', 'Fermer', { duration: 3000 });
  }

  changePassword(): void {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (!this.currentUser) return;
    if (this.currentUser.password !== currentPassword) { this.passwordError = 'Mot de passe actuel incorrect'; return; }
    if (newPassword !== confirmPassword) { this.passwordError = 'Les mots de passe ne correspondent pas'; return; }
    this.auth.updateUser(this.currentUser.id, { password: newPassword });
    this.passwordError = '';
    this.passwordForm.reset();
    this.snackBar.open('Mot de passe mis a jour', 'Fermer', { duration: 3000 });
  }

  addUser(): void {
    const val = this.addUserForm.value;
    this.auth.addUser(val);
    this.addUserForm.reset({ role: 'editor' });
    this.loadUsers();
    this.snackBar.open('Utilisateur ajoute', 'Fermer', { duration: 3000 });
  }

  deleteUser(user: User): void {
    if (confirm(`Supprimer l'utilisateur "${user.username}" ?`)) {
      this.auth.deleteUser(user.id);
      this.loadUsers();
      this.snackBar.open('Utilisateur supprime', 'Fermer', { duration: 3000 });
    }
  }

  exportData(): void {
    const data: Record<string, any> = {};
    const keys = ['asbl_users', 'asbl_clients', 'asbl_projects', 'asbl_members', 'asbl_persons', 'asbl_transactions', 'asbl_debts', 'asbl_budgets', 'asbl_categories', 'asbl_daily_allowance', 'asbl_km_rate_car', 'asbl_km_rate_bike'];
    for (const key of keys) { data[key] = JSON.parse(localStorage.getItem(key) || 'null'); }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `asbl-data-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open('Donnees exportees', 'Fermer', { duration: 3000 });
  }

  importData(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        for (const [key, value] of Object.entries(data)) {
          if (value !== null) localStorage.setItem(key, JSON.stringify(value));
        }
        this.snackBar.open('Donnees importees avec succes', 'Fermer', { duration: 3000 });
        window.location.reload();
      } catch { this.snackBar.open("Erreur lors de l'importation", 'Fermer', { duration: 3000 }); }
    };
    reader.readAsText(file);
  }

  clearData(): void {
    if (confirm('Attention ! Toutes les donnees seront supprimees. Continuer ?')) {
      const keys = ['asbl_clients', 'asbl_projects', 'asbl_members', 'asbl_persons', 'asbl_transactions', 'asbl_debts', 'asbl_budgets', 'asbl_categories'];
      for (const key of keys) localStorage.removeItem(key);
      this.snackBar.open('Donnees effacees', 'Fermer', { duration: 3000 });
      window.location.reload();
    }
  }

  roleLabel(role: string): string {
    const m: Record<string, string> = { admin: 'Administrateur', editor: 'Editeur', viewer: 'Lecteur' };
    return m[role] || role;
  }
}
