// src/app/models/match.model.ts
export interface MatchDTO {
  id?: number;
  equipe1Id: number;
  equipe2Id: number;
  equipe1Name?: string;  // Pour l'affichage
  equipe2Name?: string;  // Pour l'affichage
  dateMatch: string;
  resultat?: string;
}
