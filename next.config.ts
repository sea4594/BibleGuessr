import type { NextConfig } from "next";
import { execSync } from "node:child_process";

const isGitHubPagesBuild =
  process.env.GITHUB_PAGES === "true" || process.env.GITHUB_ACTIONS === "true";

const resolvedCommitSha =
  process.env.NEXT_PUBLIC_COMMIT_SHA ||
  process.env.GITHUB_SHA?.slice(0, 7) ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  (() => {
    try {
      return execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
      return "unknown";
    }
  })();

const nextConfig: NextConfig = {
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_IS_GITHUB_PAGES: isGitHubPagesBuild ? "true" : "false",
    NEXT_PUBLIC_COMMIT_SHA: resolvedCommitSha,
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
