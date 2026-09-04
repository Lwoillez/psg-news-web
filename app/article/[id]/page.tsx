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

  const paragraphs = await getFullContent(article.link);

  return (
    <>
      <header className="site-header">
        <div className="container detail-header">
          <Link href="/" className="wordmark">
            PSG <span>News</span>
          </Link>
          <Link href="/" className="back-link">
            ← Retour à la liste
          </Link>
        </div>
      </header>

      <div className="container detail-body">
        <span className="tag">{article.sourceName}</span>
        <h1>{article.title}</h1>
        <div className="detail-meta">
          {article.sourceName} · {relativeTime(article.publishedAt)}
        </div>

        {article.summary && <p className="article-summary">{article.summary}</p>}

        {paragraphs && paragraphs.length > 0 ? (
          <div className="article-text">
            {paragraphs.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
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
