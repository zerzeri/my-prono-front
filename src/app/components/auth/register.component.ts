// src/app/components/auth/register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Créer un compte</h2>
        <p class="auth-subtitle">Rejoignez My Prono et défiez vos amis.</p>

        <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" [(ngModel)]="email"
                   placeholder="votre@email.fr" autocomplete="email" required>
          </div>
          <div class="form-group">
            <label for="username">Nom d'utilisateur</label>
            <input type="text" id="username" name="username" [(ngModel)]="username"
                   placeholder="Ex : nabil06" autocomplete="username" required>
            <p class="field-hint">3 à 20 caractères : lettres, chiffres, . _ -</p>
          </div>
          <div class="form-group">
            <label for="password">Mot de passe (6 caractères min.)</label>
            <div class="password-field">
              <input [type]="showPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="password"
                     placeholder="••••••••" autocomplete="new-password" required>
              <button type="button" class="toggle-eye" (click)="showPassword = !showPassword"
                      [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="confirm">Confirmer le mot de passe</label>
            <div class="password-field">
              <input [type]="showConfirm ? 'text' : 'password'" id="confirm" name="confirm" [(ngModel)]="confirm"
                     placeholder="••••••••" autocomplete="new-password" required>
              <button type="button" class="toggle-eye" (click)="showConfirm = !showConfirm"
                      [attr.aria-label]="showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                {{ showConfirm ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary"
                  [disabled]="loading || !email || !username || password.length < 6 || password !== confirm">
            {{ loading ? 'Création…' : 'Créer mon compte' }}
          </button>
        </form>

        <div *ngIf="password && confirm && password !== confirm" class="alert alert-warning" style="margin-top: 1rem">
          Les mots de passe ne correspondent pas.
        </div>

        <div class="auth-links">
          <span>Déjà un compte ?</span>
          <a routerLink="/login">Se connecter</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  email = '';
  username = '';
  password = '';
  confirm = '';
  error = '';
  loading = false;
  showPassword = false;
  showConfirm = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.email || !this.username || this.password.length < 6 || this.password !== this.confirm) return;
    this.loading = true;
    this.error = '';
    this.auth.register(this.email, this.username, this.password).subscribe({
      next: () => this.router.navigate(['/matches']),
      error: (err) => {
        this.loading = false;
        if (err.status === 409) {
          this.error = err.error?.detail?.includes('utilisateur')
            ? 'Ce nom d\'utilisateur est déjà pris.'
            : 'Un compte existe déjà avec cet email.';
        } else if (err.status === 400) {
          this.error = 'Champs invalides : vérifiez l\'email, le nom d\'utilisateur (3-20 caractères) et le mot de passe (6 min).';
        } else {
          this.error = 'Erreur lors de la création du compte.';
        }
      }
    });
  }
}
