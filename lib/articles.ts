import Parser from "rss-parser";
import { unstable_cache } from "next/cache";
import { SOURCES, getSource, type SourceId, type Source } from "./sources";
import { articleId } from "./id";
import { mapWithConcurrency } from "./concurrency";

export interface Article {
  id: string;
  sourceId: Source["id"];
  sourceName: string;
  title: string;
  link: string;
  summary?: string;
  imageUrl?: string;
  publishedAt: number;
}

type FeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: { url?: string; type?: string };
  mediaThumbnail?: { $: { url?: string } };
  mediaContent?: { $: { url?: string } };
};

const parser = new Parser<Record<string, unknown>, FeedItem>({
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content", "mediaContent"],
    ],
  },
});

/** Va chercher et parse un flux RSS pour une source donnée, sans filtrer les liens morts. */
async function fetchSourceArticles(source: Source): Promise<Article[]> {
  try {
    const response = await fetch(source.feedUrl, {
      headers: { "User-Agent": "PsgNewsWeb/0.1 (+usage personnel)" },
    });
    if (!response.ok) return [];

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    const items: Article[] = (feed.items ?? [])
      .filter((item) => Boolean(item.title && item.link))
      .map((item) => {
        const title = item.title!.trim();
        const link = item.link!;

        const imageUrl =
          item.enclosure?.type?.startsWith("image") ? item.enclosure.url
          : item.mediaThumbnail?.$?.url ?? item.mediaContent?.$?.url ?? item.enclosure?.url;

        const publishedAt = item.isoDate
          ? Date.parse(item.isoDate)
          : item.pubDate
            ? Date.parse(item.pubDate)
            : Date.now();

        return {
          id: articleId(link),
          sourceId: source.id,
          sourceName: source.displayName,
          title,
          link,
          summary: stripHtml(item.contentSnippet ?? item.content)?.slice(0, 400),
          imageUrl,
          publishedAt: Number.isNaN(publishedAt) ? Date.now() : publishedAt,
        };
      });

    return source.requiresKeywordFilter ? items.filter(mentionsPsg) : items;
  } catch {
    return [];
  }
}

/**
 * `true` seulement si le lien répond explicitement 404 — une erreur réseau ou un
 * timeout ne compte pas comme mort : mieux vaut garder un article par erreur que
 * le faire disparaître à tort à cause d'un site source momentanément lent.
 */
async function isDeadLink(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "PsgNewsWeb/0.1 (+usage personnel)" },
      signal: controller.signal,
    });
    return response.status === 404;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Flux + filtrage des liens morts (404) pour une source, mis en cache jusqu'au
 * prochain revalidateTag("feeds") — déclenché uniquement par le bouton
 * "Rafraîchir", pas de renouvellement automatique dans le temps (`revalidate:
 * false`) : sans clic, la liste reste strictement celle du dernier rafraîchissement
 * manuel. La vérification des liens (une requête HEAD par article, concurrence
 * limitée) ne tourne donc que sur cette action, jamais en arrière-plan.
 */
const getLiveSourceArticles = unstable_cache(
  async (sourceId: SourceId): Promise<Article[]> => {
    const source = getSource(sourceId);
    if (!source) return [];

    const items = await fetchSourceArticles(source);
    const alive: Article[] = [];
    await mapWithConcurrency(items, 8, async (item) => {
      if (!(await isDeadLink(item.link))) alive.push(item);
    });
    return alive;
  },
  ["source-articles"],
  { revalidate: false, tags: ["feeds"] },
);

function mentionsPsg(article: Article): boolean {
  const haystack = `${article.title} ${article.summary ?? ""}`.toLowerCase();
  return ["psg", "paris saint-germain", "paris sg"].some((kw) => haystack.includes(kw));
}

function stripHtml(html?: string): string | undefined {
  return html
    ?.replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tous les articles de toutes les sources, du plus récent au plus ancien. */
export async function getArticles(): Promise<Article[]> {
  const bySource = await Promise.all(SOURCES.map((source) => getLiveSourceArticles(source.id)));
  return bySource.flat().sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function getArticleById(id: string): Promise<Article | undefined> {
  const articles = await getArticles();
  return articles.find((a) => a.id === id);
}
