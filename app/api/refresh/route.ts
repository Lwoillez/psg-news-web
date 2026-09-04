import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getArticles } from "@/lib/articles";
import { warmTodayArticles } from "@/lib/extract";

// Le préchauffage des articles du jour (voir refresh() ci-dessous) peut prendre
// plus que les 10s par défaut du plan Hobby ; 60s est le max autorisé sans passer Pro.
export const maxDuration = 60;

/**
 * Régénère la liste d'articles : invalide le cache des flux RSS ("feeds"), puis
 * préchauffe le cache du texte extrait ("extract", voir lib/extract.ts) pour les
 * seuls articles publiés aujourd'hui — les plus anciens restent extraits à la
 * demande, à l'ouverture de leur page.
 *
 * Appelée par :
 *  - Vercel Cron (voir vercel.json, quotidien — limite du plan Hobby) — en GET,
 *    avec un header Authorization automatique si la variable d'env CRON_SECRET
 *    est définie.
 *  - Le bouton "Rafraîchir" de l'interface — en POST, sans protection particulière
 *    (site perso à faible enjeu ; voir le README si tu veux la verrouiller davantage).
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  return refresh();
}

export async function POST() {
  return refresh();
}

async function refresh() {
  revalidateTag("feeds");

  const articles = await getArticles();
  await warmTodayArticles(articles);

  return NextResponse.json({ refreshed: true, at: new Date().toISOString() });
}
