// src/app/components/championnats/championnats.component.ts
// Rubrique « Championnats » : coquille de la section CHAMPIONNAT (Ligue 1,
// Premier League…). Elle porte le choix de la compétition et les onglets, et
// délègue l'affichage aux composants Matchs et Classement.
// Les favoris n'existent pas dans cette rubrique (voir spec-v1.md § 3).
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Competition, CompetitionService } from '../../services/competition.service';
import { MatchesComponent } from '../matches/matches.component';
import { ClassementComponent } from '../classement/classement.component';

@Component({
  selector: 'app-championnats',
  standalone: true,
  imports: [CommonModule, MatchesComponent, ClassementComponent],
  template: `
    <div class="page-header">
      <h2>Championnats</h2>
      <p class="subtitle">Pronostiquez les matchs et suivez le classement.</p>
    </div>

    <div class="competition-bar" *ngIf="competitions.length > 1">
      <button
        *ngFor="let c of competitions"
        type="button"
        class="competition-pill"
        [class.active]="selected === c.code"
        (click)="selectCompetition(c.code)">
        {{ c.icone }} {{ c.name }}
      </button>
    </div>

    <div class="tabs" *ngIf="selected">
      <button type="button" class="tab-btn" [class.active]="tab === 'matchs'"
              (click)="tab = 'matchs'">⚽ Matchs</button>
      <button type="button" class="tab-btn" [class.active]="tab === 'classement'"
              (click)="tab = 'classement'" *ngIf="selectedHasStandings">📊 Classement</button>
    </div>

    <div *ngIf="!loading && competitions.length === 0" class="empty-state">
      <span class="empty-icon">🏟️</span>
      <p>Aucun championnat disponible.</p>
    </div>

    <app-matches *ngIf="selected && tab === 'matchs'" [competition]="selected"
                 [cloturee]="selectedCloturee"></app-matches>
    <app-classement *ngIf="selected && tab === 'classement'" [competition]="selected"></app-classement>
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

    .competition-pill:hover {
      border-color: var(--brand);
      color: var(--brand-strong);
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
  `]
})
export class ChampionnatsComponent implements OnInit {
  competitions: Competition[] = [];
  selected = '';
  tab: 'matchs' | 'classement' = 'matchs';
  loading = true;

  constructor(private competitionService: CompetitionService) {}

  get selectedHasStandings(): boolean {
    return this.competitions.find(c => c.code === this.selected)?.hasStandings ?? false;
  }

  /** Un championnat terminé passe en archive : consultable, non pronostiquable. */
  get selectedCloturee(): boolean {
    return this.competitions.find(c => c.code === this.selected)?.cloturee ?? false;
  }

  ngOnInit() {
    this.competitionService.list('CHAMPIONNAT').subscribe({
      next: (competitions) => {
        this.competitions = competitions;
        const saved = this.competitionService.selectedCode;
        this.selected = competitions.some(c => c.code === saved)
          ? saved!
          : (competitions[0]?.code ?? '');
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  selectCompetition(code: string) {
    if (code === this.selected) return;
    this.selected = code;
    this.competitionService.selectedCode = code;
  }
}
