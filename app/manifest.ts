import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const isGitHubPages =
  process.env.GITHUB_PAGES === 'true' || process.env.GITHUB_ACTIONS === 'true';
const base = isGitHubPages ? '/BibleGuessr' : '';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BibleGuessr',
    short_name: 'BibleGuessr',
    description: 'A GeoGuessr-style Bible verse guessing game',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#191c22',
    theme_color: '#191c22',
    icons: [
      {
        src: `${base}/favicon.ico`,
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
