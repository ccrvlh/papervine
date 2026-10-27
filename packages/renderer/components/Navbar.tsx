import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import type { DocsConfig } from "../lib/config";
import { themeToggleHidden } from "../lib/appearance";
import { withBase } from "../lib/url-base";

/**
 * Render the docs logo from docs.json. `logo` is either a single path or a
 * `{ light, dark }` pair (hosted docs platforms convention — light logo on light backgrounds,
 * dark on dark). We toggle the pair with CSS so it tracks the theme without JS.
 * Falls back to the site name as text when no logo is configured.
 */
function Logo({ logo, name, assetBase }: { logo: DocsConfig["logo"]; name: string; assetBase: string }) {
  if (typeof logo === "string") {
    // eslint-disable-next-line @next/next/no-img-element -- runtime-served content asset, not a build-time import
    return <img src={withBase(logo, assetBase)} alt={name} className="h-7 w-auto" />;
  }
  if (logo && (logo.light || logo.dark)) {
    return (
      <>
        {logo.light && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withBase(logo.light, assetBase)} alt={name} className="h-7 w-auto dark:hidden" />
        )}
        {logo.dark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withBase(logo.dark, assetBase)} alt={name} className="hidden h-7 w-auto dark:block" />
        )}
      </>
    );
  }
  return <span>{name}</span>;
}

// lucide's brand icons are deprecated, so the mark is inlined.
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/**
 * `base`/`assetBase` prefix internal links and content assets for path-based tenant
 * serving (`/sites/{slug}`); both empty in host mode (subdomain), where this is a no-op.
 */
export function Navbar({
  config,
  base = "",
  assetBase = "",
  search,
  assistant,
}: {
  config: DocsConfig;
  base?: string;
  assetBase?: string;
  /** Optional search palette slot — the host app supplies its implementation
   *  (the renderer core has no search backend of its own). Omitted → no palette. */
  search?: ReactNode;
  /** Optional "Ask AI" slot — supplied by hosts that wire up an assistant. */
  assistant?: ReactNode;
}) {
  const links = config.navbar?.links ?? [];
  const primary = config.navbar?.primary;
  const github = primary?.type === "github" ? primary : undefined;
  const button =
    primary && primary.type !== "github" && typeof primary.label === "string"
      ? { label: primary.label, href: primary.href }
      : undefined;

  return (
    <header className="pv-no-print sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      {/* Padding on the max-w-7xl element itself (not a full-width wrapper) so the
          left edge matches the content row exactly at any viewport width. */}
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-6 pl-9 pr-6">
        <Link href={base || "/"} className="flex shrink-0 items-center text-lg font-bold text-zinc-900 dark:text-zinc-100">
          <Logo logo={config.logo} name={config.name} assetBase={assetBase} />
        </Link>

        {/* Search palette — absolutely centered so the logo/actions widths don't skew it.
            Host-supplied (see `search` prop); the renderer core ships no search backend. */}
        {search}

        <div className="ml-auto flex items-center gap-1">
          {assistant}
          {links.map((link) => (
            <Link
              key={link.href}
              href={withBase(link.href, base) ?? link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
          {button && (
            <Link
              href={withBase(button.href, base) ?? button.href}
              className="ml-2 rounded-[var(--db-radius)] bg-primary px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {button.label}
            </Link>
          )}
          {github && (
            <a
              href={github.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <GitHubMark className="h-4 w-4" />
            </a>
          )}
          {/* `appearance.strict` locks the site to its default mode — hide the toggle. */}
          {!themeToggleHidden(config.appearance) && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}
