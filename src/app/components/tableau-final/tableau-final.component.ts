// src/app/components/tableau-final/tableau-final.component.ts
// Tableau final d'une compétition à élimination directe : barrages, huitièmes,
// quarts, demies, finale. Prévu pour être réutilisé par les coupes
// internationales (V3), dont la structure de tours est identique.
//
// Deux particularités traitées ici :
//  - les tours se jouent en aller-retour : les deux manches sont regroupées en
//    une confrontation, avec le score cumulé ;
//  - le vainqueur d'une confrontation nulle au cumul se décide aux prolongations
//    ou aux tirs au but, informations que nous ne stockons pas. Le qualifié est
//    donc déduit de sa présence au tour suivant, jamais deviné.
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, MatchDTO } from '../../services/api.service';
import { estPhaseFinale, libellePhase, ordonnerPhases, PHASE_PETITE_FINALE } from '../../models/phase.model';

interface Confrontation {
  equipe1: string;
  equipe2: string;
  buts1: number | null;
  buts2: number | null;
  qualifie: string | null;
  date: string;
  manches: number;
}

interface Tour {
  phase: string;
  libelle: string;
  confrontations: Confrontation[];
}

@Component({
  selector: 'app-tableau-final',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading" class="spinner"></div>

    <div *ngIf="!loading && tours.length === 0" class="empty-state">
      <span class="empty-icon">🗓️</span>
      <p>Le tableau final n'est pas encore établi. Il se remplira au fil des qualifications.</p>
    </div>

    <div class="tour" *ngFor="let tour of tours">
      <h3 class="tour-titre">{{ tour.libelle }}</h3>

      <div class="confrontation card" *ngFor="let c of tour.confrontations">
        <div class="duel">
          <span class="equipe" [class.qualifie]="c.qualifie === c.equipe1">{{ c.equipe1 }}</span>
          <span class="cumul" *ngIf="c.buts1 !== null">{{ c.buts1 }} – {{ c.buts2 }}</span>
          <span class="cumul a-venir" *ngIf="c.buts1 === null">vs</span>
          <span class="equipe" [class.qualifie]="c.qualifie === c.equipe2">{{ c.equipe2 }}</span>
        </div>
        <p class="detail" *ngIf="detail(c) as texte">{{ texte }}</p>
      </div>
    </div>
  `,
  styles: [`
    .tour {
      margin-bottom: 1.5rem;
    }

    .tour-titre {
      font-size: 0.95rem;
      color: var(--text-2);
      margin-bottom: 0.6rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid var(--border);
    }

    .confrontation {
      padding: 0.8rem 0.9rem;
      margin-bottom: 0.6rem;
    }

    .duel {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 0.6rem;
    }

    .equipe {
      font-size: 0.92rem;
      font-weight: 600;
      text-align: center;
      overflow-wrap: anywhere;
      color: var(--text-2);
    }

    /* Le qualifié se distingue du perdant : c'est l'information principale */
    .equipe.qualifie {
      color: var(--text);
      font-weight: 800;
    }

    .cumul {
      font-size: 1rem;
      font-weight: 800;
      color: var(--success);
      background: var(--success-soft);
      border-radius: var(--radius-sm);
      padding: 0.25rem 0.6rem;
      white-space: nowrap;
    }

    .cumul.a-venir {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--muted);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      letter-spacing: 0.05em;
    }

    .detail {
      font-size: 0.75rem;
      color: var(--muted);
      text-align: center;
      margin-top: 0.5rem;
    }

    .detail:empty {
      display: none;
    }
  `]
})
export class TableauFinalComponent implements OnChanges {
  @Input() competition!: string;

  tours: Tour[] = [];
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnChanges() {
    if (!this.competition) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.apiService.getAllMatches(this.competition).subscribe({
      next: (matches) => {
        this.tours = this.construireTours(matches);
        this.loading = false;
      },
      error: () => {
        this.tours = [];
        this.loading = false;
      }
    });
  }

  /** Ligne d'information sous la confrontation ; vide si rien à signaler. */
  detail(c: Confrontation): string {
    const parties: string[] = [];
    if (c.manches > 1) {
      parties.push('Cumul aller-retour');
    }
    if (c.buts1 === null) {
      parties.push(this.formatDate(c.date));
    } else if (!c.qualifie) {
      // Cumul à égalité : le vainqueur s'est joué aux prolongations ou aux
      // tirs au but, que nous ne stockons pas. On l'annonce plutôt que de deviner.
      parties.push('Qualifié départagé hors score');
    }
    return parties.join(' · ');
  }

  private construireTours(matches: MatchDTO[]): Tour[] {
    const finales = matches.filter(m => estPhaseFinale(m.phase));
    const phases = ordonnerPhases([...new Set(finales.map(m => m.phase!))]);

    // Équipes engagées à chaque tour : sert à déterminer les qualifiés du tour précédent
    const equipesParPhase = new Map<string, Set<string>>();
    for (const phase of phases) {
      const equipes = new Set<string>();
      for (const m of finales.filter(x => x.phase === phase)) {
        equipes.add(m.equipe1);
        equipes.add(m.equipe2);
      }
      equipesParPhase.set(phase, equipes);
    }

    return phases.map((phase, i) => {
      // Le tour suivant sert à identifier les qualifiés. La petite finale n'en
      // est pas un : elle réunit les perdants des demies, et s'y fier
      // désignerait vainqueur l'équipe qui vient d'être éliminée.
      const progression = phases.slice(i + 1).find(p => p !== PHASE_PETITE_FINALE);
      return {
        phase,
        libelle: libellePhase(phase),
        confrontations: this.construireConfrontations(
          finales.filter(m => m.phase === phase),
          progression ? equipesParPhase.get(progression) : undefined
        )
      };
    });
  }

  /** Regroupe les manches d'une même affiche et cumule les buts. */
  private construireConfrontations(matches: MatchDTO[], tourSuivant?: Set<string>): Confrontation[] {
    const groupes = new Map<string, MatchDTO[]>();
    for (const m of matches) {
      const cle = [m.equipe1, m.equipe2].sort().join(' | ');
      const groupe = groupes.get(cle);
      if (groupe) {
        groupe.push(m);
      } else {
        groupes.set(cle, [m]);
      }
    }

    const confrontations: Confrontation[] = [];
    for (const groupe of groupes.values()) {
      groupe.sort((a, b) => new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime());
      const aller = groupe[0];
      const equipe1 = aller.equipe1;
      const equipe2 = aller.equipe2;

      let buts1: number | null = null;
      let buts2: number | null = null;
      // Le cumul n'a de sens que si toutes les manches sont jouées
      if (groupe.every(m => this.parseScore(m.resultat) !== null)) {
        buts1 = 0;
        buts2 = 0;
        for (const m of groupe) {
          const score = this.parseScore(m.resultat)!;
          // En manche retour, l'équipe qui reçoit est l'équipe 2 de l'affiche
          if (m.equipe1 === equipe1) {
            buts1 += score[0];
            buts2 += score[1];
          } else {
            buts1 += score[1];
            buts2 += score[0];
          }
        }
      }

      confrontations.push({
        equipe1,
        equipe2,
        buts1,
        buts2,
        qualifie: this.determinerQualifie(equipe1, equipe2, buts1, buts2, tourSuivant),
        date: aller.dateMatch,
        manches: groupe.length
      });
    }

    return confrontations.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Le qualifié est celui que l'on retrouve au tour suivant : c'est la source la
   * plus sûre, puisqu'un cumul nul se départage aux tirs au but, information que
   * nous ne stockons pas.
   *
   * Ce raisonnement ne vaut que si le tour suivant découle bien de celui-ci.
   * Ce n'est pas le cas de la petite finale, dont le « tour suivant » est la
   * finale : aucun de ses deux participants n'y figure. On se rabat alors sur le
   * score — comme pour la finale elle-même, qui n'a pas de tour suivant.
   *
   * Rien n'est deviné : à égalité et sans indication, aucun vainqueur n'est
   * affiché.
   */
  private determinerQualifie(equipe1: string, equipe2: string, buts1: number | null,
      buts2: number | null, tourSuivant?: Set<string>): string | null {
    if (tourSuivant?.has(equipe1)) {
      return equipe1;
    }
    if (tourSuivant?.has(equipe2)) {
      return equipe2;
    }
    if (buts1 === null || buts2 === null || buts1 === buts2) {
      return null;
    }
    return buts1 > buts2 ? equipe1 : equipe2;
  }

  private parseScore(texte: string | undefined): [number, number] | null {
    const m = (texte ?? '').trim().match(/^(\d+)\s*[-:]\s*(\d+)$/);
    return m ? [Number(m[1]), Number(m[2])] : null;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}
