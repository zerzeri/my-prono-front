// src/app/models/phase.model.ts
// Phases d'une compétition, telles que fournies par la source de données.
// Vocabulaire commun à la Ligue des Champions (V2) et aux coupes
// internationales (V3) : les deux enchaînent une première phase puis des tours
// à élimination directe.

/** Phase unique d'un championnat national : rien à distinguer. */
export const PHASE_CHAMPIONNAT = 'REGULAR_SEASON';

/** Première phase de la Ligue des Champions : classement unique, 8 journées. */
export const PHASE_LIGUE = 'LEAGUE_STAGE';

/** Première phase des coupes internationales : poules. */
export const PHASE_POULES = 'GROUP_STAGE';

/** Libellés affichés, dans l'ordre de déroulement de la compétition. */
export const LIBELLES_PHASES: { code: string; libelle: string }[] = [
  { code: PHASE_LIGUE, libelle: 'Phase de ligue' },
  { code: PHASE_POULES, libelle: 'Phase de poules' },
  { code: 'PLAYOFFS', libelle: 'Barrages' },
  { code: 'LAST_32', libelle: '16es de finale' },
  { code: 'LAST_16', libelle: '8es de finale' },
  { code: 'QUARTER_FINALS', libelle: 'Quarts' },
  { code: 'SEMI_FINALS', libelle: 'Demies' },
  // La petite finale se joue la veille de la finale : elle la précède ici
  { code: 'THIRD_PLACE', libelle: 'Petite finale' },
  { code: 'FINAL', libelle: 'Finale' }
];

export function libellePhase(code: string): string {
  return LIBELLES_PHASES.find(p => p.code === code)?.libelle ?? code;
}

/** Vrai pour un tour à élimination directe (barrages et petite finale compris). */
export function estPhaseFinale(code: string | undefined | null): boolean {
  return !!code && code !== PHASE_LIGUE && code !== PHASE_POULES && code !== PHASE_CHAMPIONNAT;
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
