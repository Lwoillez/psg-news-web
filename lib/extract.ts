import { unstable_cache } from "next/cache";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string };

/**
 * Extraction du texte complet d'un article, seulement quand on ouvre sa page de
 * détail (jamais pour toute la liste à chaque régénération) — voir la discussion
 * sur l'approche hybride RSS + extraction ponctuelle dans le README.
 *
 * On garde aussi les images intégrées à l'article (pas seulement la vignette RSS) :
 * on reparse le HTML nettoyé par Readability pour en extraire les paragraphes et
 * les <img>, dans leur ordre d'origine.
 *
 * Mise en cache 30 jours par lien (le contenu d'un article déjà publié ne change
 * pour ainsi dire jamais) : on ne re-tape pas le site source à chaque visite.
 */
export const getFullContent = unstable_cache(
  async (link: string): Promise<ContentBlock[] | null> => {
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
      const blocks: ContentBlock[] = [];

      contentDom.window.document.body.querySelectorAll("p, img").forEach((el) => {
        if (el.tagName === "IMG") {
          const src = (el as InstanceType<typeof contentDom.window.HTMLImageElement>).src;
          if (src) blocks.push({ type: "image", src, alt: el.getAttribute("alt") ?? "" });
        } else {
          const text = el.textContent?.trim();
          if (text) blocks.push({ type: "paragraph", text });
        }
      });

      return blocks.length > 0 ? blocks : null;
    } catch {
      // Readability peut échouer sur une mise en page inattendue : la page
      // détail retombe alors sur le résumé RSS + le lien vers la source.
      return null;
    }
  },
  ["article-full-content"],
  { revalidate: 60 * 60 * 24 * 30, tags: ["extract"] },
);
