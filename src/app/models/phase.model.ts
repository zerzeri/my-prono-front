// src/app/models/phase.model.ts
// Phases d'une compétition, telles que fournies par la source de données.
// Vocabulaire commun à la Ligue des Champions (V2) et aux coupes
// internationales (V3) : les deux enchaînent une première phase puis des tours
// à élimination directe.

/** Phase unique d'un championnat national : rien à distinguer. */
export const PHASE_CHAMPIONNAT = 'REGULAR_SEASON';

/** Première phase de la Ligue des Champions : classement unique, 8 journées. */
export const PHASE_LIGUE = 'LEAGUE_STAGE';

/** Libellés affichés, dans l'ordre de déroulement de la compétition. */
export const LIBELLES_PHASES: { code: string; libelle: string }[] = [
  { code: PHASE_LIGUE, libelle: 'Phase de ligue' },
  { code: 'PLAYOFFS', libelle: 'Barrages' },
  { code: 'LAST_16', libelle: '8es de finale' },
  { code: 'QUARTER_FINALS', libelle: 'Quarts' },
  { code: 'SEMI_FINALS', libelle: 'Demies' },
  { code: 'FINAL', libelle: 'Finale' }
];

export function libellePhase(code: string): string {
  return LIBELLES_PHASES.find(p => p.code === code)?.libelle ?? code;
}

/** Vrai pour un tour à élimination directe (barrages compris). */
export function estPhaseFinale(code: string | undefined | null): boolean {
  return !!code && code !== PHASE_LIGUE && code !== PHASE_CHAMPIONNAT;
}

/**
 * Ordonne les phases selon le déroulement réel de la compétition. Les phases
 * inconnues sont rejetées à la fin plutôt que masquées.
 */
export function ordonnerPhases(codes: string[]): string[] {
  const ordre = LIBELLES_PHASES.map(p => p.code);
  return [...codes].sort((a, b) => {
    const ia = ordre.indexOf(a);
    const ib = ordre.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}
