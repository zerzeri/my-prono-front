// app.routes.ts
import { Routes } from '@angular/router';

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
    loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent)
  }
];