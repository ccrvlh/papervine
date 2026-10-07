import { loadRaw } from "@papervine/renderer/lib/content";
import { formatRobotsTxt, formatSitemapXml, renderSitemap } from "@papervine/renderer/lib/sitemap";

import { originOf } from "./llms-handlers";

/**
 * `/sitemap.xml` and `/robots.txt` for the folder being served. Both use the request origin, the
 * same way `/llms.txt` does, so they are correct behind any host without configuration.
 *
 * A repo can commit its own `robots.txt` at the docs root to override the default, the same
 * escape hatch `llms.txt` offers.
 */

export async function serveSitemap(req: Request): Promise<Response> {
  let body: string;
  try {
    body = formatSitemapXml(await renderSitemap(originOf(req)));
  } catch {
    return new Response("Not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

export async function serveRobotsTxt(req: Request): Promise<Response> {
  const custom = await loadRaw("robots.txt").catch(() => null);
  const body = custom?.trim()
    ? custom.endsWith("\n")
      ? custom
      : custom + "\n"
    : formatRobotsTxt(originOf(req));
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
