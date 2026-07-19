import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, MatchDTO, PronosticDTO } from '../../services/api.service';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.css'
})
export class MatchesComponent implements OnInit {
  matches: MatchDTO[] = [];
  filteredMatches: MatchDTO[] = [];
  pronostics: PronosticDTO[] = [];
  newPronostic: { [key: number]: string } = {};
  filterType: string = 'all';

  readonly filters = [
    { value: 'all', label: 'Tous' },
    { value: 'upcoming', label: 'À venir' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'finished', label: 'Terminés' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadMatches();
    this.loadPronostics();
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

  loadPronostics() {
    this.apiService.getAllPronostics().subscribe({
      next: (pronostics) => {
        this.pronostics = pronostics;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pronostics:', error);
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

    const pronostic: PronosticDTO = {
      pronostic: pronosticText,
      match: matchId
    };

    this.apiService.createPronostic(pronostic).subscribe({
      next: (id) => {
        console.log('Pronostic créé avec l\'ID:', id);
        this.newPronostic[matchId] = '';
        this.loadPronostics();
        alert('Pronostic enregistré avec succès !');
      },
      error: (error) => {
        console.error('Erreur lors de la création du pronostic:', error);
        alert('Erreur lors de l\'enregistrement du pronostic');
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