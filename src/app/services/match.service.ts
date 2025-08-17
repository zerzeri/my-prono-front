// src/app/services/match.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MatchDTO } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private readonly baseUrl = '/api/matches';
  private matchesSubject = new BehaviorSubject<MatchDTO[]>([]);
  public matches$ = this.matchesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllMatches(): Observable<MatchDTO[]> {
    return this.http.get<MatchDTO[]>(this.baseUrl).pipe(
      tap(matches => this.matchesSubject.next(matches))
    );
  }

  getMatch(id: number): Observable<MatchDTO> {
    return this.http.get<MatchDTO>(`${this.baseUrl}/${id}`);
  }

  createMatch(match: MatchDTO): Observable<number> {
    console.log(`Calling POST ${this.baseUrl}`, match);
    return this.http.post<number>(this.baseUrl, match).pipe(
      tap(() => this.loadMatches())
    );
  }

  updateMatch(id: number, match: MatchDTO): Observable<number> {
    console.log(`Calling PUT ${this.baseUrl}/${id}`, match);
    return this.http.put<number>(`${this.baseUrl}/${id}`, match).pipe(
      tap(() => this.loadMatches())
    );
  }

  deleteMatch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.loadMatches())
    );
  }

  private loadMatches(): void {
    this.getAllMatches().subscribe();
  }

  // Méthodes utilitaires
  getUpcomingMatches(): MatchDTO[] {
    const now = new Date();
    return this.matchesSubject.value.filter(match => 
      !match.resultat && new Date(match.dateMatch) >= now
    );
  }

  getFinishedMatches(): MatchDTO[] {
    const now = new Date();
    return this.matchesSubject.value.filter(match => 
      match.resultat || new Date(match.dateMatch) < now
    );
  }

  getTodayMatches(): MatchDTO[] {
    const today = new Date();
    return this.matchesSubject.value.filter(match => {
      const matchDate = new Date(match.dateMatch);
      return matchDate.toDateString() === today.toDateString();
    });
  }
}