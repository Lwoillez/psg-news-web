/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Les vignettes viennent de plusieurs domaines de sources RSS qu'on ne connaît
    // pas tous à l'avance : on désactive l'optimisation d'image plutôt que de
    // maintenir une allowlist de domaines qui casserait dès qu'une source change
    // d'hébergeur d'images.
    unoptimized: true,
  },
};

export default nextConfig;
