// app.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <h1 class="nav-title">My Pronostic</h1>
        <ul class="nav-menu">
          <li class="nav-item">
            <a routerLink="/matches" routerLinkActive="active" class="nav-link">Matchs</a>
          </li>
          <li class="nav-item" *ngIf="isAdmin">
            <a routerLink="/admin" routerLinkActive="active" class="nav-link">Administration</a>
          </li>
          <li class="nav-item">
            <button (click)="toggleAdmin()" class="admin-toggle">
              {{ isAdmin ? 'Mode User' : 'Mode Admin' }}
            </button>
          </li>
        </ul>
      </div>
    </nav>
    
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar {
      background-color: #2c3e50;
      color: white;
      padding: 1rem 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
    }
    
    .nav-title {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .nav-menu {
      list-style: none;
      display: flex;
      gap: 2rem;
      margin: 0;
      padding: 0;
      align-items: center;
    }
    
    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    
    .nav-link:hover,
    .nav-link.active {
      background-color: #34495e;
    }
    
    .admin-toggle {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.3s;
    }
    
    .admin-toggle:hover {
      background-color: #2980b9;
    }
    
    .main-content {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 2rem;
    }
  `]
})
export class AppComponent {
  title = 'my-pronostic-frontend';
  isAdmin = false;
  
  toggleAdmin() {
    this.isAdmin = !this.isAdmin;
    // Dans une vraie application, vous géreriez l'authentification ici
  }
}