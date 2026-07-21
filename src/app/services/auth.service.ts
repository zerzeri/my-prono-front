// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  token: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
}

export interface UserInfo {
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  passwordHash: string;
}

const STORAGE_KEY = 'myprono_auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = environment.apiUrl;

  private userSubject = new BehaviorSubject<AuthUser | null>(this.loadFromStorage());
  readonly user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  get user(): AuthUser | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.user?.token ?? null;
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  /** identifier : email OU nom d'utilisateur */
  login(identifier: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/auth/login`, { identifier, password }).pipe(
      tap(user => this.store(user))
    );
  }

  register(email: string, username: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/auth/register`, { email, username, password }).pipe(
      tap(user => this.store(user))
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/reset-password`, { token, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/account/change-password`, { currentPassword, newPassword });
  }

  getMe(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.baseUrl}/account/me`);
  }

  changeUsername(username: string): Observable<UserInfo> {
    return this.http.post<UserInfo>(`${this.baseUrl}/account/change-username`, { username }).pipe(
      tap(info => {
        // Met à jour le username dans la session courante (le token reste valide)
        const current = this.user;
        if (current) {
          this.store({ ...current, username: info.username });
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.userSubject.next(null);
  }

  private store(user: AuthUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private loadFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
