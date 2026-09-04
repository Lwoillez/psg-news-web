import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getArticles } from "@/lib/articles";
import { warmTodayArticles } from "@/lib/extract";

// Le préchauffage des articles du jour (voir refresh() ci-dessous) peut prendre
// plus que les 10s par défaut du plan Hobby ; 60s est le max autorisé sans passer Pro.
export const maxDuration = 60;

/**
 * Régénère la liste d'articles à la demande (bouton "Rafraîchir" de l'interface,
 * pas de cron programmé) : invalide le cache des flux RSS ("feeds"), puis
 * préchauffe le cache du texte extrait ("extract", voir lib/extract.ts) pour les
 * seuls articles publiés aujourd'hui — les plus anciens restent extraits à la
 * demande, à l'ouverture de leur page.
 */
export async function POST() {
  revalidateTag("feeds");

  const articles = await getArticles();
  await warmTodayArticles(articles);

  return NextResponse.json({ refreshed: true, at: new Date().toISOString() });
}
