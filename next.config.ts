import type { NextConfig } from "next";

const isGitHubPagesBuild =
  process.env.GITHUB_PAGES === "true" || process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isGitHubPagesBuild
    ? {
        basePath: "/BibleGuessr",
        assetPrefix: "/BibleGuessr/",
      }
    : {}),
};

export default nextConfig;
