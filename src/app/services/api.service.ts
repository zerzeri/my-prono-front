
// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EquipeDTO {
  id?: number;
  name: string;
}

export interface MatchDTO {
  id?: number;
  equipe1: string;
  equipe2: string;
  resultat?: string;
  dateMatch: string; // Format ISO string pour les échanges avec l'API
}

export interface PronosticDTO {
  id?: number;
  pronostic: string;
  match?: number; // ID du match
}

export interface IndividuDTO {
  id?: number;
  name: string;
}

export interface JoueurDTO {
  id?: number;
  name: string;
  poste?: string;
}

export interface WorldCupSyncResult {
  equipesCreees: number;
  matchsCrees: number;
  matchsMisAJour: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Équipes
  getAllEquipes(): Observable<EquipeDTO[]> {
    return this.http.get<EquipeDTO[]>(`${this.baseUrl}/equipes`);
  }

  getEquipe(id: number): Observable<EquipeDTO> {
    return this.http.get<EquipeDTO>(`${this.baseUrl}/equipes/${id}`);
  }

  createEquipe(equipe: EquipeDTO): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/equipes`, equipe);
  }

  updateEquipe(id: number, equipe: EquipeDTO): Observable<number> {
    return this.http.put<number>(`${this.baseUrl}/equipes/${id}`, equipe);
  }

  deleteEquipe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/equipes/${id}`);
  }

  // Matchs
  getAllMatches(): Observable<MatchDTO[]> {
    return this.http.get<MatchDTO[]>(`${this.baseUrl}/matches`);
  }

  getMatch(id: number): Observable<MatchDTO> {
    return this.http.get<MatchDTO>(`${this.baseUrl}/matches/${id}`);
  }

  createMatch(match: MatchDTO): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/matches`, match);
  }

  updateMatch(id: number, match: MatchDTO): Observable<number> {
    return this.http.put<number>(`${this.baseUrl}/matches/${id}`, match);
  }

  deleteMatch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/matches/${id}`);
  }

  // Pronostics
  getAllPronostics(): Observable<PronosticDTO[]> {
    return this.http.get<PronosticDTO[]>(`${this.baseUrl}/pronostics`);
  }

  getMyPronostics(): Observable<PronosticDTO[]> {
    return this.http.get<PronosticDTO[]>(`${this.baseUrl}/pronostics/mine`);
  }

  getPronostic(id: number): Observable<PronosticDTO> {
    return this.http.get<PronosticDTO>(`${this.baseUrl}/pronostics/${id}`);
  }

  createPronostic(pronostic: PronosticDTO): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/pronostics`, pronostic);
  }

  updatePronostic(id: number, pronostic: PronosticDTO): Observable<number> {
    return this.http.put<number>(`${this.baseUrl}/pronostics/${id}`, pronostic);
  }

  deletePronostic(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pronostics/${id}`);
  }

  // Individus
  getAllIndividus(): Observable<IndividuDTO[]> {
    return this.http.get<IndividuDTO[]>(`${this.baseUrl}/individus`);
  }

  createIndividu(individu: IndividuDTO): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/individus`, individu);
  }

  // Synchronisation Coupe du Monde 2026 (admin)
  syncWorldCup(): Observable<WorldCupSyncResult> {
    return this.http.post<WorldCupSyncResult>(`${this.baseUrl}/admin/worldcup/sync`, {});
  }

  // Joueurs
  getAllJoueurs(): Observable<JoueurDTO[]> {
    return this.http.get<JoueurDTO[]>(`${this.baseUrl}/joueurs`);
  }

  createJoueur(joueur: JoueurDTO): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/joueurs`, joueur);
  }
}