// src/app/components/admin/admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchDTO, EquipeDTO } from '../../models';
import { MatchService } from '../../services/match.service';
import { EquipeService } from '../../services/equipe.service';
import { ApiService } from '../../services/api.service';
import { MatchFormComponent } from './match-form/match-form.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatchFormComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  activeTab: string = 'matches';
  matches: MatchDTO[] = [];
  equipes: EquipeDTO[] = [];
  editingMatch: MatchDTO | null = null;
  showMatchForm = false;
  loading = false;

  syncing = false;
  syncMessage = '';
  syncError = false;

  newEquipe: EquipeDTO = {
    name: ''
  };

  constructor(
    private matchService: MatchService,
    private equipeService: EquipeService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadMatches();
    this.loadEquipes();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.closeMatchForm();
  }

  syncWorldCup() {
    this.syncing = true;
    this.syncMessage = '';
    this.syncError = false;
    this.apiService.syncWorldCup().subscribe({
      next: (result) => {
        this.syncing = false;
        this.syncMessage = `Synchronisation terminée : ${result.total} matchs traités — `
          + `${result.equipesCreees} équipe(s) créée(s), ${result.matchsCrees} match(s) créé(s), `
          + `${result.matchsMisAJour} mis à jour.`;
        this.loadMatches();
        this.loadEquipes();
      },
      error: (error) => {
        console.error('Erreur lors de la synchronisation:', error);
        this.syncing = false;
        this.syncError = true;
        this.syncMessage = 'Erreur lors de la synchronisation. Réessayez dans quelques instants.';
      }
    });
  }

  loadMatches() {
    this.loading = true;
    this.matchService.getAllMatches().subscribe({
      next: (matches) => {
        this.matches = matches.sort((a, b) => 
          new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des matchs:', error);
        alert('Erreur lors du chargement des matchs.');
        this.loading = false;
      }
    });
  }

  loadEquipes() {
    this.equipeService.getAllEquipes().subscribe({
      next: (equipes) => {
        this.equipes = equipes;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipes:', error);
        alert('Erreur lors du chargement des équipes.');
      }
    });
  }

  // Gestion des matchs
  showCreateMatchForm() {
    this.editingMatch = null;
    this.showMatchForm = true;
  }

  editMatch(match: MatchDTO) {
    this.editingMatch = match;
    this.showMatchForm = true;
  }

  closeMatchForm() {
    this.showMatchForm = false;
    this.editingMatch = null;
  }

  onMatchSubmit(match: MatchDTO) {
    this.loading = true;
    
    if (this.editingMatch) {
      // Modification
      this.matchService.updateMatch(match.id!, match).subscribe({
        next: () => {
          this.closeMatchForm();
          this.loadMatches();
          alert('Match modifié avec succès !');
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          alert('Erreur lors de la modification du match.');
          this.loading = false;
        }
      });
    } else {
      // Création
      this.matchService.createMatch(match).subscribe({
        next: () => {
          this.closeMatchForm();
          this.loadMatches();
          alert('Match créé avec succès !');
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          alert('Erreur lors de la création du match.');
          this.loading = false;
        }
      });
    }
  }

  deleteMatch(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) {
      this.loading = true;
      this.matchService.deleteMatch(id).subscribe({
        next: () => {
          this.loadMatches();
          alert('Match supprimé avec succès !');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du match.');
          this.loading = false;
        }
      });
    }
  }

  // Gestion des équipes
  createEquipe() {
    if (!this.newEquipe.name.trim()) {
      alert('Veuillez remplir le nom de l\'équipe');
      return;
    }

    this.loading = true;
    this.equipeService.createEquipe(this.newEquipe).subscribe({
      next: () => {
        this.newEquipe = { name: '' };
        this.loadEquipes();
        alert('Équipe créée avec succès !');
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la création de l\'équipe:', error);
        alert('Erreur lors de la création de l\'équipe.');
        this.loading = false;
      }
    });
  }

  deleteEquipe(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) {
      this.loading = true;
      this.equipeService.deleteEquipe(id).subscribe({
        next: () => {
          this.loadEquipes();
          alert('Équipe supprimée avec succès !');
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression de l\'équipe.');
          this.loading = false;
        }
      });
    }
  }

  // Méthodes utilitaires
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

  getMatchStatusClass(match: MatchDTO): string {
    if (match.resultat) return 'finished';
    if (this.isMatchToday(match.dateMatch)) return 'today';
    if (this.isMatchPast(match.dateMatch)) return 'past';
    return 'upcoming';
  }

  getMatchStatusText(match: MatchDTO): string {
    if (match.resultat) return 'Terminé';
    if (this.isMatchPast(match.dateMatch)) return 'Expiré';
    if (this.isMatchToday(match.dateMatch)) return 'Aujourd\'hui';
    return 'À venir';
  }

  getEquipeNameById(id: number): string {
    const equipe = this.equipes.find(e => e.id === id);
    return equipe ? equipe.name : 'Équipe inconnue';
  }

  canDeleteEquipe(equipeId: number): boolean {
    // Vérifier qu'aucun match n'utilise cette équipe
    return !this.matches.some(match => 
      match.equipe1Id === equipeId || match.equipe2Id === equipeId
    );
  }

  getEquipeUsageWarning(equipeId: number): string {
    const matchCount = this.matches.filter(match => 
      match.equipe1Id === equipeId || match.equipe2Id === equipeId
    ).length;
    
    if (matchCount === 0) return '';
    return `Cette équipe est utilisée dans ${matchCount} match(s)`;
  }
}