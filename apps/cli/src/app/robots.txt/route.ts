import { serveRobotsTxt } from "../../lib/seo-handlers";

// Points crawlers at /sitemap.xml. Content is read per request, like llms.txt.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return serveRobotsTxt(req);
}
