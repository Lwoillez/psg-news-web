import { unstable_cache } from "next/cache";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

/**
 * Extraction du texte complet d'un article — appelée quand on ouvre sa page de
 * détail, ou en préchauffage pour les articles du jour (voir warmTodayArticles
 * ci-dessous, appelée depuis /api/refresh). Pas de préchauffage pour les articles
 * plus anciens : ils sont quasiment toujours déjà en cache (30 jours) et, sinon,
 * une extraction à la demande suffit — voir la discussion sur l'approche hybride
 * RSS + extraction ponctuelle dans le README.
 *
 * Texte seul (pas d'images intégrées : la vignette RSS en tête d'article suffit).
 *
 * Mise en cache 30 jours par lien (le contenu d'un article déjà publié ne change
 * pour ainsi dire jamais) : on ne re-tape pas le site source à chaque visite.
 */
export const getFullContent = unstable_cache(
  async (link: string): Promise<string[] | null> => {
    try {
      const response = await fetch(link, {
        headers: { "User-Agent": "PsgNewsWeb/0.1 (+usage personnel)" },
      });
      if (!response.ok) return null;

      const html = await response.text();
      const dom = new JSDOM(html, { url: link });
      const article = new Readability(dom.window.document).parse();
      if (!article?.content) return null;

      const contentDom = new JSDOM(`<body>${article.content}</body>`, { url: link });
      const paragraphs = Array.from(contentDom.window.document.body.querySelectorAll("p"))
        .map((el) => el.textContent?.trim())
        .filter((text): text is string => Boolean(text));

      return paragraphs.length > 0 ? paragraphs : null;
    } catch {
      // Readability peut échouer sur une mise en page inattendue : la page
      // détail retombe alors sur le résumé RSS + le lien vers la source.
      return null;
    }
  },
  // "v2" : le format de cache a changé (retour texte seul, plus de blocs image) ;
  // une clé différente évite de lire une entrée existante au mauvais format.
  ["article-full-content-v2"],
  { revalidate: 60 * 60 * 24 * 30, tags: ["extract"] },
);

/**
 * Préchauffe le cache d'extraction pour les articles publiés aujourd'hui — appelée
 * depuis /api/refresh (cron quotidien + bouton "Rafraîchir"), pas au chargement de
 * la liste, pour ne pas faire attendre chaque visiteur. Concurrence limitée pour
 * éviter de bombarder les sites sources en parallèle si beaucoup d'articles sont
 * sortis dans la journée.
 */
export async function warmTodayArticles(articles: { link: string; publishedAt: number }[]) {
  const today = new Date().toDateString();
  const todayLinks = articles
    .filter((article) => new Date(article.publishedAt).toDateString() === today)
    .map((article) => article.link);

  await mapWithConcurrency(todayLinks, 4, (link) => getFullContent(link).catch(() => null));
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<unknown>,
) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      let item: T | undefined;
      while ((item = queue.shift()) !== undefined) {
        await fn(item);
      }
    }),
  );
}
