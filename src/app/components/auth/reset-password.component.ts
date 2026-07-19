// src/app/components/auth/reset-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Nouveau mot de passe</h2>
        <p class="auth-subtitle">Choisissez votre nouveau mot de passe.</p>

        <div *ngIf="!token" class="alert alert-danger">
          Lien invalide : le jeton de réinitialisation est manquant.
        </div>
        <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
        <div *ngIf="success" class="alert alert-success">
          Mot de passe modifié ! Vous pouvez maintenant vous connecter.
        </div>

        <form (ngSubmit)="submit()" *ngIf="token && !success">
          <div class="form-group">
            <label for="password">Nouveau mot de passe (6 caractères min.)</label>
            <input type="password" id="password" name="password" [(ngModel)]="password"
                   placeholder="••••••••" autocomplete="new-password" required>
          </div>
          <div class="form-group">
            <label for="confirm">Confirmer le mot de passe</label>
            <input type="password" id="confirm" name="confirm" [(ngModel)]="confirm"
                   placeholder="••••••••" autocomplete="new-password" required>
          </div>
          <button type="submit" class="btn btn-primary"
                  [disabled]="loading || password.length < 6 || password !== confirm">
            {{ loading ? 'Modification…' : 'Modifier le mot de passe' }}
          </button>
        </form>

        <div class="auth-links">
          <a routerLink="/login">Retour à la connexion</a>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirm = '';
  error = '';
  success = false;
  loading = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit() {
    if (!this.token || this.password.length < 6 || this.password !== this.confirm) return;
    this.loading = true;
    this.error = '';
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.status === 400
          ? 'Lien de réinitialisation invalide ou expiré. Refaites une demande.'
          : 'Erreur lors de la réinitialisation.';
      }
    });
  }
}
