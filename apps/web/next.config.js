/** @type {import('next').NextConfig} */
const normalizeBasePath = (value) => {
  if (!value) return "";
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  // Deploys normally at the domain root. Set NEXT_PUBLIC_BASE_PATH=/easyvideo
  // only when publishing under a project subdirectory such as GitHub Pages.
  basePath,
  assetPrefix: basePath ? `${basePath}/` : "",
  images: { unoptimized: true },
  // Custom headers are not applied in static export mode.
  // Cross-origin isolation is handled by coi-serviceworker.js in public/.
};

module.exports = nextConfig;
