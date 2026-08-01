// src/app/components/admin/admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchDTO, EquipeDTO } from '../../models';
import { MatchService } from '../../services/match.service';
import { EquipeService } from '../../services/equipe.service';
import { ApiService, UtilisateurDTO } from '../../services/api.service';
import { messageErreur } from '../../services/http-error';
import { ToastService } from '../../services/toast.service';
import { FavorisService } from '../../services/favoris.service';
import { Competition, CompetitionService } from '../../services/competition.service';
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

  favorisEditable = true;
  togglingFavoris = false;

  // Résultats officiels des favoris (validation admin en fin de compétition)
  resChampion = '';
  resButeur = '';
  resPasseur = '';
  savingResultats = false;

  // Onglet Profils
  profils: UtilisateurDTO[] = [];
  filtreProfils = '';
  loadingProfils = false;
  /** Email dont l'envoi est en cours, pour désactiver le bouton concerné. */
  envoiEnCours: string | null = null;

  competitions: Competition[] = [];
  selectedCompetition = '';
  // Équipes de la compétition sélectionnée (pour le champion des résultats officiels)
  equipesCompetition: EquipeDTO[] = [];

  // Navigation par journée (championnats). Vide pour la Coupe du Monde.
  journees: number[] = [];
  selectedJournee: number | null = null;

  get journeeMode(): boolean {
    return this.journees.length > 0;
  }

  // Matchs affichés : une journée à la fois pour les championnats, tous sinon.
  get displayedMatches(): MatchDTO[] {
    if (!this.journeeMode) {
      return this.matches;
    }
    return this.matches.filter(m => m.journee === this.selectedJournee);
  }

  newEquipe: EquipeDTO = {
    name: ''
  };

  constructor(
    private matchService: MatchService,
    private equipeService: EquipeService,
    private apiService: ApiService,
    private toast: ToastService,
    private favorisService: FavorisService,
    private competitionService: CompetitionService
  ) {}

  // Les favoris n'existent pas sur un championnat national (spec-v1.md § 3).
  get selectedHasFavoris(): boolean {
    return this.competitions.find(c => c.code === this.selectedCompetition)?.hasFavoris ?? false;
  }

  get selectedCloturee(): boolean {
    return this.competitions.find(c => c.code === this.selectedCompetition)?.cloturee ?? false;
  }

  togglingCloture = false;

  /** Clôture ou rouvre la compétition : archive consultable, saisie fermée. */
  setCloture(cloturee: boolean) {
    this.togglingCloture = true;
    this.apiService.setCloture(this.selectedCompetition, cloturee).subscribe({
      next: (res) => {
        const c = this.competitions.find(x => x.code === this.selectedCompetition);
        if (c) {
          c.cloturee = res.cloturee;
        }
        this.togglingCloture = false;
        this.toast.success(res.cloturee
          ? 'Compétition archivée : consultable, mais fermée aux pronostics.'
          : 'Compétition rouverte aux pronostics.');
      },
      error: () => {
        this.togglingCloture = false;
        this.toast.error('Erreur lors du changement de statut.');
      }
    });
  }

  ngOnInit() {
    this.loadEquipes();
    // Toutes les sections sont administrables : la synchronisation et la clôture
    // valent pour les championnats comme pour les coupes.
    this.competitionService.list().subscribe({
      next: (competitions) => {
        this.competitions = competitions;
        const saved = this.competitionService.selectedCode;
        this.selectedCompetition = competitions.some(c => c.code === saved)
          ? saved!
          : (competitions[0]?.code ?? '');
        this.onCompetitionChanged();
      },
      error: () => {}
    });
  }

  get selectedCompetitionName(): string {
    return this.competitions.find(c => c.code === this.selectedCompetition)?.name ?? '';
  }

  selectCompetition(code: string) {
    if (code === this.selectedCompetition) return;
    this.selectedCompetition = code;
    this.competitionService.selectedCode = code;
    this.syncMessage = '';
    this.selectedJournee = null; // recalcule la journée courante de la nouvelle compétition
    this.closeMatchForm();
    this.onCompetitionChanged();
  }

  private onCompetitionChanged() {
    this.loadMatches();
    this.apiService.getAllEquipes(this.selectedCompetition).subscribe({
      next: (equipes) => this.equipesCompetition = equipes.sort((a, b) => a.name.localeCompare(b.name)),
      error: () => this.equipesCompetition = []
    });
    // Rien à charger côté favoris pour une compétition qui n'en a pas
    if (!this.selectedHasFavoris) {
      return;
    }
    this.favorisService.adminGetEditable(this.selectedCompetition).subscribe({
      next: (res) => this.favorisEditable = res.editable,
      error: () => {}
    });
    this.favorisService.adminGetResultats(this.selectedCompetition).subscribe({
      next: (res) => {
        this.resChampion = res.champion ?? '';
        this.resButeur = res.meilleurButeur ?? '';
        this.resPasseur = res.meilleurPasseur ?? '';
      },
      error: () => {}
    });
  }

  saveResultats() {
    this.savingResultats = true;
    this.favorisService.adminSetResultats(
      this.selectedCompetition,
      this.resChampion || null,
      this.resButeur || null,
      this.resPasseur || null
    ).subscribe({
      next: (res) => {
        this.resChampion = res.champion ?? '';
        this.resButeur = res.meilleurButeur ?? '';
        this.resPasseur = res.meilleurPasseur ?? '';
        this.savingResultats = false;
        this.toast.success('Résultats des favoris validés — les points sont attribués.');
      },
      error: () => {
        this.savingResultats = false;
        this.toast.error('Erreur lors de la validation des résultats.');
      }
    });
  }

  setFavorisEditable(editable: boolean) {
    this.togglingFavoris = true;
    this.favorisService.adminSetEditable(this.selectedCompetition, editable).subscribe({
      next: (res) => {
        this.favorisEditable = res.editable;
        this.togglingFavoris = false;
        this.toast.success(res.editable
          ? 'Modification des favoris activée.'
          : 'Modification des favoris désactivée.');
      },
      error: () => {
        this.togglingFavoris = false;
        this.toast.error('Erreur lors du changement de réglage.');
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.closeMatchForm();
    // Les comptes ne sont chargés qu'à l'ouverture de leur onglet
    if (tab === 'profils' && this.profils.length === 0) {
      this.chargerProfils();
    }
  }

  private chargerProfils() {
    this.loadingProfils = true;
    this.apiService.listerUtilisateurs().subscribe({
      next: (profils) => {
        this.profils = profils;
        this.loadingProfils = false;
      },
      error: (err) => {
        this.loadingProfils = false;
        this.toast.error(messageErreur(err, 'Erreur lors du chargement des comptes.'));
      }
    });
  }

  /**
   * Filtrage côté client : avec une vingtaine de comptes, une recherche
   * serveur serait disproportionnée. Porte sur l'email et le pseudo.
   */
  get profilsFiltres(): UtilisateurDTO[] {
    const recherche = this.filtreProfils.trim().toLowerCase();
    if (!recherche) {
      return this.profils;
    }
    return this.profils.filter(u =>
      u.email.toLowerCase().includes(recherche)
      || (u.username ?? '').toLowerCase().includes(recherche));
  }

  /**
   * Envoi d'un mail à un utilisateur réel : on demande confirmation, et le
   * message de succès nomme le destinataire pour lever toute ambiguïté.
   */
  envoyerReinitialisation(u: UtilisateurDTO) {
    const accord = confirm(
      `Envoyer un lien de réinitialisation de mot de passe à ${u.username} (${u.email}) ?`);
    if (!accord) {
      return;
    }
    this.envoiEnCours = u.email;
    this.apiService.envoyerReinitialisation(u.email).subscribe({
      next: () => {
        this.envoiEnCours = null;
        this.toast.success(`Lien de réinitialisation envoyé à ${u.email}.`);
      },
      error: (err) => {
        this.envoiEnCours = null;
        this.toast.error(messageErreur(err, "Erreur lors de l'envoi du lien."));
      }
    });
  }

  syncCompetition() {
    this.syncing = true;
    this.syncMessage = '';
    this.syncError = false;
    this.apiService.syncCompetition(this.selectedCompetition).subscribe({
      next: (result) => {
        this.syncing = false;
        this.syncMessage = `Synchronisation terminée : ${result.total} matchs traités — `
          + `${result.equipesCreees} équipe(s) créée(s), ${result.matchsCrees} match(s) créé(s), `
          + `${result.matchsMisAJour} mis à jour`
          + (result.classementLignes > 0 ? `, classement (${result.classementLignes} équipes).` : '.');
        this.loadMatches();
        this.loadEquipes();
      },
      error: (error) => {
        console.error('Erreur lors de la synchronisation:', error);
        this.syncing = false;
        this.syncError = true;
        this.syncMessage = 'Échec de la synchronisation : ' + this.extractErrorMessage(error);
      }
    });
  }

  /** Extrait le message d'erreur renvoyé par le backend (sinon message générique). */
  private extractErrorMessage(error: any): string {
    const raw = error?.error?.message;
    if (typeof raw === 'string' && raw.length > 0) {
      // Le backend renvoie parfois « 503 SERVICE_UNAVAILABLE "message" » : on extrait le message
      const quoted = raw.match(/"([^"]+)"/);
      return quoted ? quoted[1] : raw;
    }
    if (error?.status === 0) {
      return 'le serveur est injoignable (backend arrêté ?).';
    }
    return `erreur ${error?.status ?? '?'}. Réessayez dans quelques instants.`;
  }

  loadMatches() {
    this.loading = true;
    this.matchService.getAllMatches(this.selectedCompetition).subscribe({
      next: (matches) => {
        this.matches = matches.sort((a, b) =>
          new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime()
        );
        this.computeJournees();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des matchs:', error);
        this.toast.error('Erreur lors du chargement des matchs.');
        this.loading = false;
      }
    });
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

  prevJournee() {
    const i = this.journees.indexOf(this.selectedJournee!);
    if (i > 0) {
      this.selectedJournee = this.journees[i - 1];
    }
  }

  nextJournee() {
    const i = this.journees.indexOf(this.selectedJournee!);
    if (i >= 0 && i < this.journees.length - 1) {
      this.selectedJournee = this.journees[i + 1];
    }
  }

  get canPrevJournee(): boolean {
    return this.journees.indexOf(this.selectedJournee!) > 0;
  }

  get canNextJournee(): boolean {
    const i = this.journees.indexOf(this.selectedJournee!);
    return i >= 0 && i < this.journees.length - 1;
  }

  loadEquipes() {
    this.equipeService.getAllEquipes().subscribe({
      next: (equipes) => {
        this.equipes = equipes;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des équipes:', error);
        this.toast.error('Erreur lors du chargement des équipes.');
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
          this.toast.success('Match modifié !');
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.toast.error('Erreur lors de la modification du match.');
          this.loading = false;
        }
      });
    } else {
      // Création : rattache le match à la compétition sélectionnée
      match.competition = this.selectedCompetition;
      this.matchService.createMatch(match).subscribe({
        next: () => {
          this.closeMatchForm();
          this.loadMatches();
          this.toast.success('Match créé !');
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.toast.error('Erreur lors de la création du match.');
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
          this.toast.success('Match supprimé.');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.toast.error('Erreur lors de la suppression du match.');
          this.loading = false;
        }
      });
    }
  }

  // Gestion des équipes
  createEquipe() {
    if (!this.newEquipe.name.trim()) {
      this.toast.error('Veuillez remplir le nom de l\'équipe.');
      return;
    }

    this.loading = true;
    this.equipeService.createEquipe(this.newEquipe).subscribe({
      next: () => {
        this.newEquipe = { name: '' };
        this.loadEquipes();
        this.toast.success('Équipe créée !');
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la création de l\'équipe:', error);
        this.toast.error('Erreur lors de la création de l\'équipe.');
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
          this.toast.success('Équipe supprimée.');
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.toast.error('Erreur lors de la suppression de l\'équipe.');
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