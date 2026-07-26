// src/app/services/favoris.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Favoris {
  champion: string | null;
  meilleurButeur: string | null;
  meilleurPasseur: string | null;
  editable: boolean;
}

export interface OfficialFavoris {
  champion: string | null;
  meilleurButeur: string | null;
  meilleurPasseur: string | null;
}

@Injectable({ providedIn: 'root' })
export class FavorisService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMine(competition: string): Observable<Favoris> {
    return this.http.get<Favoris>(`${this.baseUrl}/favoris/me?competition=${competition}`);
  }

  update(competition: string, champion: string | null, meilleurButeur: string | null, meilleurPasseur: string | null): Observable<Favoris> {
    return this.http.put<Favoris>(`${this.baseUrl}/favoris/me?competition=${competition}`, { champion, meilleurButeur, meilleurPasseur });
  }

  // Admin
  adminGetEditable(competition: string): Observable<{ editable: boolean }> {
    return this.http.get<{ editable: boolean }>(`${this.baseUrl}/admin/favoris/editable?competition=${competition}`);
  }

  adminSetEditable(competition: string, editable: boolean): Observable<{ editable: boolean }> {
    return this.http.put<{ editable: boolean }>(`${this.baseUrl}/admin/favoris/editable?competition=${competition}`, { editable });
  }

  adminGetResultats(competition: string): Observable<OfficialFavoris> {
    return this.http.get<OfficialFavoris>(`${this.baseUrl}/admin/favoris/resultats?competition=${competition}`);
  }

  adminSetResultats(competition: string, champion: string | null, meilleurButeur: string | null, meilleurPasseur: string | null): Observable<OfficialFavoris> {
    return this.http.put<OfficialFavoris>(`${this.baseUrl}/admin/favoris/resultats?competition=${competition}`, { champion, meilleurButeur, meilleurPasseur });
  }
}
