// src/app/components/regles/regles.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-regles',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h2>Règles du jeu</h2>
      <p class="subtitle">Comment marquer des points et grimper au classement.</p>
    </div>

    <div class="card section">
      <h3>Le principe</h3>
      <p>
        Avant le coup d'envoi de chaque match, indiquez le score que vous
        pronostiquez (buts de l'équipe 1 et buts de l'équipe 2). Vous pouvez
        modifier votre pronostic autant de fois que vous voulez jusqu'au début
        du match. Une fois le match commencé, les pronostics sont fermés.
      </p>
    </div>

    <div class="card section">
      <h3>Les points</h3>
      <div class="points-grid">
        <div class="point-card">
          <span class="pts">2 pts</span>
          <h4>Bon résultat</h4>
          <p>
            Vous avez prédit le bon vainqueur, ou le match nul, sur le score
            final <strong>prolongations comprises</strong> (mais sans le score exact).
          </p>
        </div>
        <div class="point-card highlight">
          <span class="pts">5 pts</span>
          <h4>Score exact</h4>
          <p>
            Vous avez trouvé le score exact du temps réglementaire
            (prolongations comprises). Le bon résultat est inclus : 2 + 3 = 5 points.
          </p>
        </div>
        <div class="point-card">
          <span class="pts">0 pt</span>
          <h4>Résultat manqué</h4>
          <p>Le vainqueur pronostiqué n'est pas le bon.</p>
        </div>
      </div>
    </div>

    <div class="card section">
      <h3>Exemples</h3>
      <p class="subtitle" style="margin-bottom: 0.75rem">Match réel : <strong>France 2 - 1 Brésil</strong></p>
      <ul class="examples">
        <li><span class="chip">2 - 1</span> → score exact → <strong>5 points</strong></li>
        <li><span class="chip">3 - 0</span> → bonne victoire de la France → <strong>2 points</strong></li>
        <li><span class="chip">1 - 1</span> → nul prédit, victoire réelle → <strong>0 point</strong></li>
      </ul>
    </div>

    <div class="card section">
      <h3>Les ligues</h3>
      <p>
        Créez une ligue et partagez le lien d'invitation avec vos amis, ou
        rejoignez-en une avec un lien reçu. Le classement de chaque ligue
        additionne les points de tous ses membres selon les règles ci-dessus.
      </p>
    </div>
  `,
  styles: [`
    .section {
      padding: 1.5rem;
      margin-bottom: 1.25rem;
    }

    .section h3 {
      font-size: 1.15rem;
      margin-bottom: 0.75rem;
    }

    .section p {
      color: var(--text-2);
    }

    .points-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
      gap: 1rem;
    }

    .point-card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.1rem;
      background: var(--surface-2);
    }

    .point-card.highlight {
      border-color: #abefc6;
      background: var(--success-soft);
    }

    .point-card .pts {
      display: inline-block;
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--brand-strong);
      margin-bottom: 0.4rem;
    }

    .point-card h4 {
      font-size: 0.95rem;
      margin-bottom: 0.4rem;
    }

    .point-card p {
      font-size: 0.85rem;
    }

    .examples {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      color: var(--text-2);
    }

    .chip {
      display: inline-block;
      font-weight: 700;
      color: var(--text);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.2rem 0.6rem;
      margin-right: 0.35rem;
    }
  `]
})
export class ReglesComponent {}
