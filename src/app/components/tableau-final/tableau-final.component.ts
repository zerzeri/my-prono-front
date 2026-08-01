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

    <p class="aide" *ngIf="!loading && tours.length > 1">
      Faites défiler horizontalement pour suivre le parcours jusqu'à la finale.
    </p>

    <div class="arbre" *ngIf="!loading && tours.length > 0">
      <div class="tour" *ngFor="let tour of tours">
        <div class="tour-entete">{{ tour.libelle }}</div>

        <!-- space-around répartit les confrontations : chaque tour compte
             moitié moins d'affiches que le précédent, ce qui aligne
             naturellement un vainqueur en face de ses deux prétendants. -->
        <div class="tour-corps">
          <div class="duel" *ngFor="let c of tour.confrontations"
               [title]="infobulle(c)">
            <div class="ligne" [class.qualifie]="c.qualifie === c.equipe1">
              <span class="nom">{{ c.equipe1 }}</span>
              <span class="but">{{ c.buts1 === null ? '–' : c.buts1 }}</span>
            </div>
            <div class="ligne" [class.qualifie]="c.qualifie === c.equipe2">
              <span class="nom">{{ c.equipe2 }}</span>
              <span class="but">{{ c.buts2 === null ? '–' : c.buts2 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .aide {
      font-size: 0.75rem;
      color: var(--muted);
      margin-bottom: 0.75rem;
    }

    /*
      Un arbre de tournoi est horizontal par nature : cinq tours pour un
      Mondial. Sur 375 px, on assume le défilement latéral plutôt que de
      compresser des colonnes illisibles — la lecture se fait de gauche à
      droite, en suivant son équipe.
    */
    .arbre {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      align-items: stretch;
      padding-bottom: 0.5rem;
      -webkit-overflow-scrolling: touch;
    }

    .tour {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      width: 10.5rem;
    }

    .tour-entete {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
      text-align: center;
      padding-bottom: 0.4rem;
      margin-bottom: 0.6rem;
      border-bottom: 1px solid var(--border);
    }

    /* Le cœur de l'effet d'arbre : chaque tour ayant moitié moins d'affiches,
       la répartition régulière place le vainqueur face à ses prétendants. */
    .tour-corps {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      gap: 0.4rem;
    }

    .duel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;
      flex-shrink: 0;
    }

    .ligne {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
      padding: 0.4rem 0.55rem;
      font-size: 0.8rem;
      color: var(--text-2);
    }

    .ligne + .ligne {
      border-top: 1px solid var(--border);
    }

    /* Le qualifié est l'information principale : il se lit d'un coup d'œil */
    .ligne.qualifie {
      color: var(--text);
      font-weight: 800;
      background: var(--success-soft);
    }

    /* Nom tronqué plutôt que replié : des lignes de hauteur égale sont
       indispensables à l'alignement des tours entre eux. */
    .nom {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .but {
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
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

  /**
   * Infobulle de la confrontation. Les noms y figurent en entier : ils sont
   * tronqués dans l'arbre pour garder des lignes de hauteur égale.
   */
  infobulle(c: Confrontation): string {
    const parties: string[] = [`${c.equipe1} – ${c.equipe2}`];
    if (c.manches > 1) {
      parties.push('cumul aller-retour');
    }
    if (c.buts1 === null) {
      parties.push(this.formatDate(c.date));
    } else if (!c.qualifie) {
      // Cumul à égalité : le vainqueur s'est joué aux prolongations ou aux
      // tirs au but, que nous ne stockons pas. On l'annonce plutôt que de deviner.
      parties.push('qualifié départagé hors score');
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

    // La petite finale ne figure pas dans l'arbre : elle n'appartient pas à la
    // progression vers le titre. Elle reste consultable dans l'onglet Matchs.
    const tours = phases.filter(p => p !== PHASE_PETITE_FINALE).map((phase) => {
      const i = phases.indexOf(phase);
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

    return this.ordonnerEnArbre(tours);
  }

  /**
   * Réordonne chaque tour pour que les deux affiches menant à une même
   * confrontation soient voisines.
   *
   * Sans cela, les affiches suivent l'ordre des dates : l'arbre alignerait des
   * rencontres sans lien entre elles, suggérant des enchaînements qui n'existent
   * pas. On remonte donc depuis la finale, chaque confrontation rappelant à elle
   * les deux affiches dont elle est issue.
   *
   * Les affiches sans suite identifiable (tour non encore joué) sont conservées
   * à la fin, dans leur ordre d'origine : mieux vaut un arbre incomplet qu'une
   * rencontre disparue.
   */
  private ordonnerEnArbre(tours: Tour[]): Tour[] {
    for (let i = tours.length - 2; i >= 0; i--) {
      const suivant = tours[i + 1].confrontations;
      const restantes = [...tours[i].confrontations];
      const ordonnees: Confrontation[] = [];

      for (const aval of suivant) {
        for (const equipe of [aval.equipe1, aval.equipe2]) {
          const index = restantes.findIndex(c => c.qualifie === equipe);
          if (index !== -1) {
            ordonnees.push(...restantes.splice(index, 1));
          }
        }
      }
      tours[i].confrontations = [...ordonnees, ...restantes];
    }
    return tours;
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
