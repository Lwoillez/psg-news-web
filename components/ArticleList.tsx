"use client";

import { useMemo, useState } from "react";
import type { Article } from "@/lib/articles";
import { SOURCES, type SourceId } from "@/lib/sources";
import { FeaturedArticleCard, ArticleRow } from "./ArticleCard";

export function ArticleList({ articles }: { articles: Article[] }) {
  const [selected, setSelected] = useState<SourceId | null>(null);

  const filtered = useMemo(
    () => (selected ? articles.filter((a) => a.sourceId === selected) : articles),
    [articles, selected],
  );

  return (
    <>
      <div className="source-filters">
        <button
          type="button"
          className={`chip${selected === null ? " is-active" : ""}`}
          onClick={() => setSelected(null)}
        >
          Tout
        </button>
        {SOURCES.map((source) => (
          <button
            key={source.id}
            type="button"
            className={`chip${selected === source.id ? " is-active" : ""}`}
            onClick={() => setSelected(source.id)}
          >
            {source.displayName}
          </button>
        ))}
      </div>

      <div className="container">
        {filtered.length === 0 ? (
          <p className="empty-state">
            Aucun article pour le moment. Essaie de rafraîchir, ou reviens plus tard.
          </p>
        ) : (
          <div className="article-list">
            <FeaturedArticleCard article={filtered[0]} />
            {filtered.slice(1).map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
