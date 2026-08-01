// src/app/components/classement/classement.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassementLigne, CompetitionService } from '../../services/competition.service';

@Component({
  selector: 'app-classement',
  standalone: true,
  imports: [CommonModule],
  template: `
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
export class ClassementComponent implements OnChanges {
  /** Compétition à afficher, fournie par la rubrique parente. */
  @Input() competition!: string;

  classement: ClassementLigne[] = [];
  loading = true;

  constructor(private competitionService: CompetitionService) {}

  ngOnChanges() {
    this.load();
  }

  private load() {
    if (!this.competition) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.competitionService.classement(this.competition).subscribe({
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
