import Link from "next/link";
import type { DocsConfig } from "../lib/config";
import { withBase } from "../lib/url-base";

const isExternal = (href: string) => /^[a-z][a-z0-9+.-]*:/i.test(href);

function FooterLink({ href, base, className, children }: { href: string; base: string; className: string; children: string }) {
  if (isExternal(href)) {
    // Deliberately followed: footer links are usually the site owner's own properties.
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={withBase(href, base) ?? href} className={className}>
      {children}
    </Link>
  );
}

/** Site footer from docs.json `footer`: link columns, then an optional one-line credit. */
export function Footer({ config, base = "" }: { config: DocsConfig; base?: string }) {
  const columns = config.footer?.links ?? [];
  const credit = config.footer?.credit;
  if (!columns.length && !credit) return null;

  return (
    <footer className="pv-no-print mt-16 border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-[var(--db-shell-w)] px-9 py-10">
        {columns.length > 0 && (
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col, i) => (
              <div key={col.header ?? i}>
                {col.header && <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{col.header}</p>}
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <FooterLink
                        href={item.href}
                        base={base}
                        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        {item.label}
                      </FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {credit && (
          <p className={columns.length ? "mt-10 text-xs text-zinc-500" : "text-xs text-zinc-500"}>
            <FooterLink href={credit.href} base={base} className="hover:text-zinc-900 dark:hover:text-zinc-100">
              {credit.label}
            </FooterLink>
          </p>
        )}
      </div>
    </footer>
  );
}
