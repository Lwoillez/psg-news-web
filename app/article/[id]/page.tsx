import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticleById } from "@/lib/articles";
import { getFullContent } from "@/lib/extract";
import { relativeTime } from "@/lib/format";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleById(params.id);
  return { title: article ? `${article.title} — PSG News` : "Article introuvable — PSG News" };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleById(params.id);
  if (!article) notFound();

  const blocks = await getFullContent(article.link);

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link href="/" className="wordmark">
            PSG <span>News</span>
          </Link>
        </div>
      </header>

      {/* eslint-disable-next-line @next/next/no-img-element -- images.unoptimized: true, voir next.config.mjs */}
      {article.imageUrl ? (
        <img className="detail-hero" src={article.imageUrl} alt="" />
      ) : (
        <div className="detail-hero" />
      )}

      <div className="container detail-body">
        <span className="tag">{article.sourceName}</span>
        <h1>{article.title}</h1>
        <div className="detail-meta">
          {article.sourceName} · {relativeTime(article.publishedAt)}
        </div>

        {article.summary && <p className="article-summary">{article.summary}</p>}

        {blocks && blocks.length > 0 ? (
          <div className="article-text">
            {blocks.map((block, i) =>
              block.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- images.unoptimized: true, voir next.config.mjs
                <img key={i} src={block.src} alt={block.alt} loading="lazy" />
              ) : (
                <p key={i}>{block.text}</p>
              ),
            )}
          </div>
        ) : (
          <p className="extraction-note">
            Impossible de récupérer le texte complet automatiquement — lis l&apos;article sur le
            site source ci-dessous.
          </p>
        )}

        <a
          className="source-link-button"
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Lire sur {article.sourceName}
        </a>
        <br />
        <Link href="/" className="back-link">
          ← Retour à la liste
        </Link>
      </div>
    </>
  );
}
