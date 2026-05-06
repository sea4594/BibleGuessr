import type { NextConfig } from "next";

const isGitHubPagesBuild =
  process.env.GITHUB_PAGES === "true" || process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_IS_GITHUB_PAGES: isGitHubPagesBuild ? "true" : "false",
  },
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
