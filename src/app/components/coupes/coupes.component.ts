// src/app/components/coupes/coupes.component.ts
// Rubrique « Coupes internationales » : phase de poules puis tableau final.
// Même ossature que la Ligue des Champions, avec deux différences : la première
// phase est constituée de groupes, et les tours se jouent en manche unique.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Competition, CompetitionService } from '../../services/competition.service';
import { MatchesComponent } from '../matches/matches.component';
import { PoulesComponent } from '../poules/poules.component';
import { FavorisComponent } from '../favoris/favoris.component';
import { TableauFinalComponent } from '../tableau-final/tableau-final.component';
import { libellePhase, ordonnerPhases, PHASE_POULES } from '../../models/phase.model';

@Component({
  selector: 'app-coupes',
  standalone: true,
  imports: [CommonModule, MatchesComponent, PoulesComponent, FavorisComponent,
    TableauFinalComponent],
  template: `
    <div class="page-header">
      <h2>{{ competition?.name || 'Coupes internationales' }}</h2>
      <p class="subtitle">Phase de poules puis tableau final.</p>
    </div>

    <!-- Plusieurs coupes coexisteront : Coupe du Monde, Euro… -->
    <div class="competition-bar" *ngIf="competitions.length > 1">
      <button
        *ngFor="let c of competitions"
        type="button"
        class="competition-pill"
        [class.active]="competition?.code === c.code"
        (click)="selectCompetition(c)">
        {{ c.icone }} {{ c.name }}
      </button>
    </div>

    <app-favoris *ngIf="competition" [competition]="competition.code"
                 [competitionName]="competition.name"></app-favoris>

    <div class="tabs" *ngIf="competition">
      <button type="button" class="tab-btn" [class.active]="tab === 'matchs'"
              (click)="tab = 'matchs'">⚽ Matchs</button>
      <button type="button" class="tab-btn" [class.active]="tab === 'poules'"
              (click)="tab = 'poules'">📋 Poules</button>
      <button type="button" class="tab-btn" [class.active]="tab === 'tableau'"
              (click)="tab = 'tableau'">🏆 Tableau final</button>
    </div>

    <ng-container *ngIf="tab === 'matchs' && competition">
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
        <span class="empty-icon">🌍</span>
        <p>Aucun match pour le moment. Lancez la synchronisation depuis l'administration.</p>
      </div>

      <app-matches *ngIf="selectedPhase"
                   [competition]="competition.code"
                   [phase]="selectedPhase"></app-matches>
    </ng-container>

    <app-poules *ngIf="tab === 'poules' && competition"
                [competition]="competition.code"></app-poules>

    <app-tableau-final *ngIf="tab === 'tableau' && competition"
                       [competition]="competition.code"></app-tableau-final>
  `,
  styles: [`
    .competition-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .competition-pill {
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-2);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.5rem 0.9rem;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .competition-pill.active {
      background: var(--brand);
      border-color: var(--brand);
      color: #fff;
    }

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

    /* Sept tours possibles : défilement horizontal plutôt qu'un retour à la ligne */
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
export class CoupesComponent implements OnInit {
  competitions: Competition[] = [];
  competition: Competition | null = null;
  phases: string[] = [];
  selectedPhase = '';
  tab: 'matchs' | 'poules' | 'tableau' = 'matchs';
  loading = true;

  constructor(
    private competitionService: CompetitionService,
    private apiService: ApiService
  ) {}

  libelle = libellePhase;

  ngOnInit() {
    this.competitionService.list('COUPE_INTERNATIONALE').subscribe({
      next: (competitions) => {
        this.competitions = competitions;
        const memorisee = this.competitionService.selectedCode;
        this.competition = competitions.find(c => c.code === memorisee) ?? competitions[0] ?? null;
        if (this.competition) {
          this.chargerPhases(this.competition.code);
        } else {
          this.loading = false;
        }
      },
      error: () => this.loading = false
    });
  }

  selectCompetition(c: Competition) {
    if (c.code === this.competition?.code) {
      return;
    }
    this.competition = c;
    this.competitionService.selectedCode = c.code;
    this.chargerPhases(c.code);
  }

  /** Les phases se déduisent des matchs : le tableau s'étoffe au fil du tournoi. */
  private chargerPhases(code: string) {
    this.loading = true;
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

  /** Phase du prochain match à venir, sinon la dernière disputée. */
  private phaseCourante(matches: { phase?: string; dateMatch: string }[]): string {
    const maintenant = Date.now();
    const aVenir = matches
      .filter(m => m.phase && new Date(m.dateMatch).getTime() >= maintenant)
      .sort((a, b) => new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime());
    if (aVenir.length > 0) {
      return aVenir[0].phase!;
    }
    return this.phases.length > 0 ? this.phases[this.phases.length - 1] : PHASE_POULES;
  }
}
