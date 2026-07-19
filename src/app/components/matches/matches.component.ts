import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, MatchDTO, PronosticDTO } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

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
  newPronostic: { [key: number]: string } = {};
  filterType: string = 'all';

  readonly filters = [
    { value: 'all', label: 'Tous' },
    { value: 'upcoming', label: 'À venir' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'finished', label: 'Terminés' }
  ];

  constructor(private apiService: ApiService, public auth: AuthService) {}

  ngOnInit() {
    this.loadMatches();
    this.loadMyPronostics();
  }

  loadMatches() {
    this.apiService.getAllMatches().subscribe({
      next: (matches) => {
        this.matches = matches;
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
            this.newPronostic[prono.match] = prono.pronostic;
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
    
    // Trier par date
    this.filteredMatches.sort((a, b) => 
      new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime()
    );
  }

  submitPronostic(matchId: number) {
    const pronosticText = this.newPronostic[matchId];
    if (!pronosticText) return;

    const existant = this.myPronostics[matchId];
    const pronostic: PronosticDTO = {
      pronostic: pronosticText,
      match: matchId
    };

    const requete = existant
      ? this.apiService.updatePronostic(existant.id!, pronostic)
      : this.apiService.createPronostic(pronostic);

    requete.subscribe({
      next: () => {
        this.loadMyPronostics();
        alert(existant ? 'Pronostic modifié !' : 'Pronostic enregistré !');
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement du pronostic:', error);
        alert(error.status === 400
          ? 'Le match a déjà commencé, les pronostics sont fermés.'
          : 'Erreur lors de l\'enregistrement du pronostic');
      }
    });
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

  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
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