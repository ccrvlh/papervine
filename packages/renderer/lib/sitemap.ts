import "server-only";
import { loadConfig } from "@papervine/renderer/lib/content";
import {
  listPageEntries,
  listUnlistedPageSlugs,
  type PageEntry,
} from "@papervine/renderer/lib/docs-tools";

/**
 * `sitemap.xml` for the docs site in scope (SPEC §2/§9.1) — every docs site Papervine serves,
 * whether that is a tenant subdomain, a customer's own domain, or a repo behind
 * `papervine serve`. The platform's marketing sitemap is a different thing entirely and lives
 * in `src/lib/seo-routes.ts`.
 *
 * The page list is the SAME one `/llms.txt` publishes, deliberately: `listPageEntries` walks
 * the navigation with the reader's access applied and already drops `noindex` pages, so a
 * gated page cannot leak into a sitemap the way it could if this walked storage instead. The
 * caller passes anonymous access, so the sitemap contains exactly what a search engine could
 * actually fetch.
 *
 * `seo.indexing` is honored the same way too: the default (`navigable`) lists what a reader
 * can reach from the sidebar, and `all` adds pages that exist but aren't in the nav.
 *
 * Must run inside the tenant's `contentContext` (the caller sets it) so every read resolves
 * against the right repo.
 */
export type SitemapUrl = {
  url: string;
  lastModified?: string;
};

/**
 * PURE: nav entries → absolute URLs. Split out so the rules that matter are unit-tested
 * without a server:
 *  · external links are somebody else's URLs and never belong in our sitemap;
 *  · the index page has two spellings (`/` and `/index`) and one canonical URL — the origin
 *    itself, which is also what `<link rel="canonical">` on that page says;
 *  · duplicates collapse, because a page listed under two nav groups is still one URL.
 */
export function sitemapUrls(
  origin: string,
  entries: Pick<PageEntry, "href" | "external">[],
  lastModified?: string,
): SitemapUrl[] {
  const seen = new Set<string>();
  const out: SitemapUrl[] = [];
  for (const entry of entries) {
    if (entry.external) continue;
    const path = entry.href === "/" || entry.href === "/index" ? "" : entry.href;
    const url = `${origin}${path}`;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, ...(lastModified ? { lastModified } : {}) });
  }
  return out;
}

/** The site's sitemap URLs. `lastModified` is the caller's (the site's last publish). */
export async function renderSitemap(origin: string, lastModified?: string): Promise<SitemapUrl[]> {
  const config = await loadConfig();
  const entries = await listPageEntries();
  const extra =
    config.seo?.indexing === "all"
      ? (await listUnlistedPageSlugs()).map((slug) => ({ href: slug ? `/${slug}` : "/" }))
      : [];
  return sitemapUrls(origin, [...entries, ...extra], lastModified);
}

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/** PURE: sitemap URLs → the `sitemap.xml` document. */
export function formatSitemapXml(urls: SitemapUrl[]): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]!);
  const body = urls
    .map((u) =>
      u.lastModified
        ? `  <url><loc>${esc(u.url)}</loc><lastmod>${esc(u.lastModified)}</lastmod></url>`
        : `  <url><loc>${esc(u.url)}</loc></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/**
 * PURE: the default `robots.txt`. Everything a reader can open is crawlable; the JSON APIs and
 * the MCP endpoint are not pages, so they stay out of the index. `/api/og` is allowed back in
 * because social crawlers (Twitterbot among them) honour robots.txt when fetching card images.
 */
export function formatRobotsTxt(origin: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Allow: /api/og",
    "Disallow: /api/",
    "Disallow: /mcp",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}
