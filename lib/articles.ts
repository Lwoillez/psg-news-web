import Parser from "rss-parser";
import { SOURCES, type Source } from "./sources";
import { articleId } from "./id";

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

/**
 * Va chercher et parse un flux RSS pour une source donnée. Chaque source échoue
 * indépendamment (site en panne, rate-limit...) : on renvoie une liste vide plutôt
 * que de faire planter tout le rafraîchissement des autres sources.
 *
 * `next: { revalidate, tags: ["feeds"] }` branche cette requête sur le cache de
 * données de Next.js : elle n'est refaite que toutes les heures, ou à la demande
 * quand /api/refresh appelle revalidateTag("feeds") (bouton "Rafraîchir" ou cron).
 */
async function fetchSourceArticles(source: Source): Promise<Article[]> {
  try {
    const response = await fetch(source.feedUrl, {
      headers: { "User-Agent": "PsgNewsWeb/0.1 (+usage personnel)" },
      next: { revalidate: 3600, tags: ["feeds"] },
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
  const bySource = await Promise.all(SOURCES.map(fetchSourceArticles));
  return bySource.flat().sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function getArticleById(id: string): Promise<Article | undefined> {
  const articles = await getArticles();
  return articles.find((a) => a.id === id);
}
