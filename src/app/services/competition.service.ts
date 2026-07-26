// src/app/services/competition.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Competition {
  code: string;
  name: string;
  icone: string;
}

const SELECTED_KEY = 'myprono_competition';

@Injectable({ providedIn: 'root' })
export class CompetitionService {
  private readonly baseUrl = environment.apiUrl;
  private cache$?: Observable<Competition[]>;

  constructor(private http: HttpClient) {}

  list(): Observable<Competition[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<Competition[]>(`${this.baseUrl}/competitions`).pipe(shareReplay(1));
    }
    return this.cache$;
  }

  /** Compétition sélectionnée par l'utilisateur (partagée entre Matchs et Favoris). */
  get selectedCode(): string | null {
    return localStorage.getItem(SELECTED_KEY);
  }

  set selectedCode(code: string | null) {
    if (code) {
      localStorage.setItem(SELECTED_KEY, code);
    }
  }
}
