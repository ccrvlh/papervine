import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import clsx from "clsx";

/**
 * A state machine drawn as a track instead of a graph.
 *
 * ```mdx
 * <Lifecycle>
 *   <State name="discovered" />
 *   <State name="racked" />
 *   <State name="in_service" accent>
 *     <Exit to="rma">hardware fault</Exit>
 *     <Exit to="decommissioned" terminal />
 *   </State>
 *   <Exit to="cancelled" from="any open state" terminal />
 * </Lifecycle>
 * ```
 *
 * The `<State>` children are the main path, top to bottom. An `<Exit>` inside a state sits
 * beside it; `back` marks a return to an earlier state, `terminal` a state nothing leaves. An
 * `<Exit>` placed directly in `<Lifecycle>` is reachable from several states and goes in a
 * footer with its `from` text. Mermaid state diagrams lay every edge out in two dimensions,
 * so a nine-state machine with a few loops becomes a tangle; most lifecycles are a line with
 * side exits, and drawing them that way keeps them readable at docs width and on a phone.
 *
 * `<State>` and `<Exit>` render nothing useful alone — `<Lifecycle>` reads their props.
 * They are tagged with a static marker rather than compared by identity, because the MDX
 * runtime may hand in wrapped component references.
 */

type StateProps = { name: string; accent?: boolean; terminal?: boolean; children?: ReactNode };
type ExitProps = { to: string; from?: string; back?: boolean; terminal?: boolean; children?: ReactNode };

const KIND = "__pvLifecycle";

export function State({ name }: StateProps) {
  return <Pill name={name} />;
}
(State as unknown as Record<string, string>)[KIND] = "state";

export function Exit({ to }: ExitProps) {
  return <Pill name={to} small />;
}
(Exit as unknown as Record<string, string>)[KIND] = "exit";

function kindOf(node: ReactNode): "state" | "exit" | null {
  if (!isValidElement(node)) return null;
  const k = (node.type as unknown as Record<string, unknown>)?.[KIND];
  return k === "state" || k === "exit" ? k : null;
}

function Pill({ name, accent, terminal, small }: { name: string; accent?: boolean; terminal?: boolean; small?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full border font-mono leading-none",
        small ? "px-2 py-1 text-[11.5px]" : "px-2.5 py-1.5 text-[12.5px] font-medium",
        accent
          ? // primary is a bare var(), which Tailwind's /opacity modifier can't tint
            "border-primary bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-zinc-900 dark:text-zinc-50"
          : terminal
            ? "border-dashed border-zinc-300 bg-transparent text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            : small
              ? "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              : "border-zinc-300 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
      )}
    >
      {name}
    </span>
  );
}

function ExitIcon({ back }: { back?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 shrink-0 text-zinc-400 dark:text-zinc-600">
      {back ? (
        <path d="M10 10V6.5A2.5 2.5 0 0 0 7.5 4H2M4.5 1.5 2 4l2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      ) : (
        <path d="M2 1.5v3A2.5 2.5 0 0 0 4.5 7H10M7.5 4.5 10 7 7.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      )}
    </svg>
  );
}

function ExitItem({ exit }: { exit: ExitProps }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <ExitIcon back={exit.back} />
      <Pill name={exit.to} small terminal={exit.terminal} />
      {exit.children && <span>{exit.children}</span>}
    </span>
  );
}

export function Lifecycle({ children }: { children: ReactNode }) {
  const nodes = Children.toArray(children);
  const states = nodes.filter((n) => kindOf(n) === "state") as ReactElement<StateProps>[];
  const shared = nodes.filter((n) => kindOf(n) === "exit") as ReactElement<ExitProps>[];

  return (
    <figure className="my-6 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-5 dark:border-zinc-800 dark:bg-[#0f0f11]">
      {/* A vertical track: one row per state, its exits beside it. Two grid columns so every
          pill lines up whatever its length, and nothing wraps at docs width or on a phone. */}
      <ol aria-label="Lifecycle" className="m-0 grid list-none grid-cols-[max-content_1fr] gap-x-5 p-0">
        {states.map((s, i) => {
          const exits = Children.toArray(s.props.children).filter((n) => kindOf(n) === "exit") as ReactElement<ExitProps>[];
          const last = i === states.length - 1;
          return (
            <li key={s.props.name} className="contents">
              <div className={clsx("relative", !last && "pb-5")}>
                <Pill name={s.props.name} accent={s.props.accent} terminal={s.props.terminal} />
                {!last && (
                  <span aria-hidden className="absolute bottom-1 left-[13px] top-[30px] w-px bg-zinc-300 dark:bg-zinc-700" />
                )}
              </div>
              <div className={clsx("flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-[5px]", !last && "pb-5")}>
                {exits.map((e) => (
                  <ExitItem key={`${e.props.to}-${e.props.back ? "b" : "f"}`} exit={e.props} />
                ))}
              </div>
            </li>
          );
        })}
      </ol>
      {shared.length > 0 && (
        <ul className="m-0 mt-5 flex list-none flex-col gap-1.5 border-t border-zinc-200 p-0 pt-4 dark:border-zinc-800">
          {shared.map((e) => (
            <li key={e.props.to} className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {e.props.from && (
                <>
                  <span>{e.props.from}</span>
                  <span aria-hidden className="text-zinc-400 dark:text-zinc-600">→</span>
                </>
              )}
              <Pill name={e.props.to} small terminal={e.props.terminal} />
              {e.props.children && (
                <>
                  <span aria-hidden>·</span>
                  <span>{e.props.children}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
