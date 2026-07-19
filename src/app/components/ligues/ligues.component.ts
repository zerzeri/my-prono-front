// src/app/components/ligues/ligues.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassementEntry, LigueDTO, LigueService } from '../../services/ligue.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ligues',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Mes ligues</h2>
      <p class="subtitle">Créez une ligue ou rejoignez-en une avec un lien d'invitation.</p>
    </div>

    <!-- Créer / Rejoindre -->
    <div class="actions-grid">
      <div class="card action-card">
        <h3>Créer une ligue</h3>
        <form (ngSubmit)="create()" class="action-form">
          <input type="text" name="ligueName" [(ngModel)]="newName"
                 placeholder="Nom de la ligue" required>
          <button type="submit" class="btn btn-primary" [disabled]="creating || !newName.trim()">
            {{ creating ? 'Création…' : 'Créer' }}
          </button>
        </form>
      </div>

      <div class="card action-card">
        <h3>Rejoindre une ligue</h3>
        <form (ngSubmit)="joinFromInput()" class="action-form">
          <input type="text" name="joinInput" [(ngModel)]="joinInput"
                 placeholder="Collez le lien ou le code d'invitation" required>
          <button type="submit" class="btn btn-primary" [disabled]="joiningInput || !joinInput.trim()">
            {{ joiningInput ? '…' : 'Rejoindre' }}
          </button>
        </form>
        <p *ngIf="joinError" class="join-error">{{ joinError }}</p>
      </div>
    </div>

    <div *ngIf="loading" class="spinner"></div>

    <div *ngIf="!loading && ligues.length === 0" class="empty-state">
      <span class="empty-icon">🏆</span>
      <p>Vous n'êtes membre d'aucune ligue pour le moment.</p>
    </div>

    <!-- Sélecteur de ligue -->
    <div *ngIf="ligues.length > 0" class="ligue-switcher">
      <button *ngFor="let ligue of ligues" type="button" class="switch-pill"
              [class.active]="selected?.id === ligue.id"
              (click)="select(ligue)">
        {{ ligue.name }}
      </button>
    </div>

    <!-- Détail de la ligue active -->
    <div *ngIf="selected" class="card ligue-card">
      <div class="ligue-header">
        <h3>{{ selected.name }}</h3>
        <span class="badge badge-upcoming">{{ selected.membres.length }} membre{{ selected.membres.length > 1 ? 's' : '' }}</span>
      </div>

      <div class="invite-row">
        <input type="text" readonly [value]="inviteLink(selected)" (focus)="$any($event.target).select()">
        <button type="button" class="btn btn-secondary btn-sm" (click)="copyLink(selected)">
          {{ copiedId === selected.id ? '✓ Copié !' : 'Copier le lien' }}
        </button>
      </div>

      <div class="ligue-tabs">
        <button type="button" class="tab-btn" [class.active]="activeTab === 'classement'"
                (click)="activeTab = 'classement'">🏆 Classement</button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'membres'"
                (click)="activeTab = 'membres'">👥 Membres</button>
      </div>

      <!-- Classement -->
      <div *ngIf="activeTab === 'classement'">
        <div *ngIf="loadingClassement" class="spinner"></div>
        <div class="table-wrap" *ngIf="!loadingClassement">
          <table class="classement-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="col-joueur">Joueur</th>
                <th>Pts</th>
                <th title="Scores exacts (5 pts)">🎯</th>
                <th title="Bons résultats (2 pts)">✔️</th>
                <th title="Pronostics comptés">🗳️</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of classement; let i = index"
                  [class.me]="entry.email === auth.user?.email">
                <td class="rank">{{ i + 1 }}</td>
                <td class="col-joueur">{{ entry.email }}</td>
                <td class="points">{{ entry.points }}</td>
                <td>{{ entry.scoresExacts }}</td>
                <td>{{ entry.bonsResultats }}</td>
                <td>{{ entry.pronostics }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="regle-hint">Bon résultat (1/N/2, prolongations comprises) : 2 pts · Score exact : 5 pts.</p>
      </div>

      <!-- Membres -->
      <div *ngIf="activeTab === 'membres'" class="membres">
        <span *ngFor="let membre of selected.membres" class="membre-chip"
              [class.createur]="membre === selected.createur"
              [title]="membre === selected.createur ? 'Créateur de la ligue' : ''">
          {{ membre === selected.createur ? '👑 ' : '' }}{{ membre }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .action-card {
      padding: 1.1rem 1.25rem;
    }

    .action-card h3 {
      font-size: 0.95rem;
      margin-bottom: 0.6rem;
    }

    .action-form {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .action-form input {
      flex: 1;
      min-width: min(200px, 100%);
    }

    .join-error {
      color: var(--danger);
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }

    .ligue-switcher {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .switch-pill {
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-2);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .switch-pill:hover {
      border-color: var(--brand);
      color: var(--brand-strong);
    }

    .switch-pill.active {
      background: var(--navy);
      border-color: var(--navy);
      color: #fff;
    }

    .ligue-card {
      padding: 1.25rem;
    }

    .ligue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .ligue-header h3 {
      font-size: 1.1rem;
    }

    .invite-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .invite-row input {
      flex: 1;
      min-width: min(200px, 100%);
      font-size: 0.8rem;
      color: var(--text-2);
      background: var(--surface-2);
    }

    .ligue-tabs {
      display: inline-flex;
      gap: 0.25rem;
      margin-bottom: 1rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.25rem;
    }

    .tab-btn {
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-2);
      background: none;
      border: none;
      border-radius: 999px;
      padding: 0.45rem 1rem;
      cursor: pointer;
    }

    .tab-btn.active {
      background: var(--navy);
      color: #fff;
    }

    .table-wrap {
      overflow-x: auto;
    }

    .classement-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }

    .classement-table th {
      text-align: left;
      font-size: 0.75rem;
      color: var(--muted);
      font-weight: 600;
      padding: 0.5rem 0.6rem;
      border-bottom: 1px solid var(--border);
    }

    .classement-table td {
      padding: 0.6rem;
      border-bottom: 1px solid var(--border);
    }

    .classement-table tr:last-child td {
      border-bottom: none;
    }

    .classement-table .col-joueur {
      width: 100%;
      overflow-wrap: anywhere;
    }

    .classement-table .rank {
      font-weight: 700;
      color: var(--muted);
    }

    .classement-table .points {
      font-weight: 800;
      color: var(--brand-strong);
    }

    .classement-table tr.me td {
      background: var(--brand-soft);
    }

    .regle-hint {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 0.75rem;
    }

    .membres {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .membre-chip {
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--text-2);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.3rem 0.7rem;
      overflow-wrap: anywhere;
    }

    .membre-chip.createur {
      color: var(--warning);
      background: var(--warning-soft);
      border-color: #fedf89;
    }
  `]
})
export class LiguesComponent implements OnInit {
  ligues: LigueDTO[] = [];
  selected: LigueDTO | null = null;
  classement: ClassementEntry[] = [];
  activeTab: 'classement' | 'membres' = 'classement';

  newName = '';
  joinInput = '';
  joinError = '';
  loading = true;
  creating = false;
  joiningInput = false;
  loadingClassement = false;
  copiedId: number | null = null;

  constructor(private ligueService: LigueService, public auth: AuthService) {}

  ngOnInit() {
    this.load();
  }

  load(selectId?: number) {
    this.ligueService.mine().subscribe({
      next: (ligues) => {
        this.ligues = ligues;
        this.loading = false;
        const toSelect = ligues.find(l => l.id === (selectId ?? this.selected?.id)) ?? ligues[0] ?? null;
        this.select(toSelect);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des ligues:', error);
        this.loading = false;
      }
    });
  }

  select(ligue: LigueDTO | null) {
    this.selected = ligue;
    this.classement = [];
    if (ligue) {
      this.loadClassement(ligue.id);
    }
  }

  loadClassement(ligueId: number) {
    this.loadingClassement = true;
    this.ligueService.classement(ligueId).subscribe({
      next: (classement) => {
        this.classement = classement;
        this.loadingClassement = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du classement:', error);
        this.loadingClassement = false;
      }
    });
  }

  create() {
    if (!this.newName.trim()) return;
    this.creating = true;
    this.ligueService.create(this.newName).subscribe({
      next: (ligue) => {
        this.newName = '';
        this.creating = false;
        this.load(ligue.id);
      },
      error: (error) => {
        console.error('Erreur lors de la création de la ligue:', error);
        this.creating = false;
        alert('Erreur lors de la création de la ligue.');
      }
    });
  }

  joinFromInput() {
    const code = this.extractCode(this.joinInput);
    if (!code) {
      this.joinError = 'Lien ou code invalide.';
      return;
    }
    this.joiningInput = true;
    this.joinError = '';
    this.ligueService.join(code).subscribe({
      next: (ligue) => {
        this.joinInput = '';
        this.joiningInput = false;
        this.load(ligue.id);
      },
      error: (err) => {
        this.joiningInput = false;
        this.joinError = err.status === 404
          ? 'Ce lien d\'invitation est invalide.'
          : 'Erreur lors de la tentative pour rejoindre la ligue.';
      }
    });
  }

  // Accepte un lien complet (…/rejoindre?code=xxx) ou un code brut
  private extractCode(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/[?&]code=([a-zA-Z0-9-]+)/);
    if (match) return match[1];
    return /^[a-zA-Z0-9-]+$/.test(trimmed) ? trimmed : null;
  }

  inviteLink(ligue: LigueDTO): string {
    return `${window.location.origin}/ligues/rejoindre?code=${ligue.inviteCode}`;
  }

  copyLink(ligue: LigueDTO) {
    navigator.clipboard.writeText(this.inviteLink(ligue)).then(() => {
      this.copiedId = ligue.id;
      setTimeout(() => (this.copiedId = null), 2000);
    });
  }
}
