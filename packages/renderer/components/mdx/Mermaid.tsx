"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Renders a Mermaid diagram. ```mermaid fences are swapped to `<Mermaid chart="…">` by
 * `remarkMermaid` (before Shiki touches them), so this receives the raw diagram source.
 *
 * Client-only: Mermaid runs in the browser and emits SVG. The library is heavy (~pulls in
 * d3 etc.), so we **dynamic-import it inside the effect** — it's fetched only on pages that
 * actually contain a diagram, never bundled into every docs page. Theme follows the *docs*
 * appearance (the `.dark` class on <html>, see appearance.ts); we re-render on toggle.
 *
 * Mermaid's stock themes ignore the site, so we start from its `base` theme and feed it a
 * neutral palette plus the docs font. The brand colour is applied through `themeCSS` with
 * `var(--color-primary)`: Mermaid runs every themeVariable through a colour parser, which
 * rejects CSS variables, but the injected stylesheet lives in the page and resolves them.
 *
 * `securityLevel: "loose"` is deliberately NOT used — we keep htmlLabels (so `<br/>`/`<i>`
 * in node labels render, matching hosted docs platforms) but `"antiscript"` strips any <script>, so a
 * diagram can't introduce a script-execution vector the rest of the renderer doesn't allow.
 *
 * A diagram that fails to parse degrades to its source in a <pre> — it never throws.
 */

const PALETTE = {
  light: {
    surface: "#ffffff",
    frame: "#fafafa",
    border: "#d4d4d8",
    line: "#a1a1aa",
    text: "#27272a",
    muted: "#71717a",
    cluster: "#f4f4f5",
  },
  dark: {
    surface: "#18181b",
    frame: "#0f0f11",
    border: "#3f3f46",
    line: "#71717a",
    text: "#e4e4e7",
    muted: "#a1a1aa",
    cluster: "#1c1c1f",
  },
} as const;

function themeFor(dark: boolean, fontFamily: string) {
  const c = dark ? PALETTE.dark : PALETTE.light;
  const themeVariables = {
    darkMode: dark,
    fontFamily,
    fontSize: "14px",
    background: c.frame,
    mainBkg: c.surface,
    primaryColor: c.surface,
    primaryTextColor: c.text,
    primaryBorderColor: c.border,
    nodeBorder: c.border,
    secondaryColor: c.cluster,
    tertiaryColor: c.cluster,
    lineColor: c.line,
    textColor: c.text,
    titleColor: c.text,
    edgeLabelBackground: c.frame,
    clusterBkg: "transparent",
    clusterBorder: c.border,
    labelBackgroundColor: c.frame,
    compositeBackground: c.cluster,
    altBackground: c.cluster,
    actorBkg: c.surface,
    actorBorder: c.border,
    actorTextColor: c.text,
    actorLineColor: c.line,
    signalColor: c.line,
    signalTextColor: c.text,
    labelBoxBkgColor: c.surface,
    labelBoxBorderColor: c.border,
    labelTextColor: c.text,
    loopTextColor: c.muted,
    noteBkgColor: c.cluster,
    noteBorderColor: c.border,
    noteTextColor: c.text,
    activationBkgColor: c.cluster,
    activationBorderColor: c.border,
    sequenceNumberColor: c.surface,
  };
  const themeCSS = `
    .node rect, .node polygon, .node path, rect.actor, .statediagram-state rect, g.stateGroup rect,
    .note rect, rect.note { rx: 8px; ry: 8px; stroke-width: 1px; }
    .node .label, .nodeLabel, .stateLabel, text.actor > tspan { font-weight: 500; }
    .edgePath .path, .flowchart-link, .transition, .messageLine0, .messageLine1, .relation {
      stroke-width: 1.25px;
    }
    .edgeLabel, .edgeLabel p, .edgeLabel span, .messageText, .transition + text {
      font-size: 12px; color: ${c.muted}; fill: ${c.muted};
    }
    .edgeLabel rect, .labelBkg { fill: ${c.frame}; background: ${c.frame}; }
    .cluster rect { rx: 10px; ry: 10px; stroke-dasharray: 4 4; fill: transparent; }
    .cluster .nodeLabel, .cluster-label .nodeLabel, .cluster span {
      font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: ${c.muted};
    }
    .statediagram-state .state-title, .stateGroup text { font-weight: 500; }
    circle.state-start { fill: var(--color-primary) !important; stroke: var(--color-primary) !important; }
    g[id*="-state-root_end"] .outer-path path { fill: var(--color-primary) !important; stroke: var(--color-primary) !important; }
    g[id*="-state-root_end"] .inner-path path { fill: ${c.surface} !important; stroke: ${c.surface} !important; }
    marker path, .arrowheadPath, .arrowMarkerPath { fill: ${c.line}; stroke: ${c.line}; }
    .node.accent rect, .node.accent polygon, .node.accent path {
      fill: color-mix(in srgb, var(--color-primary) 12%, ${c.surface}) !important;
      stroke: var(--color-primary) !important;
    }
  `;
  return { themeVariables, themeCSS };
}

export function Mermaid({ chart }: { chart: string }) {
  // useId yields React's ":r0:" form; strip colons so it's a valid Mermaid/DOM id.
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const draw = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        // Mermaid measures labels at render time; measuring before the docs font has loaded
        // sizes boxes for the fallback font and clips the text once the real one swaps in.
        await document.fonts?.ready;
        const dark = document.documentElement.classList.contains("dark");
        const fontFamily = getComputedStyle(document.body).fontFamily || "ui-sans-serif, system-ui, sans-serif";
        const { themeVariables, themeCSS } = themeFor(dark, fontFamily);
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables,
          themeCSS,
          securityLevel: "antiscript",
          flowchart: { curve: "basis", padding: 12, nodeSpacing: 36, rankSpacing: 44 },
          state: { padding: 10 },
          sequence: { actorMargin: 56, boxMargin: 8, mirrorActors: false },
        });
        const { svg } = await mermaid.render(`mmd-${id}`, chart);
        if (cancelled) return;
        setFailed(false);
        if (ref.current) ref.current.innerHTML = svg;
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    void draw();

    // Re-render when the docs light/dark appearance toggles (the `.dark` class on <html>).
    const observer = new MutationObserver(() => void draw());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [chart, id]);

  if (failed) {
    return (
      <pre className="my-4 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Diagram"
      className="mermaid my-6 flex justify-center overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 dark:border-zinc-800 dark:bg-[#0f0f11] [&_svg]:h-auto [&_svg]:max-w-full"
    />
  );
}
