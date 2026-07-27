// src/app/components/classement/classement.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassementLigne, Competition, CompetitionService } from '../../services/competition.service';

@Component({
  selector: 'app-classement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h2>Classement</h2>
      <p class="subtitle">Le tableau officiel de chaque championnat.</p>
    </div>

    <div class="competition-bar" *ngIf="championnats.length > 1">
      <button
        *ngFor="let c of championnats"
        type="button"
        class="competition-pill"
        [class.active]="selected === c.code"
        (click)="select(c.code)">
        {{ c.icone }} {{ c.name }}
      </button>
    </div>

    <div *ngIf="loading" class="spinner"></div>

    <div *ngIf="!loading && classement.length === 0" class="empty-state">
      <span class="empty-icon">📊</span>
      <p>Classement pas encore disponible. Lancez la synchronisation depuis l'administration
         (ou attendez le début de la compétition).</p>
    </div>

    <div class="card table-card" *ngIf="!loading && classement.length > 0">
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
            <tr *ngFor="let l of classement">
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
  `,
  styles: [`
    .competition-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
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

    .table-card {
      padding: 0.5rem;
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
    }

    .classement-table .rank {
      color: var(--muted);
      font-weight: 700;
    }

    .classement-table .points {
      font-weight: 800;
      color: var(--brand-strong);
    }
  `]
})
export class ClassementComponent implements OnInit {
  championnats: Competition[] = [];
  selected = '';
  classement: ClassementLigne[] = [];
  loading = true;

  constructor(private competitionService: CompetitionService) {}

  ngOnInit() {
    this.competitionService.list().subscribe({
      next: (competitions) => {
        // Seules les compétitions ayant un tableau de classement (championnats)
        this.championnats = competitions.filter(c => c.hasStandings);
        const saved = this.competitionService.selectedCode;
        this.selected = this.championnats.some(c => c.code === saved)
          ? saved!
          : (this.championnats[0]?.code ?? '');
        this.load();
      },
      error: () => this.loading = false
    });
  }

  select(code: string) {
    if (code === this.selected) return;
    this.selected = code;
    this.competitionService.selectedCode = code;
    this.load();
  }

  private load() {
    if (!this.selected) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.competitionService.classement(this.selected).subscribe({
      next: (rows) => {
        this.classement = rows;
        this.loading = false;
      },
      error: () => {
        this.classement = [];
        this.loading = false;
      }
    });
  }
}
