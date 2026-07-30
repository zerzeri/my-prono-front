import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, MatchDTO, PronosticDTO } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { estPhaseFinale } from '../../models/phase.model';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.css'
})
export class MatchesComponent implements OnInit, OnChanges {
  /** Compétition à afficher, fournie par la rubrique parente. */
  @Input() competition!: string;

  /**
   * Phase à afficher (LEAGUE_STAGE, LAST_16…). Laissée vide pour un championnat,
   * qui n'a qu'une phase : tous les matchs sont alors affichés.
   */
  @Input() phase?: string;

  /** Tous les matchs de la compétition, avant filtrage par phase. */
  private toutes: MatchDTO[] = [];

  matches: MatchDTO[] = [];
  filteredMatches: MatchDTO[] = [];
  myPronostics: { [matchId: number]: PronosticDTO } = {};
  // Saisie du score par match : deux cases (buts équipe 1 / équipe 2)
  scores: { [matchId: number]: { a: string; b: string } } = {};
  filterType: string = 'all';

  readonly filters = [
    { value: 'all', label: 'Tous' },
    { value: 'upcoming', label: 'À venir' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'finished', label: 'Terminés' }
  ];

  // Navigation par journée (championnats). Vide pour les compétitions sans journée.
  journees: number[] = [];
  selectedJournee: number | null = null;

  get journeeMode(): boolean {
    return this.journees.length > 0;
  }

  constructor(
    private apiService: ApiService,
    public auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadMyPronostics();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Changer de phase ne nécessite pas de rappeler l'API : on refiltre sur place.
    if (changes['competition'] || this.toutes.length === 0) {
      this.loadMatches();
    } else if (changes['phase']) {
      this.appliquerPhase();
    }
  }

  loadMatches() {
    if (!this.competition) {
      return;
    }
    this.apiService.getAllMatches(this.competition).subscribe({
      next: (matches) => {
        this.toutes = matches;
        for (const match of matches) {
          if (match.id != null && !this.scores[match.id]) {
            this.scores[match.id] = { a: '', b: '' };
          }
        }
        this.appliquerPhase();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des matchs:', error);
      }
    });
  }

  loadMyPronostics() {
    if (!this.auth.isLoggedIn) {
      this.myPronostics = {};
      return;
    }
    this.apiService.getMyPronostics().subscribe({
      next: (pronostics) => {
        this.myPronostics = {};
        for (const prono of pronostics) {
          if (prono.match != null) {
            this.myPronostics[prono.match] = prono;
            const parsed = this.parseScore(prono.pronostic);
            this.scores[prono.match] = parsed ?? { a: '', b: '' };
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement de mes pronostics:', error);
      }
    });
  }

  /** Restreint l'affichage à la phase demandée et recalcule la navigation. */
  private appliquerPhase() {
    this.matches = this.phase
      ? this.toutes.filter(m => m.phase === this.phase)
      : this.toutes;
    this.selectedJournee = null; // la journée courante se recalcule dans la nouvelle phase
    this.computeJournees();
    this.applyFilter();
  }

  /**
   * Sur un tour à élimination directe, la « journée » désigne le match aller
   * ou retour ; ailleurs c'est la journée de championnat.
   */
  libelleJournee(j: number): string {
    if (!estPhaseFinale(this.phase)) {
      return `Journée ${j}`;
    }
    return j === 1 ? 'Aller' : 'Retour';
  }

  private computeJournees() {
    const set = new Set<number>();
    for (const m of this.matches) {
      if (m.journee != null) {
        set.add(m.journee);
      }
    }
    this.journees = [...set].sort((a, b) => a - b);
    if (this.journees.length === 0) {
      this.selectedJournee = null;
    } else if (this.selectedJournee == null || !this.journees.includes(this.selectedJournee)) {
      this.selectedJournee = this.currentJournee();
    }
  }

  // Journée du prochain match à venir, sinon la dernière journée
  private currentJournee(): number {
    const now = Date.now();
    const upcoming = this.matches
      .filter(m => m.journee != null && new Date(m.dateMatch).getTime() >= now)
      .sort((a, b) => new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime());
    return upcoming.length > 0 ? upcoming[0].journee! : this.journees[this.journees.length - 1];
  }

  selectJournee(j: number) {
    this.selectedJournee = j;
    this.applyFilter();
  }

  prevJournee() {
    const i = this.journees.indexOf(this.selectedJournee!);
    if (i > 0) {
      this.selectJournee(this.journees[i - 1]);
    }
  }

  nextJournee() {
    const i = this.journees.indexOf(this.selectedJournee!);
    if (i >= 0 && i < this.journees.length - 1) {
      this.selectJournee(this.journees[i + 1]);
    }
  }

  get canPrevJournee(): boolean {
    return this.journees.indexOf(this.selectedJournee!) > 0;
  }

  get canNextJournee(): boolean {
    const i = this.journees.indexOf(this.selectedJournee!);
    return i >= 0 && i < this.journees.length - 1;
  }

  applyFilter() {
    // Championnats : on affiche une journée à la fois
    if (this.journeeMode) {
      this.filteredMatches = this.matches
        .filter(m => m.journee === this.selectedJournee)
        .sort((a, b) => new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime());
      return;
    }

    const now = new Date();
    switch (this.filterType) {
      case 'finished':
        this.filteredMatches = this.matches.filter(match =>
          match.resultat || new Date(match.dateMatch) < now
        );
        break;
      case 'upcoming':
        this.filteredMatches = this.matches.filter(match =>
          !match.resultat && new Date(match.dateMatch) >= now
        );
        break;
      case 'today':
        this.filteredMatches = this.matches.filter(match =>
          this.isMatchToday(match.dateMatch)
        );
        break;
      default:
        this.filteredMatches = [...this.matches];
    }

    this.filteredMatches.sort((a, b) =>
      new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime()
    );
  }

  /**
   * Premier pronostic : après un chiffre dans la case domicile, on enchaîne sur
   * la case extérieur. Si un pronostic existe déjà, on laisse l'utilisateur
   * éditer librement (passer de 1 à 10, ou corriger le chiffre saisi).
   */
  onHomeInput(matchId: number, home: HTMLInputElement, away: HTMLInputElement) {
    if (this.myPronostics[matchId]) {
      return;
    }
    if (home.value.length === 1) {
      away.focus();
    }
  }

  /** Enregistre dès qu'on quitte une case, si les deux sont renseignées. */
  onScoreCommit(matchId: number) {
    if (!this.bothScoresFilled(matchId)) {
      return;
    }
    const s = this.scores[matchId];
    const na = Number((s.a ?? '').toString().trim());
    const nb = Number((s.b ?? '').toString().trim());
    if (!Number.isInteger(na) || !Number.isInteger(nb) || na < 0 || nb < 0) {
      this.toast.error('Score invalide.');
      return;
    }

    const existant = this.myPronostics[matchId];
    const pronostic: PronosticDTO = { pronostic: `${na}-${nb}`, match: matchId };
    // Rien à enregistrer si le score n'a pas bougé
    if (existant?.pronostic === pronostic.pronostic) {
      return;
    }

    const requete = existant
      ? this.apiService.updatePronostic(existant.id!, pronostic)
      : this.apiService.createPronostic(pronostic);

    requete.subscribe({
      next: () => {
        this.loadMyPronostics();
        this.toast.success(existant ? 'Pronostic modifié !' : 'Pronostic enregistré !');
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement du pronostic:', error);
        this.toast.error(error.status === 400
          ? 'Le match a déjà commencé, les pronostics sont fermés.'
          : 'Erreur lors de l\'enregistrement du pronostic.');
      }
    });
  }

  // Les deux cases sont renseignées (0 compris — d'où le test explicite du vide, pas de la « vérité »)
  private bothScoresFilled(matchId: number): boolean {
    const s = this.scores[matchId];
    return !!s && this.isFilled(s.a) && this.isFilled(s.b);
  }

  private isFilled(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  private parseScore(text: string): { a: string; b: string } | null {
    const m = (text ?? '').trim().match(/^(\d+)\s*[-:]\s*(\d+)$/);
    return m ? { a: m[1], b: m[2] } : null;
  }

  // Méthodes utilitaires pour les dates
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isMatchPast(dateString: string): boolean {
    return new Date(dateString) < new Date();
  }

  isMatchToday(dateString: string): boolean {
    const matchDate = new Date(dateString);
    const today = new Date();
    return matchDate.toDateString() === today.toDateString();
  }

  isMatchSoon(dateString: string): boolean {
    const matchDate = new Date(dateString);
    const now = new Date();
    const timeDiff = matchDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    return hoursDiff > 0 && hoursDiff <= 24;
  }

  canMakePronostic(match: MatchDTO): boolean {
    return !match.resultat && !this.isMatchPast(match.dateMatch);
  }

  getMatchStatus(match: MatchDTO): string {
    if (match.resultat) return 'Terminé';
    if (this.isMatchPast(match.dateMatch)) return 'Expiré';
    if (this.isMatchToday(match.dateMatch)) return 'Aujourd\'hui';
    if (this.isMatchSoon(match.dateMatch)) return 'Bientôt';
    return 'À venir';
  }
}
