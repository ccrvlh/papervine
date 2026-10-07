import { serveSitemap } from "../../lib/seo-handlers";

// Every navigable, indexable page (SPEC §9.1). Content is read per request, like llms.txt.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return serveSitemap(req);
}
