import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Régénère la liste d'articles : invalide le cache des flux RSS ("feeds"), pas
 * celui du texte extrait ("extract", qui reste valable ~30 jours — voir lib/extract.ts).
 *
 * Appelée par :
 *  - Vercel Cron (voir vercel.json, toutes les heures) — en GET, avec un header
 *    Authorization automatique si la variable d'env CRON_SECRET est définie.
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

function refresh() {
  revalidateTag("feeds");
  return NextResponse.json({ refreshed: true, at: new Date().toISOString() });
}
