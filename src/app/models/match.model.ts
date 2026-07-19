// src/app/models/match.model.ts
// Aligné sur le MatchDTO du backend : equipe1/equipe2 portent les noms des équipes.
export interface MatchDTO {
  id?: number;
  equipe1Id: number;
  equipe2Id: number;
  equipe1?: string;
  equipe2?: string;
  dateMatch: string;
  resultat?: string;
}
