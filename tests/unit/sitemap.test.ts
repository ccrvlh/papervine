import { describe, it, expect } from "vitest";
import { formatRobotsTxt, formatSitemapXml, sitemapUrls } from "@papervine/renderer/lib/sitemap";

describe("sitemapUrls", () => {
  it("maps the index page to the bare origin and drops externals and duplicates", () => {
    const urls = sitemapUrls("https://docs.acme.dev", [
      { href: "/" },
      { href: "/index" },
      { href: "/guides/intro" },
      { href: "/guides/intro" },
      { href: "https://acme.dev", external: true },
    ]);
    expect(urls.map((u) => u.url)).toEqual(["https://docs.acme.dev", "https://docs.acme.dev/guides/intro"]);
  });
});

describe("formatSitemapXml", () => {
  it("escapes URLs and emits lastmod only when present", () => {
    const xml = formatSitemapXml([
      { url: "https://docs.acme.dev/a&b" },
      { url: "https://docs.acme.dev/c", lastModified: "2026-10-07" },
    ]);
    expect(xml).toContain("<loc>https://docs.acme.dev/a&amp;b</loc></url>");
    expect(xml).toContain("<loc>https://docs.acme.dev/c</loc><lastmod>2026-10-07</lastmod>");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});

describe("formatRobotsTxt", () => {
  it("keeps OG card images crawlable while blocking the other APIs", () => {
    const robots = formatRobotsTxt("https://docs.acme.dev");
    expect(robots).toContain("Allow: /api/og");
    expect(robots).toContain("Disallow: /api/");
  });

  it("points at the sitemap on the same origin", () => {
    expect(formatRobotsTxt("https://docs.acme.dev")).toContain("Sitemap: https://docs.acme.dev/sitemap.xml");
  });
});
