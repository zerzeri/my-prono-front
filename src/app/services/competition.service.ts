// src/app/services/competition.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

/** Rubriques du produit. Seule CHAMPIONNAT a une interface en V1. */
export type Section = 'CHAMPIONNAT' | 'CHAMPIONS_LEAGUE' | 'COUPE_INTERNATIONALE';

export interface Competition {
  code: string;
  name: string;
  icone: string;
  section: Section;
  hasStandings: boolean;
  hasFavoris: boolean;
  /** Compétition terminée : consultable en archive, fermée aux pronostics. */
  cloturee: boolean;
}

export interface ClassementLigne {
  position: number;
  team: string;
  joues: number;
  gagnes: number;
  nuls: number;
  perdus: number;
  butsPour: number;
  butsContre: number;
  difference: number;
  points: number;
  /** Phases de poules uniquement : l'équipe poursuit au tour suivant. */
  qualifie: boolean;
}

/** Classement d'un groupe de poule, calculé par le back à partir des matchs. */
export interface Poule {
  groupe: string;
  libelle: string;
  classement: ClassementLigne[];
}

/** Phase de poules : les groupes, plus le classement transversal des troisièmes. */
export interface Poules {
  poules: Poule[];
  troisiemes: ClassementLigne[];
}

const SELECTED_KEY = 'myprono_competition';

@Injectable({ providedIn: 'root' })
export class CompetitionService {
  private readonly baseUrl = environment.apiUrl;
  private readonly cache = new Map<string, Observable<Competition[]>>();

  constructor(private http: HttpClient) {}

  /** Compétitions d'une section (toutes si la section est omise). */
  list(section?: Section): Observable<Competition[]> {
    const key = section ?? 'ALL';
    let cached = this.cache.get(key);
    if (!cached) {
      const url = section
        ? `${this.baseUrl}/competitions?section=${section}`
        : `${this.baseUrl}/competitions`;
      cached = this.http.get<Competition[]>(url).pipe(shareReplay(1));
      this.cache.set(key, cached);
    }
    return cached;
  }

  classement(code: string): Observable<ClassementLigne[]> {
    return this.http.get<ClassementLigne[]>(`${this.baseUrl}/competitions/${code}/classement`);
  }

  /** Phase de poules (coupes internationales) : groupes et troisièmes. */
  poules(code: string): Observable<Poules> {
    return this.http.get<Poules>(`${this.baseUrl}/competitions/${code}/poules`);
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
