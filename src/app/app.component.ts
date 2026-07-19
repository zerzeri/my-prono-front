// app.component.ts
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-inner">
        <a routerLink="/matches" class="brand">
          <span class="brand-icon">⚽</span>
          <span class="brand-name">My<em>Prono</em></span>
        </a>

        <nav class="nav">
          <a routerLink="/matches" routerLinkActive="active" class="nav-link">Matchs</a>
          <a *ngIf="(auth.user$ | async)?.role === 'ADMIN'" routerLink="/admin" routerLinkActive="active" class="nav-link">Administration</a>
        </nav>

        <ng-container *ngIf="auth.user$ | async as user; else loggedOut">
          <a routerLink="/account" routerLinkActive="active" class="admin-toggle on" title="Mon compte">
            <span class="dot"></span>
            {{ user.email }}
          </a>
          <button (click)="logout()" class="admin-toggle" title="Se déconnecter">
            Déconnexion
          </button>
        </ng-container>
        <ng-template #loggedOut>
          <a routerLink="/login" class="admin-toggle">
            <span class="dot"></span>
            Connexion
          </a>
        </ng-template>
      </div>
    </header>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <footer class="footer">
      <p>My Prono — pronostics entre amis</p>
    </footer>
  `,
  styles: [`
    .header {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--navy);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .header-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.25rem;
      height: 64px;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
    }

    .brand-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .brand-name {
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #fff;
    }

    .brand-name em {
      font-style: normal;
      color: #34d399;
    }

    .nav {
      display: flex;
      gap: 0.25rem;
      flex: 1;
    }

    .nav-link {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      transition: color 0.15s ease, background-color 0.15s ease;
    }

    .nav-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.06);
    }

    .nav-link.active {
      color: #fff;
      background: rgba(52, 211, 153, 0.15);
    }

    .admin-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.75);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 999px;
      padding: 0.45rem 0.9rem;
      cursor: pointer;
      text-decoration: none;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .admin-toggle .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      transition: background-color 0.15s ease;
    }

    .admin-toggle:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .admin-toggle.on {
      color: #34d399;
      border-color: rgba(52, 211, 153, 0.4);
      background: rgba(52, 211, 153, 0.1);
    }

    .admin-toggle.on .dot {
      background: #34d399;
      box-shadow: 0 0 6px rgba(52, 211, 153, 0.8);
    }

    .main-content {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1.25rem;
      min-height: calc(100vh - 64px - 8rem);
    }

    .footer {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--muted);
      font-size: 0.85rem;
    }

    @media (max-width: 640px) {
      .header-inner {
        gap: 1rem;
      }

      .brand-name {
        display: none;
      }
    }
  `]
})
export class AppComponent {
  title = 'my-pronostic-frontend';

  constructor(public auth: AuthService, private router: Router) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/matches']);
  }
}
