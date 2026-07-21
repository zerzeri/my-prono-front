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

@Injectable({ providedIn: 'root' })
export class FavorisService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMine(): Observable<Favoris> {
    return this.http.get<Favoris>(`${this.baseUrl}/favoris/me`);
  }

  update(champion: string | null, meilleurButeur: string | null, meilleurPasseur: string | null): Observable<Favoris> {
    return this.http.put<Favoris>(`${this.baseUrl}/favoris/me`, { champion, meilleurButeur, meilleurPasseur });
  }

  // Admin
  adminGetEditable(): Observable<{ editable: boolean }> {
    return this.http.get<{ editable: boolean }>(`${this.baseUrl}/admin/favoris/editable`);
  }

  adminSetEditable(editable: boolean): Observable<{ editable: boolean }> {
    return this.http.put<{ editable: boolean }>(`${this.baseUrl}/admin/favoris/editable`, { editable });
  }
}
