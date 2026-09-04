import { createHash } from "node:crypto";

/**
 * Identifiant court et stable dérivé du lien de l'article, utilisé dans l'URL
 * /article/[id] — on évite de mettre l'URL complète (et souvent moche) de la
 * source dans notre propre URL.
 */
export function articleId(link: string): string {
  return createHash("sha1").update(link).digest("hex").slice(0, 12);
}
