// app.component.ts
import { Component, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent],
  template: `
    <header class="header">
      <div class="header-inner">
        <a routerLink="/matches" class="brand">
          <span class="brand-icon">⚽</span>
          <span class="brand-name">My<em>Prono</em></span>
        </a>

        <nav class="nav">
          <a routerLink="/matches" routerLinkActive="active" class="nav-link">Matchs</a>
          <a *ngIf="auth.user$ | async" routerLink="/ligues" routerLinkActive="active" class="nav-link">Ligues</a>
          <a *ngIf="(auth.user$ | async)?.role === 'ADMIN'" routerLink="/admin" routerLinkActive="active" class="nav-link">Administration</a>
        </nav>

        <div class="user-menu" *ngIf="auth.user$ | async as user; else loggedOut">
          <button class="admin-toggle on" [class.open]="menuOpen" (click)="toggleMenu($event)" title="Menu">
            <span class="dot"></span>
            <span class="user-name">{{ user.username || user.email }}</span>
            <span class="caret">▾</span>
          </button>
          <div class="dropdown" *ngIf="menuOpen">
            <a routerLink="/account" class="dropdown-item">👤 Profil</a>
            <a routerLink="/regles" class="dropdown-item">📖 Règles du jeu</a>
            <button type="button" class="dropdown-item danger" (click)="logout()">🚪 Déconnexion</button>
          </div>
        </div>
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

    <app-toast></app-toast>
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

    .user-menu {
      position: relative;
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
      white-space: nowrap;
      transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .user-name {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 130px;
    }

    .caret {
      font-size: 0.7rem;
      opacity: 0.8;
    }

    .admin-toggle .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      transition: background-color 0.15s ease;
      flex-shrink: 0;
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

    .dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 200px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      padding: 0.4rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      z-index: 20;
      animation: dropdown-in 0.15s ease;
    }

    @keyframes dropdown-in {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 500;
      text-align: left;
      color: var(--text);
      background: none;
      border: none;
      border-radius: 8px;
      padding: 0.6rem 0.75rem;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.12s ease;
    }

    .dropdown-item:hover {
      background: var(--surface-2);
      color: var(--text);
    }

    .dropdown-item.danger {
      color: var(--danger);
    }

    .dropdown-item.danger:hover {
      background: var(--danger-soft);
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
        height: auto;
        flex-wrap: wrap;
        gap: 0.5rem 0.75rem;
        padding: 0.6rem 1rem;
      }

      .brand {
        margin-right: auto;
      }

      .brand-icon {
        font-size: 1.3rem;
      }

      .brand-name {
        font-size: 1.05rem;
      }

      .nav {
        order: 3;
        width: 100%;
        flex: none;
      }

      .nav-link {
        padding: 0.4rem 0.75rem;
        font-size: 0.85rem;
      }

      .admin-toggle {
        max-width: 150px;
        font-size: 0.72rem;
        padding: 0.35rem 0.6rem;
        gap: 0.35rem;
      }

      .user-name {
        max-width: 80px;
      }

      .main-content {
        margin: 1.25rem auto;
      }
    }
  `]
})
export class AppComponent {
  title = 'my-pronostic-frontend';
  menuOpen = false;

  constructor(public auth: AuthService, private router: Router) {}

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  // Ferme le menu sur tout clic ailleurs (y compris sur un item, ce qui laisse la navigation se faire)
  @HostListener('document:click')
  closeMenu() {
    this.menuOpen = false;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/matches']);
  }
}
