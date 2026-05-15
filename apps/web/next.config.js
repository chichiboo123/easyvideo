/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const repoName = "easyvideo";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  // GitHub Pages deploys under /easyvideo/ when using a project (non-root) page.
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  images: { unoptimized: true },
  // Custom headers are not applied in static export mode.
  // Cross-origin isolation is handled by coi-serviceworker.js in public/.
};

module.exports = nextConfig;
