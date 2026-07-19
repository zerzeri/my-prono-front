// src/app/components/auth/forgot-password.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Mot de passe oublié</h2>
        <p class="auth-subtitle">
          Indiquez votre email : nous vous enverrons un lien de réinitialisation.
        </p>

        <div *ngIf="sent" class="alert alert-success">
          Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.
          Il est valable 30 minutes.
        </div>

        <form (ngSubmit)="submit()" *ngIf="!sent">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" [(ngModel)]="email"
                   placeholder="votre@email.fr" autocomplete="username" required>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading || !email">
            {{ loading ? 'Envoi…' : 'Envoyer le lien' }}
          </button>
        </form>

        <div class="auth-links">
          <a routerLink="/login">Retour à la connexion</a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  email = '';
  sent = false;
  loading = false;

  constructor(private auth: AuthService) {}

  submit() {
    if (!this.email) return;
    this.loading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: () => { this.sent = true; this.loading = false; }
    });
  }
}
