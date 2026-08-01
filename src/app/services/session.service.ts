// src/app/services/session.service.ts
// Déconnexion automatique après une période sans activité dans l'interface.
//
// L'activité se mesure sur les gestes de l'utilisateur — clic, frappe,
// défilement, navigation — et non sur les appels à l'API : quelqu'un qui lit
// les matchs sans rien cliquer ne doit pas être déconnecté en pleine lecture.
//
// Portée : cette protection couvre l'écran laissé sans surveillance. Elle vide
// la session du navigateur, mais le jeton reste valable côté serveur jusqu'à
// son expiration propre — voir la note dans plan-v2.md.
import { Injectable, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/** Gestes considérés comme une activité. Volontairement sans mousemove, trop bavard. */
const EVENEMENTS_ACTIVITE = ['click', 'keydown', 'scroll', 'touchstart'];

const AVERTISSEMENT_SECONDES = 60;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly dureeMs = Math.max(environment.inactiviteMinutes, 1) * 60_000;

  private timerAvertissement?: ReturnType<typeof setTimeout>;
  private timerDeconnexion?: ReturnType<typeof setTimeout>;
  private timerDecompte?: ReturnType<typeof setInterval>;
  private ecouteActive = false;

  /** Secondes restantes pendant l'avertissement ; null le reste du temps. */
  private readonly compteARebours = new BehaviorSubject<number | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router,
    private zone: NgZone
  ) {}

  get avertissement$(): Observable<number | null> {
    return this.compteARebours.asObservable();
  }

  /**
   * Suit l'état de connexion : le compteur ne tourne que pour un utilisateur
   * connecté, et s'arrête de lui-même à la déconnexion.
   */
  demarrer(): void {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.activerEcoute();
        this.reinitialiser();
      } else {
        this.arreter();
      }
    });

    // Naviguer est une activité à part entière
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.auth.isLoggedIn) {
          this.reinitialiser();
        }
      });
  }

  /** Prolonge la session depuis l'avertissement. */
  prolonger(): void {
    this.reinitialiser();
  }

  private activerEcoute(): void {
    if (this.ecouteActive) {
      return;
    }
    this.ecouteActive = true;
    // Hors zone Angular : ces événements sont fréquents et ne doivent pas
    // déclencher de détection de changement à chaque occurrence.
    this.zone.runOutsideAngular(() => {
      for (const evenement of EVENEMENTS_ACTIVITE) {
        document.addEventListener(evenement, this.surActivite, { passive: true });
      }
    });
  }

  private readonly surActivite = () => {
    // Pendant l'avertissement, seule une action explicite prolonge la session :
    // sinon un simple défilement annulerait la déconnexion sans que
    // l'utilisateur ait vu le message.
    if (this.compteARebours.value === null) {
      this.reinitialiser();
    }
  };

  private reinitialiser(): void {
    this.viderTimers();
    if (!this.auth.isLoggedIn) {
      return;
    }
    const avantAvertissement = Math.max(this.dureeMs - AVERTISSEMENT_SECONDES * 1000, 0);
    this.timerAvertissement = setTimeout(() => this.avertir(), avantAvertissement);
  }

  private avertir(): void {
    // Retour dans la zone Angular : l'affichage doit se mettre à jour
    this.zone.run(() => {
      let restant = AVERTISSEMENT_SECONDES;
      this.compteARebours.next(restant);

      this.timerDecompte = setInterval(() => {
        restant--;
        this.zone.run(() => this.compteARebours.next(Math.max(restant, 0)));
      }, 1000);

      this.timerDeconnexion = setTimeout(
        () => this.zone.run(() => this.deconnecter()),
        AVERTISSEMENT_SECONDES * 1000);
    });
  }

  private deconnecter(): void {
    this.viderTimers();
    this.auth.logout();
    this.router.navigate(['/login'], { queryParams: { expire: 1 } });
  }

  private arreter(): void {
    this.viderTimers();
  }

  private viderTimers(): void {
    clearTimeout(this.timerAvertissement);
    clearTimeout(this.timerDeconnexion);
    clearInterval(this.timerDecompte);
    this.timerAvertissement = undefined;
    this.timerDeconnexion = undefined;
    this.timerDecompte = undefined;
    if (this.compteARebours.value !== null) {
      this.compteARebours.next(null);
    }
  }
}
