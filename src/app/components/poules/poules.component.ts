// src/app/components/poules/poules.component.ts
// Classements des phases de poules. Un groupe à la fois : douze tableaux
// empilés seraient illisibles sur 375 px.
//
// Les classements sont calculés par le back à partir des matchs — le
// fournisseur ne les donne pas pour une coupe.
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompetitionService, Poule } from '../../services/competition.service';

@Component({
  selector: 'app-poules',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading" class="spinner"></div>

    <div *ngIf="!loading && poules.length === 0" class="empty-state">
      <span class="empty-icon">📋</span>
      <p>Les poules ne sont pas encore constituées.</p>
    </div>

    <ng-container *ngIf="!loading && poules.length > 0">
      <div class="groupe-bar">
        <button
          *ngFor="let p of poules"
          type="button"
          class="groupe-pill"
          [class.active]="selected?.groupe === p.groupe"
          (click)="selected = p">
          {{ court(p.libelle) }}
        </button>
      </div>

      <div class="card table-card" *ngIf="selected">
        <h3 class="groupe-titre">{{ selected.libelle }}</h3>
        <div class="table-wrap">
          <table class="classement-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="col-team">Équipe</th>
                <th title="Joués">J</th>
                <th title="Gagnés">G</th>
                <th title="Nuls">N</th>
                <th title="Perdus">P</th>
                <th title="Différence de buts">Diff</th>
                <th title="Points">Pts</th>
              </tr>
            </thead>
            <tbody>
              <!-- Les deux premiers d'un groupe sont qualifiés dans la plupart
                   des formats : on les distingue visuellement. -->
              <tr *ngFor="let l of selected.classement" [class.qualifie]="l.position <= 2">
                <td class="rank">{{ l.position }}</td>
                <td class="col-team">{{ l.team }}</td>
                <td>{{ l.joues }}</td>
                <td>{{ l.gagnes }}</td>
                <td>{{ l.nuls }}</td>
                <td>{{ l.perdus }}</td>
                <td>{{ l.difference > 0 ? '+' : '' }}{{ l.difference }}</td>
                <td class="points">{{ l.points }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    /* Douze groupes : défilement horizontal plutôt qu'un pavé de boutons */
    .groupe-bar {
      display: flex;
      gap: 0.4rem;
      margin-bottom: 1rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      -webkit-overflow-scrolling: touch;
    }

    .groupe-pill {
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-2);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      min-width: 2.5rem;
      padding: 0.45rem 0.7rem;
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .groupe-pill:hover {
      border-color: var(--brand);
      color: var(--brand-strong);
    }

    .groupe-pill.active {
      background: var(--brand);
      border-color: var(--brand);
      color: #fff;
    }

    .table-card {
      padding: 0.5rem;
    }

    .groupe-titre {
      font-size: 0.9rem;
      color: var(--text-2);
      padding: 0.5rem 0.5rem 0.25rem;
    }

    .table-wrap {
      overflow-x: auto;
    }

    .classement-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
      white-space: nowrap;
    }

    .classement-table th {
      text-align: center;
      font-size: 0.75rem;
      color: var(--muted);
      font-weight: 600;
      padding: 0.6rem 0.5rem;
      border-bottom: 1px solid var(--border);
    }

    .classement-table td {
      text-align: center;
      padding: 0.6rem 0.5rem;
      border-bottom: 1px solid var(--border);
    }

    .classement-table tr:last-child td {
      border-bottom: none;
    }

    .classement-table .col-team {
      text-align: left;
      width: 100%;
      font-weight: 600;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .classement-table .rank {
      color: var(--muted);
      font-weight: 700;
    }

    .classement-table .points {
      font-weight: 800;
      color: var(--brand-strong);
    }

    .classement-table tr.qualifie .rank {
      color: var(--brand-strong);
    }

    .classement-table tr.qualifie .col-team {
      font-weight: 800;
    }
  `]
})
export class PoulesComponent implements OnChanges {
  @Input() competition!: string;

  poules: Poule[] = [];
  selected: Poule | null = null;
  loading = true;

  constructor(private competitionService: CompetitionService) {}

  ngOnChanges() {
    if (!this.competition) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.competitionService.poules(this.competition).subscribe({
      next: (poules) => {
        this.poules = poules;
        this.selected = poules[0] ?? null;
        this.loading = false;
      },
      error: () => {
        this.poules = [];
        this.selected = null;
        this.loading = false;
      }
    });
  }

  /** « Groupe A » tient mal sur une pastille : on garde la lettre. */
  court(libelle: string): string {
    return libelle.replace(/^Groupe\s+/, '');
  }
}
