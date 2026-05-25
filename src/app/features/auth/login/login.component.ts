import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="login-page">
      <!-- Left panel -->
      <div class="login-left">
        <div class="left-content">
          <div class="left-logo">
            <mat-icon>account_balance</mat-icon>
          </div>
          <h1>ASBL<br>Comptabilité</h1>
          <p>Gérez vos finances associatives avec clarté et efficacité.</p>
          <div class="feature-list">
            <div class="feature-item"><mat-icon>check_circle</mat-icon><span>Suivi des transactions</span></div>
            <div class="feature-item"><mat-icon>check_circle</mat-icon><span>Gestion des dettes et créances</span></div>
            <div class="feature-item"><mat-icon>check_circle</mat-icon><span>Budgets annuels & projets</span></div>
            <div class="feature-item"><mat-icon>check_circle</mat-icon><span>Rapports et statistiques</span></div>
          </div>
        </div>
        <div class="left-deco"></div>
      </div>

      <!-- Right panel -->
      <div class="login-right">
        <div class="login-form-wrap">
          <div class="form-header">
            <h2>Bon retour 👋</h2>
            <p>Connectez-vous pour accéder à votre espace</p>
          </div>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form-body">
            <div class="field-group">
              <label>Nom d'utilisateur</label>
              <div class="input-wrap" [class.error]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
                <mat-icon>person_outline</mat-icon>
                <input formControlName="username" placeholder="admin" autocomplete="username">
              </div>
            </div>
            <div class="field-group">
              <label>Mot de passe</label>
              <div class="input-wrap" [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                <mat-icon>lock_outline</mat-icon>
                <input [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="••••••••" autocomplete="current-password">
                <button type="button" class="toggle-pw" (click)="hidePassword = !hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>
            <div class="error-banner" *ngIf="loginError">
              <mat-icon>error_outline</mat-icon>
              <span>Identifiants incorrects. Veuillez réessayer.</span>
            </div>
            <button type="submit" class="submit-btn" [disabled]="loginForm.invalid">
              <span>Se connecter</span>
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </form>
          <div class="hint-box">
            <mat-icon>info_outline</mat-icon>
            <span>Compte par défaut : <strong>admin</strong> / <strong>admin123</strong></span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      height: 100vh;
      font-family: 'Inter', 'Roboto', sans-serif;
    }

    /* ── Left ── */
    .login-left {
      width: 45%;
      background: linear-gradient(150deg, #0d1117 0%, #161b22 60%, #1a2035 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 48px;
    }
    .left-content {
      position: relative;
      z-index: 1;
    }
    .left-logo {
      width: 56px; height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #4f6ef7, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 28px;
      mat-icon { color: #fff; font-size: 26px; width: 26px; height: 26px; }
    }
    .left-content h1 {
      font-size: 2.8rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.15;
      letter-spacing: -1px;
      margin-bottom: 16px;
    }
    .left-content > p {
      color: rgba(255,255,255,0.5);
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 36px;
      max-width: 340px;
    }
    .feature-list { display: flex; flex-direction: column; gap: 12px; }
    .feature-item {
      display: flex; align-items: center; gap: 10px;
      color: rgba(255,255,255,0.7);
      font-size: 14px;
      mat-icon { color: #4f6ef7; font-size: 18px; width: 18px; height: 18px; }
    }
    .left-deco {
      position: absolute;
      width: 400px; height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79,110,247,0.12), transparent 70%);
      bottom: -100px; right: -80px;
    }

    /* ── Right ── */
    .login-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fc;
      padding: 40px;
    }
    .login-form-wrap {
      width: 100%;
      max-width: 400px;
    }
    .form-header {
      margin-bottom: 32px;
      h2 { font-size: 1.75rem; font-weight: 700; color: #0d1117; letter-spacing: -0.5px; }
      p  { font-size: 14px; color: #6b7280; margin-top: 6px; }
    }
    .form-body { display: flex; flex-direction: column; gap: 20px; }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      label { font-size: 13px; font-weight: 600; color: #374151; }
    }
    .input-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff;
      border: 1.5px solid #e8ecf4;
      border-radius: 10px;
      padding: 0 12px;
      height: 48px;
      transition: border-color 0.15s;
      &:focus-within { border-color: #4f6ef7; box-shadow: 0 0 0 3px rgba(79,110,247,0.1); }
      &.error { border-color: #ef4444; }
      mat-icon { color: #9ca3af; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      input {
        flex: 1;
        border: none;
        outline: none;
        background: none;
        font-size: 14px;
        color: #0d1117;
        font-family: 'Inter', 'Roboto', sans-serif;
        &::placeholder { color: #d1d5db; }
      }
    }
    .toggle-pw {
      background: none; border: none; cursor: pointer; padding: 4px;
      color: #9ca3af;
      display: flex; align-items: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { color: #6b7280; }
    }
    .error-banner {
      display: flex; align-items: center; gap: 8px;
      background: #fee2e2;
      border-radius: 8px;
      padding: 10px 14px;
      color: #dc2626;
      font-size: 13px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .submit-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      height: 48px;
      background: linear-gradient(135deg, #4f6ef7, #6d3af5);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 4px;
      transition: opacity 0.15s, transform 0.1s;
      font-family: 'Inter', 'Roboto', sans-serif;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .hint-box {
      display: flex; align-items: center; gap: 8px;
      margin-top: 24px;
      padding: 12px 16px;
      background: #f0f4ff;
      border-radius: 10px;
      font-size: 13px;
      color: #4f6ef7;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    @media (max-width: 768px) {
      .login-left { display: none; }
      .login-right { background: #fff; }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  loginError = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    if (this.auth.isLoggedIn()) this.router.navigate(['/']);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    const { username, password } = this.loginForm.value;
    this.auth.login(username, password).then(success => {
      if (success) {
        this.loginError = false;
        this.router.navigate(['/']);
      } else {
        this.loginError = true;
      }
    });
  }
}
