import { describe, expect, it } from "vitest";
import { parseDocsConfig } from "@papervine/renderer/lib/config";

describe("navbar.primary", () => {
  it("accepts a github primary without a label", () => {
    const { config } = parseDocsConfig({
      name: "Acme",
      navbar: { links: [{ label: "Blog", href: "/blog" }], primary: { type: "github", href: "https://github.com/acme/acme" } },
    });
    expect(config.navbar?.primary).toMatchObject({ type: "github", href: "https://github.com/acme/acme" });
    expect(config.navbar?.links).toHaveLength(1);
  });

  it("drops a malformed primary without losing the links", () => {
    const { config } = parseDocsConfig({
      name: "Acme",
      navbar: { links: [{ label: "Blog", href: "/blog" }], primary: { type: "button" } },
    });
    expect(config.navbar?.primary).toBeUndefined();
    expect(config.navbar?.links).toHaveLength(1);
  });
});

describe("footer", () => {
  it("parses link columns and a credit line", () => {
    const { config, warnings } = parseDocsConfig({
      name: "Acme",
      footer: {
        links: [{ header: "Project", items: [{ label: "Website", href: "https://acme.dev" }] }],
        credit: { label: "Developed by Acme Labs", href: "https://acmelabs.dev" },
      },
    });
    expect(config.footer?.links?.[0].items[0].href).toBe("https://acme.dev");
    expect(config.footer?.credit?.label).toBe("Developed by Acme Labs");
    expect(warnings.join(" ")).not.toContain("footer");
  });

  it("drops a malformed column list without losing the credit", () => {
    const { config } = parseDocsConfig({
      name: "Acme",
      footer: { links: [{ items: "nope" }], credit: { label: "Acme", href: "https://acme.dev" } },
    });
    expect(config.footer?.links).toBeUndefined();
    expect(config.footer?.credit?.href).toBe("https://acme.dev");
  });
});
