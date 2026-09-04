import { getArticles } from "@/lib/articles";
import { ArticleList } from "@/components/ArticleList";
import { RefreshButton } from "@/components/RefreshButton";

export default async function HomePage() {
  const articles = await getArticles();

  return (
    <>
      <header className="site-header">
        <div className="container">
          <span className="wordmark">
            PSG <span>News</span>
          </span>
          <RefreshButton />
        </div>
      </header>
      <ArticleList articles={articles} />
    </>
  );
}
