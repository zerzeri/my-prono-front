// src/app/components/account/account.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Mon compte</h2>
      <p class="subtitle">
        Connecté en tant que <strong>{{ auth.user?.email }}</strong>
        <span class="badge" [class.badge-finished]="auth.isAdmin" [class.badge-upcoming]="!auth.isAdmin"
              style="margin-left: 0.5rem">
          {{ auth.isAdmin ? 'Administrateur' : 'Utilisateur' }}
        </span>
      </p>
    </div>

    <div class="auth-card" style="max-width: 480px">
      <h2 style="font-size: 1.15rem">Changer mon mot de passe</h2>
      <p class="auth-subtitle">Choisissez un nouveau mot de passe (6 caractères minimum).</p>

      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">Mot de passe modifié avec succès.</div>

      <form (ngSubmit)="submit()">
        <div class="form-group">
          <label for="current">Mot de passe actuel</label>
          <input type="password" id="current" name="current" [(ngModel)]="current"
                 placeholder="••••••••" autocomplete="current-password" required>
        </div>
        <div class="form-group">
          <label for="password">Nouveau mot de passe</label>
          <input type="password" id="password" name="password" [(ngModel)]="password"
                 placeholder="••••••••" autocomplete="new-password" required>
        </div>
        <div class="form-group">
          <label for="confirm">Confirmer le nouveau mot de passe</label>
          <input type="password" id="confirm" name="confirm" [(ngModel)]="confirm"
                 placeholder="••••••••" autocomplete="new-password" required>
        </div>
        <button type="submit" class="btn btn-primary"
                [disabled]="loading || !current || password.length < 6 || password !== confirm">
          {{ loading ? 'Modification…' : 'Modifier le mot de passe' }}
        </button>
      </form>
    </div>
  `
})
export class AccountComponent {
  current = '';
  password = '';
  confirm = '';
  error = '';
  success = false;
  loading = false;

  constructor(public auth: AuthService) {}

  submit() {
    if (!this.current || this.password.length < 6 || this.password !== this.confirm) return;
    this.loading = true;
    this.error = '';
    this.success = false;
    this.auth.changePassword(this.current, this.password).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.current = this.password = this.confirm = '';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.status === 400
          ? 'Mot de passe actuel incorrect.'
          : 'Erreur lors du changement de mot de passe.';
      }
    });
  }
}
