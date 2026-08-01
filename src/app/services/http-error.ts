// src/app/services/http-error.ts
// Traduction d'une erreur HTTP en message utilisable par l'utilisateur.
//
// Le back renvoie des informations exploitables qu'il serait dommage de perdre :
//  - erreurs de validation détaillées par champ (fieldErrors) ;
//  - message métier pour les conflits, parfois enrobé : 409 CONFLICT "…".
// Sans cela, l'utilisateur reçoit « une erreur est survenue » et ne sait pas
// quoi corriger.

interface ErreurChamp {
  property?: string;
  message?: string;
}

/**
 * @param err        erreur renvoyée par HttpClient
 * @param defaut     message de repli, quand rien d'exploitable n'est disponible
 * @param libelles   nom lisible de chaque champ (ex. { password: 'Mot de passe' })
 */
export function messageErreur(err: any, defaut: string,
    libelles: Record<string, string> = {}): string {

  // Statut 0 : la requête n'a pas abouti (serveur arrêté, réseau, CORS).
  // C'est le cas le plus déroutant pour l'utilisateur s'il n'est pas nommé.
  if (err?.status === 0) {
    return 'Le serveur est injoignable. Vérifiez votre connexion, puis réessayez.';
  }

  const corps = err?.error;

  // Validation : on rend le détail par champ, seul vraiment actionnable
  const champs: ErreurChamp[] = corps?.fieldErrors;
  if (Array.isArray(champs) && champs.length > 0) {
    return champs
      .map(c => {
        const libelle = c.property ? libelles[c.property] : undefined;
        return libelle ? `${libelle} : ${c.message}` : c.message;
      })
      .filter(Boolean)
      .join(' ');
  }

  const brut = corps?.message;
  if (typeof brut === 'string' && brut.length > 0) {
    // Les ResponseStatusException arrivent sous la forme : 409 CONFLICT "message"
    const cite = brut.match(/"([^"]+)"/);
    return cite ? cite[1] : brut;
  }

  if (typeof err?.status === 'number' && err.status >= 500) {
    return 'Le serveur a rencontré une erreur. Réessayez dans un instant ; '
      + 'si cela persiste, signalez-le à l\'administrateur.';
  }

  return defaut;
}
