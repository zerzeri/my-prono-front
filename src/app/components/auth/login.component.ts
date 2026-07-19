// src/app/components/auth/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Connexion</h2>
        <p class="auth-subtitle">Connectez-vous pour accéder à votre compte.</p>

        <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="text" id="email" name="email" [(ngModel)]="email"
                   placeholder="votre@email.fr" autocomplete="username" required>
          </div>
          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="password-field">
              <input [type]="showPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="password"
                     placeholder="••••••••" autocomplete="current-password" required>
              <button type="button" class="toggle-eye" (click)="showPassword = !showPassword"
                      [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading || !email || !password">
            {{ loading ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>

        <div class="auth-links">
          <a routerLink="/register">Créer un compte</a>
          <a routerLink="/forgot-password">Mot de passe oublié ?</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;
  showPassword = false;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  submit() {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') ?? '/matches'),
      error: (err) => {
        this.loading = false;
        this.error = err.status === 401 ? 'Email ou mot de passe incorrect.' : 'Erreur lors de la connexion.';
      }
    });
  }
}
