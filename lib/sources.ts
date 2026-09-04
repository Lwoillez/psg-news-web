export type SourceId =
  | "planete-psg"
  | "les-titis"
  | "paris-fans"
  | "canal-supporters"
  | "rmc-sport";

export interface Source {
  id: SourceId;
  displayName: string;
  feedUrl: string;
  /** RMC Sport n'a pas de flux PSG dédié : on filtre le flux Ligue 1 général sur un mot-clé. */
  requiresKeywordFilter?: boolean;
}

/**
 * Sources vérifiées manuellement en septembre 2026 (voir README) :
 *  - Planète PSG, Les Titis du PSG et ParisFans exposent un flux RSS 2.0 standard.
 *  - Canal Supporters (domaine canal-supporters.com, avec un tiret) expose très
 *    probablement /feed/ mais n'a pas pu être vérifié en direct (rate-limit au
 *    moment du test) : à confirmer.
 *  - RMC Sport n'a pas de flux dédié PSG : on utilise le flux Ligue 1 général et on
 *    filtre côté serveur sur "psg" / "paris saint-germain" / "paris sg".
 *  - Foot Parisien n'a pas de flux RSS propre et republie du contenu d'autres sites
 *    (dont Planète PSG) : exclu par défaut pour éviter les doublons.
 */
export const SOURCES: Source[] = [
  { id: "planete-psg", displayName: "Planète PSG", feedUrl: "https://www.planetepsg.com/feed/" },
  { id: "les-titis", displayName: "Les Titis du PSG", feedUrl: "https://www.lestitisdupsg.fr/feed/" },
  { id: "paris-fans", displayName: "ParisFans", feedUrl: "https://www.parisfans.fr/feed" },
  {
    id: "canal-supporters",
    displayName: "Canal Supporters",
    feedUrl: "https://canal-supporters.com/feed/",
  },
  {
    id: "rmc-sport",
    displayName: "RMC Sport",
    feedUrl: "https://rmcsport.bfmtv.com/rss/football/ligue-1/",
    requiresKeywordFilter: true,
  },
];

export function getSource(id: SourceId): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}

/**
 * Favicon du site source, utilisé comme vignette de repli quand un article n'a
 * pas d'image (pas de vignette RSS). Passe par le service de favicons de Google
 * plutôt que /favicon.ico en direct : plus fiable (fallback intégré) et évite les
 * soucis de hotlink protection qu'on a déjà rencontrés avec les images d'articles.
 */
export function getSourceFaviconUrl(id: SourceId): string | undefined {
  const source = getSource(id);
  if (!source) return undefined;
  const host = new URL(source.feedUrl).host;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}
