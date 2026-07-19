// src/app/services/ligue.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LigueDTO {
  id: number;
  name: string;
  inviteCode: string;
  createur: string;
  membres: string[];
}

export interface ClassementEntry {
  email: string;
  points: number;
  bonsResultats: number;
  scoresExacts: number;
  pronostics: number;
}

@Injectable({
  providedIn: 'root'
})
export class LigueService {
  private readonly baseUrl = `${environment.apiUrl}/ligues`;

  constructor(private http: HttpClient) {}

  create(name: string): Observable<LigueDTO> {
    return this.http.post<LigueDTO>(this.baseUrl, { name });
  }

  mine(): Observable<LigueDTO[]> {
    return this.http.get<LigueDTO[]>(`${this.baseUrl}/mine`);
  }

  join(code: string): Observable<LigueDTO> {
    return this.http.post<LigueDTO>(`${this.baseUrl}/join`, { code });
  }

  classement(ligueId: number): Observable<ClassementEntry[]> {
    return this.http.get<ClassementEntry[]>(`${this.baseUrl}/${ligueId}/classement`);
  }
}
