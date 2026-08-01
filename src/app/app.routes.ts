// app.routes.ts
import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './guards/auth.guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/championnats',
    pathMatch: 'full'
  },
  // Rubrique Championnats : Ligue 1, Premier League… (matchs + classement)
  {
    path: 'championnats',
    canActivate: [authGuard],
    loadComponent: () => import('./components/championnats/championnats.component').then(m => m.ChampionnatsComponent)
  },
  // Rubrique Ligue des Champions : phase de ligue puis tours à élimination directe
  {
    path: 'champions-league',
    canActivate: [authGuard],
    loadComponent: () => import('./components/champions-league/champions-league.component').then(m => m.ChampionsLeagueComponent)
  },
  // Rubrique Coupes internationales : poules puis tableau final
  {
    path: 'coupes',
    canActivate: [authGuard],
    loadComponent: () => import('./components/coupes/coupes.component').then(m => m.CoupesComponent)
  },
  // Anciennes adresses, conservées pour les liens déjà partagés
  {
    path: 'matches',
    redirectTo: '/championnats',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/auth/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/auth/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./components/account/account.component').then(m => m.AccountComponent)
  },
  {
    path: 'regles',
    loadComponent: () => import('./components/regles/regles.component').then(m => m.ReglesComponent)
  },
  {
    path: 'classement',
    redirectTo: '/championnats',
    pathMatch: 'full'
  },
  {
    path: 'ligues',
    canActivate: [authGuard],
    loadComponent: () => import('./components/ligues/ligues.component').then(m => m.LiguesComponent)
  },
  {
    path: 'ligues/rejoindre',
    canActivate: [authGuard],
    loadComponent: () => import('./components/ligues/rejoindre.component').then(m => m.RejoindreLigueComponent)
  }
];
