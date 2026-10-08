import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const exportRoot = path.resolve(process.argv[2] ?? 'out/BibleGuessr');
const basePath = (process.argv[3] ?? '/BibleGuessr').replace(/\/$/, '');
const outputPath = path.join(exportRoot, 'sw.js');

async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

function toUrl(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  if (normalized === 'index.html') return `${basePath}/`;
  if (normalized.endsWith('/index.html')) return `${basePath}/${normalized.slice(0, -'index.html'.length)}`;
  return `${basePath}/${normalized}`;
}

const files = (await walk(exportRoot))
  .filter(file => path.basename(file) !== 'sw.js')
  .sort();
const relativeFiles = files.map(file => path.relative(exportRoot, file));
const urls = [...new Set(relativeFiles.map(toUrl))].sort();

const hash = createHash('sha256');
for (let i = 0; i < files.length; i += 1) {
  hash.update(relativeFiles[i]);
  hash.update(await readFile(files[i]));
}
const version = hash.digest('hex').slice(0, 16);

const source = `const CACHE_PREFIX = 'bibleguessr-offline-';\nconst CACHE_NAME = CACHE_PREFIX + '${version}';\nconst APP_ROOT = '${basePath}/';\nconst PRECACHE_URLS = ${JSON.stringify(urls)};\n\nself.addEventListener('install', event => {\n  event.waitUntil((async () => {\n    const cache = await caches.open(CACHE_NAME);\n    await cache.addAll(PRECACHE_URLS);\n    await self.skipWaiting();\n  })());\n});\n\nself.addEventListener('activate', event => {\n  event.waitUntil((async () => {\n    const names = await caches.keys();\n    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));\n    await self.clients.claim();\n  })());\n});\n\nasync function matchFirstCached(candidates) {\n  for (const candidate of candidates) {\n    const cached = await caches.match(candidate, { ignoreSearch: true });\n    if (cached) return cached;\n  }\n  return null;\n}\n\nfunction routePathCandidates(pathname) {\n  const clean = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;\n  if (clean === APP_ROOT.slice(0, -1)) return [APP_ROOT];\n  return pathname.endsWith('/') ? [pathname, clean] : [pathname, pathname + '/'];\n}\n\nfunction rscPathCandidates(pathname) {\n  const clean = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;\n  if (clean === APP_ROOT.slice(0, -1)) return [APP_ROOT + 'index.txt'];\n  return [clean + '.txt', clean + '/index.txt'];\n}\n\nself.addEventListener('fetch', event => {\n  const request = event.request;\n  if (request.method !== 'GET') return;\n  const url = new URL(request.url);\n  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_ROOT)) return;\n\n  const isRscRequest = url.searchParams.has('_rsc') || request.headers.get('RSC') === '1';\n\n  if (isRscRequest) {\n    event.respondWith((async () => {\n      try {\n        return await fetch(request);\n      } catch {\n        const cached = await matchFirstCached(rscPathCandidates(url.pathname));\n        if (cached) return cached;\n        throw new Error('Offline RSC payload not cached');\n      }\n    })());\n    return;\n  }\n\n  if (request.mode === 'navigate') {\n    event.respondWith((async () => {\n      try {\n        return await fetch(request);\n      } catch {\n        return (await matchFirstCached(routePathCandidates(url.pathname))) || (await caches.match(APP_ROOT));\n      }\n    })());\n    return;\n  }\n\n  event.respondWith((async () => {\n    const cached = await caches.match(request, { ignoreSearch: true });\n    if (cached) return cached;\n    return fetch(request);\n  })());\n});\n`;

await writeFile(outputPath, source);
console.log(`Generated ${outputPath} with ${urls.length} precached URLs (${version})`);
