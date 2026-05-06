import type { NextConfig } from "next";

const isGitHubPagesBuild =
  process.env.GITHUB_PAGES === "true" || process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isGitHubPagesBuild
    ? {
        output: "export",
        basePath: "/BibleGuessr",
        assetPrefix: "/BibleGuessr/",
      }
    : {}),
};

export default nextConfig;
