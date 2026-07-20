// src/app/components/account/account.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserInfo } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Mon compte</h2>
      <p class="subtitle">
        <span class="badge" [class.badge-finished]="auth.isAdmin" [class.badge-upcoming]="!auth.isAdmin">
          {{ auth.isAdmin ? 'Administrateur' : 'Utilisateur' }}
        </span>
      </p>
    </div>

    <div *ngIf="loading" class="spinner"></div>

    <div class="account-grid" *ngIf="!loading && info">
      <!-- Profil -->
      <div class="card section">
        <h3>Mon profil</h3>

        <div class="info-row">
          <label>Identifiant (email)</label>
          <div class="info-value">{{ info.email }}</div>
        </div>

        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <div class="inline-edit">
            <input type="text" id="username" name="username" [(ngModel)]="username"
                   placeholder="Votre pseudo">
            <button type="button" class="btn btn-primary btn-sm"
                    (click)="saveUsername()"
                    [disabled]="savingUsername || !username.trim() || username === info.username">
              {{ savingUsername ? '…' : 'Enregistrer' }}
            </button>
          </div>
          <p class="field-hint">3 à 20 caractères : lettres, chiffres, . _ -</p>
        </div>

        <div class="info-row">
          <label>Mot de passe (crypté)</label>
          <div class="hash-box">
            <code>{{ showHash ? info.passwordHash : masked }}</code>
            <button type="button" class="toggle-hash" (click)="showHash = !showHash">
              {{ showHash ? '🙈' : '👁️' }}
            </button>
          </div>
          <p class="field-hint">Stocké chiffré (BCrypt) — impossible à lire en clair, même par l'administrateur.</p>
        </div>
      </div>

      <!-- Mot de passe -->
      <div class="card section">
        <h3>Changer mon mot de passe</h3>
        <form (ngSubmit)="submitPassword()">
          <div class="form-group">
            <label for="current">Mot de passe actuel</label>
            <input type="password" id="current" name="current" [(ngModel)]="current"
                   placeholder="••••••••" autocomplete="current-password" required>
          </div>
          <div class="form-group">
            <label for="password">Nouveau mot de passe</label>
            <div class="password-field">
              <input [type]="showPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="password"
                     placeholder="••••••••" autocomplete="new-password" required>
              <button type="button" class="toggle-eye" (click)="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="confirm">Confirmer le nouveau mot de passe</label>
            <input type="password" id="confirm" name="confirm" [(ngModel)]="confirm"
                   placeholder="••••••••" autocomplete="new-password" required>
          </div>
          <button type="submit" class="btn btn-primary"
                  [disabled]="savingPassword || !current || password.length < 6 || password !== confirm">
            {{ savingPassword ? 'Modification…' : 'Modifier le mot de passe' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .account-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
      gap: 1.25rem;
      align-items: start;
    }

    .section {
      padding: 1.5rem;
    }

    .section h3 {
      font-size: 1.1rem;
      margin-bottom: 1.25rem;
    }

    .info-row {
      margin-bottom: 1.25rem;
    }

    .info-value {
      font-weight: 600;
      color: var(--text);
      overflow-wrap: anywhere;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .inline-edit {
      display: flex;
      gap: 0.5rem;
    }

    .inline-edit input {
      flex: 1;
      min-width: 0;
    }

    .hash-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.5rem 0.6rem;
    }

    .hash-box code {
      flex: 1;
      font-size: 0.78rem;
      color: var(--text-2);
      overflow-wrap: anywhere;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .toggle-hash {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      flex-shrink: 0;
    }
  `]
})
export class AccountComponent implements OnInit {
  info: UserInfo | null = null;
  username = '';
  loading = true;
  showHash = false;

  current = '';
  password = '';
  confirm = '';
  showPassword = false;
  savingUsername = false;
  savingPassword = false;

  get masked(): string {
    return '•'.repeat(Math.min(this.info?.passwordHash.length ?? 24, 40));
  }

  constructor(public auth: AuthService, private toast: ToastService) {}

  ngOnInit() {
    this.auth.getMe().subscribe({
      next: (info) => {
        this.info = info;
        this.username = info.username;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger votre profil.');
      }
    });
  }

  saveUsername() {
    const value = this.username.trim();
    if (!value || value === this.info?.username) return;
    this.savingUsername = true;
    this.auth.changeUsername(value).subscribe({
      next: (info) => {
        this.info = info;
        this.username = info.username;
        this.savingUsername = false;
        this.toast.success('Nom d\'utilisateur modifié.');
      },
      error: (err) => {
        this.savingUsername = false;
        this.toast.error(err.status === 409
          ? 'Ce nom d\'utilisateur est déjà pris.'
          : 'Nom d\'utilisateur invalide (3 à 20 caractères).');
      }
    });
  }

  submitPassword() {
    if (!this.current || this.password.length < 6 || this.password !== this.confirm) return;
    this.savingPassword = true;
    this.auth.changePassword(this.current, this.password).subscribe({
      next: () => {
        this.savingPassword = false;
        this.current = this.password = this.confirm = '';
        this.toast.success('Mot de passe modifié avec succès.');
      },
      error: (err) => {
        this.savingPassword = false;
        this.toast.error(err.status === 400
          ? 'Mot de passe actuel incorrect.'
          : 'Erreur lors du changement de mot de passe.');
      }
    });
  }
}
