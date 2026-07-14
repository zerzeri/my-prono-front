// src/app/services/equipe.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EquipeDTO } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EquipeService {
  private readonly baseUrl = `${environment.apiUrl}/equipes`;
  private equipesSubject = new BehaviorSubject<EquipeDTO[]>([]);
  public equipes$ = this.equipesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadEquipes();
  }

  getAllEquipes(): Observable<EquipeDTO[]> {
    return this.http.get<EquipeDTO[]>(this.baseUrl).pipe(
      tap(equipes => this.equipesSubject.next(equipes))
    );
  }

  getEquipe(id: number): Observable<EquipeDTO> {
    return this.http.get<EquipeDTO>(`${this.baseUrl}/${id}`);
  }

  createEquipe(equipe: EquipeDTO): Observable<number> {
    return this.http.post<number>(this.baseUrl, equipe).pipe(
      tap(() => this.loadEquipes()) // Recharger la liste après création
    );
  }

  updateEquipe(id: number, equipe: EquipeDTO): Observable<number> {
    return this.http.put<number>(`${this.baseUrl}/${id}`, equipe).pipe(
      tap(() => this.loadEquipes()) // Recharger la liste après mise à jour
    );
  }

  deleteEquipe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.loadEquipes()) // Recharger la liste après suppression
    );
  }

  private loadEquipes(): void {
    this.getAllEquipes().subscribe();
  }

  // Méthodes utilitaires
  getEquipeById(id: number): EquipeDTO | undefined {
    return this.equipesSubject.value.find(equipe => equipe.id === id);
  }

  getEquipesExcept(excludeId: number): EquipeDTO[] {
    return this.equipesSubject.value.filter(equipe => equipe.id !== excludeId);
  }
}