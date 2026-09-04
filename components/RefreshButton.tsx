"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Bouton de régénération à la demande : appelle /api/refresh (qui invalide le
 * cache des flux et de l'extraction), puis force Next.js à re-rendre la page
 * avec les données fraîches. La même route est aussi appelée automatiquement
 * toutes les heures par le cron Vercel (voir vercel.json) — le bouton, c'est
 * juste pour ne pas attendre.
 */
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const busy = isPending || isRefreshing;

  async function handleClick() {
    setIsRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
    } catch {
      // On rafraîchit quand même la page : si la requête a échoué côté réseau,
      // il n'y a rien de plus à faire ici que de laisser l'utilisateur réessayer.
    } finally {
      setIsRefreshing(false);
      startTransition(() => router.refresh());
    }
  }

  return (
    <button
      type="button"
      className={`refresh-button${busy ? " is-refreshing" : ""}`}
      onClick={handleClick}
      disabled={busy}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
      {busy ? "Actualisation…" : "Rafraîchir"}
    </button>
  );
}
