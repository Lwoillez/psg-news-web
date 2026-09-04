import Link from "next/link";
import type { Article } from "@/lib/articles";
import { getSourceFaviconUrl } from "@/lib/sources";
import { relativeTime } from "@/lib/format";
import { SourceFavicon } from "./SourceFavicon";

export function FeaturedArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.id}`} className="featured-card">
      <span className="tag">{article.sourceName}</span>
      <h2>{article.title}</h2>
      {article.summary && <p className="card-summary">{article.summary}</p>}
      <div className="meta">{relativeTime(article.publishedAt)}</div>
    </Link>
  );
}

export function ArticleRow({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.id}`} className="article-row">
      {/* eslint-disable-next-line @next/next/no-img-element -- images.unoptimized: true, voir next.config.mjs */}
      {article.imageUrl ? (
        <img className="thumb" src={article.imageUrl} alt="" />
      ) : (
        <div className="thumb thumb-placeholder">
          <SourceFavicon src={getSourceFaviconUrl(article.sourceId)} />
        </div>
      )}
      <div>
        <span className="tag">{article.sourceName}</span>
        <h3>{article.title}</h3>
        {article.summary && <p className="card-summary">{article.summary}</p>}
        <div className="meta">{relativeTime(article.publishedAt)}</div>
      </div>
    </Link>
  );
}
