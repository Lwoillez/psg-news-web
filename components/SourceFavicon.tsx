"use client";

import { useEffect, useRef, useState } from "react";

const MIN_ICON_SIZE = 64;

/**
 * Affiche le favicon d'une source, sauf si sa résolution native est trop faible
 * pour être agrandie proprement (certaines sources n'ont qu'une icône 16x16 côté
 * service de favicons) : dans ce cas on se rabat sur le simple fond dégradé de
 * la vignette plutôt que d'afficher une image floue.
 *
 * Le contrôle de taille se fait à la fois via `onLoad` et, au montage, via
 * `img.complete` : pour une image déjà en cache navigateur, l'événement `load`
 * s'est souvent déjà déclenché avant qu'on ait pu l'écouter, et resterait sinon
 * ignoré.
 */
export function SourceFavicon({ src }: { src?: string }) {
  const [hidden, setHidden] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHidden(false);
    const img = imgRef.current;
    if (img?.complete) checkSize(img);
  }, [src]);

  function checkSize(img: HTMLImageElement) {
    if (img.naturalWidth < MIN_ICON_SIZE || img.naturalHeight < MIN_ICON_SIZE) {
      setHidden(true);
    }
  }

  if (!src || hidden) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- images.unoptimized: true, voir next.config.mjs
    <img
      ref={imgRef}
      className="thumb-favicon"
      src={src}
      alt=""
      onLoad={(event) => checkSize(event.currentTarget)}
      onError={() => setHidden(true)}
    />
  );
}
