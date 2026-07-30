
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
  competition?: string;
  journee?: number;
  // Phase de la compétition : REGULAR_SEASON, LEAGUE_STAGE, LAST_16, FINAL…
  phase?: string;
}

export interface PronosticDTO {
  id?: number;
  pronostic: string;
  match?: number; // ID du match
}

export interface SyncResult {
  equipesCreees: number;
  matchsCrees: number;
  matchsMisAJour: number;
  total: number;
  classementLignes: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Équipes (toutes, ou celles d'une compétition donnée)
  getAllEquipes(competition?: string): Observable<EquipeDTO[]> {
    const url = competition
      ? `${this.baseUrl}/equipes?competition=${encodeURIComponent(competition)}`
      : `${this.baseUrl}/equipes`;
    return this.http.get<EquipeDTO[]>(url);
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
  getAllMatches(competition?: string): Observable<MatchDTO[]> {
    const url = competition
      ? `${this.baseUrl}/matches?competition=${encodeURIComponent(competition)}`
      : `${this.baseUrl}/matches`;
    return this.http.get<MatchDTO[]>(url);
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

  // Synchronisation d'une compétition (admin)
  syncCompetition(code: string): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${this.baseUrl}/admin/competitions/${code}/sync`, {});
  }

}