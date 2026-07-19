// src/app/components/ligues/rejoindre.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LigueDTO, LigueService } from '../../services/ligue.service';

@Component({
  selector: 'app-rejoindre-ligue',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Rejoindre une ligue</h2>

        <div *ngIf="joining" class="spinner"></div>

        <div *ngIf="!joining && ligue" class="alert alert-success">
          🏆 Vous êtes membre de la ligue <strong>{{ ligue.name }}</strong>
          ({{ ligue.membres.length }} membre{{ ligue.membres.length > 1 ? 's' : '' }}).
        </div>

        <div *ngIf="!joining && error" class="alert alert-danger">{{ error }}</div>

        <div class="auth-links">
          <a routerLink="/ligues">Voir mes ligues</a>
          <a routerLink="/matches">Aller aux matchs</a>
        </div>
      </div>
    </div>
  `
})
export class RejoindreLigueComponent implements OnInit {
  ligue: LigueDTO | null = null;
  error = '';
  joining = true;

  constructor(private ligueService: LigueService, private route: ActivatedRoute) {}

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.joining = false;
      this.error = 'Lien invalide : le code d\'invitation est manquant.';
      return;
    }
    this.ligueService.join(code).subscribe({
      next: (ligue) => {
        this.ligue = ligue;
        this.joining = false;
      },
      error: (err) => {
        this.joining = false;
        this.error = err.status === 404
          ? 'Ce lien d\'invitation est invalide ou la ligue n\'existe plus.'
          : 'Erreur lors de la tentative pour rejoindre la ligue.';
      }
    });
  }
}
