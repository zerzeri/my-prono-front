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
                   placeholder="votre@email.fr" autocomplete="username" required>
          </div>
          <div class="form-group">
            <label for="password">Mot de passe (6 caractères min.)</label>
            <input type="password" id="password" name="password" [(ngModel)]="password"
                   placeholder="••••••••" autocomplete="new-password" required>
          </div>
          <div class="form-group">
            <label for="confirm">Confirmer le mot de passe</label>
            <input type="password" id="confirm" name="confirm" [(ngModel)]="confirm"
                   placeholder="••••••••" autocomplete="new-password" required>
          </div>
          <button type="submit" class="btn btn-primary"
                  [disabled]="loading || !email || password.length < 6 || password !== confirm">
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
  password = '';
  confirm = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.email || this.password.length < 6 || this.password !== this.confirm) return;
    this.loading = true;
    this.error = '';
    this.auth.register(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/matches']),
      error: (err) => {
        this.loading = false;
        if (err.status === 409) {
          this.error = 'Un compte existe déjà avec cet email.';
        } else if (err.status === 400) {
          this.error = 'Email invalide ou mot de passe trop court (6 caractères minimum).';
        } else {
          this.error = 'Erreur lors de la création du compte.';
        }
      }
    });
  }
}
