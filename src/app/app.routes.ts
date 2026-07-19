// app.routes.ts
import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './guards/auth.guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/matches',
    pathMatch: 'full'
  },
  {
    path: 'matches',
    loadComponent: () => import('./components/matches/matches.component').then(m => m.MatchesComponent)
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
