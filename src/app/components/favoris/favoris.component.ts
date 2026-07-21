// src/app/components/favoris/favoris.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Favoris, FavorisService } from '../../services/favoris.service';
import { ApiService, EquipeDTO } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-favoris',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card favoris-card" *ngIf="favoris">
      <div class="favoris-head">
        <h3>🏆 Vos favoris — Coupe du Monde</h3>
        <span *ngIf="!favoris.editable" class="badge badge-expired">🔒 Verrouillé</span>
      </div>

      <p class="favoris-hint" *ngIf="favoris.editable">
        Choisissez vos favoris pour la compétition. Modifiable tant que l'administrateur le permet.
      </p>
      <p class="favoris-hint" *ngIf="!favoris.editable">
        La modification des favoris a été fermée par l'administrateur.
      </p>

      <!-- Édition -->
      <div class="favoris-fields" *ngIf="favoris.editable">
        <div class="form-group">
          <label for="champion">Champion</label>
          <select id="champion" name="champion" [(ngModel)]="champion">
            <option [ngValue]="''">— Choisir une équipe —</option>
            <option *ngFor="let e of equipes" [ngValue]="e.name">{{ e.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="buteur">Meilleur buteur</label>
          <input type="text" id="buteur" name="buteur" [(ngModel)]="meilleurButeur"
                 placeholder="Nom du joueur" maxlength="255">
        </div>
        <div class="form-group">
          <label for="passeur">Meilleur passeur</label>
          <input type="text" id="passeur" name="passeur" [(ngModel)]="meilleurPasseur"
                 placeholder="Nom du joueur" maxlength="255">
        </div>
        <button type="button" class="btn btn-primary" (click)="save()" [disabled]="saving">
          {{ saving ? 'Enregistrement…' : 'Enregistrer mes favoris' }}
        </button>
      </div>

      <!-- Lecture seule -->
      <div class="favoris-readonly" *ngIf="!favoris.editable">
        <div class="ro-row">
          <span class="ro-label">Champion</span>
          <span class="ro-value">{{ favoris.champion || '—' }}</span>
        </div>
        <div class="ro-row">
          <span class="ro-label">Meilleur buteur</span>
          <span class="ro-value">{{ favoris.meilleurButeur || '—' }}</span>
        </div>
        <div class="ro-row">
          <span class="ro-label">Meilleur passeur</span>
          <span class="ro-value">{{ favoris.meilleurPasseur || '—' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .favoris-card {
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .favoris-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .favoris-head h3 {
      font-size: 1.05rem;
    }

    .favoris-hint {
      font-size: 0.85rem;
      color: var(--text-2);
      margin: 0.4rem 0 1rem;
    }

    .favoris-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
      gap: 1rem;
      align-items: end;
    }

    .favoris-fields .form-group {
      margin: 0;
    }

    .favoris-fields .btn {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .favoris-readonly {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .ro-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.6rem 0.8rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }

    .ro-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-2);
    }

    .ro-value {
      font-weight: 700;
      overflow-wrap: anywhere;
      text-align: right;
    }
  `]
})
export class FavorisComponent implements OnInit {
  favoris: Favoris | null = null;
  equipes: EquipeDTO[] = [];
  champion = '';
  meilleurButeur = '';
  meilleurPasseur = '';
  saving = false;

  constructor(
    private favorisService: FavorisService,
    private apiService: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.favorisService.getMine().subscribe({
      next: (favoris) => {
        this.favoris = favoris;
        this.champion = favoris.champion ?? '';
        this.meilleurButeur = favoris.meilleurButeur ?? '';
        this.meilleurPasseur = favoris.meilleurPasseur ?? '';
        if (favoris.editable) {
          this.apiService.getAllEquipes().subscribe({
            next: (equipes) => this.equipes = equipes.sort((a, b) => a.name.localeCompare(b.name)),
            error: () => {}
          });
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des favoris:', error);
      }
    });
  }

  save() {
    this.saving = true;
    this.favorisService.update(
      this.champion || null,
      this.meilleurButeur || null,
      this.meilleurPasseur || null
    ).subscribe({
      next: (favoris) => {
        this.favoris = favoris;
        this.saving = false;
        this.toast.success('Favoris enregistrés !');
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err.status === 403
          ? 'La modification des favoris a été désactivée.'
          : 'Erreur lors de l\'enregistrement des favoris.');
      }
    });
  }
}
