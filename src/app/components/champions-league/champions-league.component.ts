// src/app/components/champions-league/champions-league.component.ts
// Rubrique « Ligue des Champions » : phase de ligue (classement unique,
// 8 journées) puis tours à élimination directe. Contrairement aux championnats,
// cette rubrique propose les favoris (voir spec-v1.md § 3).
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Competition, CompetitionService } from '../../services/competition.service';
import { MatchesComponent } from '../matches/matches.component';
import { ClassementComponent } from '../classement/classement.component';
import { FavorisComponent } from '../favoris/favoris.component';
import { TableauFinalComponent } from '../tableau-final/tableau-final.component';
import { libellePhase, ordonnerPhases, PHASE_LIGUE } from '../../models/phase.model';

@Component({
  selector: 'app-champions-league',
  standalone: true,
  imports: [CommonModule, MatchesComponent, ClassementComponent, FavorisComponent,
    TableauFinalComponent],
  template: `
    <div class="page-header">
      <h2>{{ competition?.name || 'Ligue des Champions' }}</h2>
      <p class="subtitle">Phase de ligue puis tableau final.</p>
    </div>

    <app-favoris *ngIf="competition" [competition]="competition.code"
                 [competitionName]="competition.name"></app-favoris>

    <div class="tabs" *ngIf="competition">
      <button type="button" class="tab-btn" [class.active]="tab === 'matchs'"
              (click)="tab = 'matchs'">⚽ Matchs</button>
      <button type="button" class="tab-btn" [class.active]="tab === 'tableau'"
              (click)="tab = 'tableau'">🏆 Tableau final</button>
      <button type="button" class="tab-btn" [class.active]="tab === 'classement'"
              (click)="tab = 'classement'">📊 Phase de ligue</button>
    </div>

    <ng-container *ngIf="tab === 'matchs' && competition">
      <!-- Choix du tour : phase de ligue, barrages, 8es… -->
      <div class="phase-bar" *ngIf="phases.length > 1">
        <button
          *ngFor="let p of phases"
          type="button"
          class="phase-pill"
          [class.active]="selectedPhase === p"
          (click)="selectedPhase = p">
          {{ libelle(p) }}
        </button>
      </div>

      <div *ngIf="loading" class="spinner"></div>

      <div *ngIf="!loading && phases.length === 0" class="empty-state">
        <span class="empty-icon">🏆</span>
        <p>Aucun match pour le moment. Lancez la synchronisation depuis l'administration.</p>
      </div>

      <app-matches *ngIf="selectedPhase"
                   [competition]="competition.code"
                   [phase]="selectedPhase"
                   [cloturee]="competition.cloturee"></app-matches>
    </ng-container>

    <app-tableau-final *ngIf="tab === 'tableau' && competition"
                       [competition]="competition.code"></app-tableau-final>

    <app-classement *ngIf="tab === 'classement' && competition"
                    [competition]="competition.code"></app-classement>
  `,
  styles: [`
    .tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.25rem;
    }

    .tab-btn {
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-2);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 0.6rem 0.4rem;
      cursor: pointer;
      transition: color 0.15s ease, border-color 0.15s ease;
    }

    .tab-btn:hover {
      color: var(--brand-strong);
    }

    .tab-btn.active {
      color: var(--brand-strong);
      border-bottom-color: var(--brand);
    }

    /* Sélecteur de tour : défilement horizontal sur mobile plutôt qu'un retour à la ligne */
    .phase-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      -webkit-overflow-scrolling: touch;
    }

    .phase-pill {
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      white-space: nowrap;
      color: var(--text-2);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.5rem 0.9rem;
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .phase-pill:hover {
      border-color: var(--brand);
      color: var(--brand-strong);
    }

    .phase-pill.active {
      background: var(--brand);
      border-color: var(--brand);
      color: #fff;
    }
  `]
})
export class ChampionsLeagueComponent implements OnInit {
  competition: Competition | null = null;
  phases: string[] = [];
  selectedPhase = '';
  tab: 'matchs' | 'tableau' | 'classement' = 'matchs';
  loading = true;

  constructor(
    private competitionService: CompetitionService,
    private apiService: ApiService,
    public auth: AuthService
  ) {}

  libelle = libellePhase;

  ngOnInit() {
    this.competitionService.list('CHAMPIONS_LEAGUE').subscribe({
      next: (competitions) => {
        this.competition = competitions[0] ?? null;
        if (this.competition) {
          this.chargerPhases(this.competition.code);
        } else {
          this.loading = false;
        }
      },
      error: () => this.loading = false
    });
  }

  /**
   * Les phases se déduisent des matchs présents : inutile de les coder en dur,
   * et le tableau s'étoffe naturellement au fil de la compétition.
   */
  private chargerPhases(code: string) {
    this.apiService.getAllMatches(code).subscribe({
      next: (matches) => {
        const codes = new Set<string>();
        for (const m of matches) {
          if (m.phase) {
            codes.add(m.phase);
          }
        }
        this.phases = ordonnerPhases([...codes]);
        this.selectedPhase = this.phaseCourante(matches);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  /** Phase du prochain match à venir, sinon la dernière phase disputée. */
  private phaseCourante(matches: { phase?: string; dateMatch: string }[]): string {
    const maintenant = Date.now();
    const aVenir = matches
      .filter(m => m.phase && new Date(m.dateMatch).getTime() >= maintenant)
      .sort((a, b) => new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime());
    if (aVenir.length > 0) {
      return aVenir[0].phase!;
    }
    return this.phases.length > 0 ? this.phases[this.phases.length - 1] : PHASE_LIGUE;
  }
}
