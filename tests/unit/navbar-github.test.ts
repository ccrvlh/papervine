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
