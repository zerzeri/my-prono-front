import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, MatchDTO, PronosticDTO } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.css'
})
export class MatchesComponent implements OnInit {
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

  constructor(
    private apiService: ApiService,
    public auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadMatches();
    this.loadMyPronostics();
  }

  loadMatches() {
    this.apiService.getAllMatches().subscribe({
      next: (matches) => {
        this.matches = matches;
        for (const match of matches) {
          if (match.id != null && !this.scores[match.id]) {
            this.scores[match.id] = { a: '', b: '' };
          }
        }
        this.applyFilter();
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

  applyFilter() {
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

  submitPronostic(matchId: number) {
    const s = this.scores[matchId];
    const a = (s?.a ?? '').toString().trim();
    const b = (s?.b ?? '').toString().trim();
    if (a === '' || b === '') {
      this.toast.error('Indiquez le nombre de buts des deux équipes.');
      return;
    }
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isInteger(na) || !Number.isInteger(nb) || na < 0 || nb < 0) {
      this.toast.error('Score invalide.');
      return;
    }

    const existant = this.myPronostics[matchId];
    const pronostic: PronosticDTO = { pronostic: `${na}-${nb}`, match: matchId };

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
  bothScoresFilled(matchId: number): boolean {
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
