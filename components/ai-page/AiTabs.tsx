"use client";

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type AiTab = {
  readonly key: string;
  readonly label: string;
  /** A small logo before the label. */
  readonly icon?: ReactNode;
  readonly panel: ReactNode;
};

// Hover styles apply only where the device can hover (Tailwind's hover:
// variant), so a tapped tab on a phone never looks selected.
const TAB =
  "tw-inline-flex tw-min-h-11 tw-flex-1 tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border-0 tw-px-4 tw-text-sm tw-transition-colors tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none sm:tw-min-h-9 sm:tw-flex-none";
const SELECTED =
  "tw-bg-iron-100 tw-font-semibold tw-text-iron-950 tw-shadow-sm";
const UNSELECTED =
  "tw-bg-transparent tw-font-medium tw-text-iron-400 hover:tw-text-iron-100";

/**
 * Tabs as a segmented control: every panel is rendered on the server and
 * the tabs choose which one shows. Arrow keys, Home and End move between
 * tabs, as WAI-ARIA's tabs pattern describes.
 */
export default function AiTabs({
  tabs,
  initial,
  label,
  listClassName = "",
  panelClassName = "",
}: {
  readonly tabs: readonly AiTab[];
  readonly initial: string;
  /** The tab list's accessible name. */
  readonly label: string;
  /** Space around the tab list, such as a card's padding. */
  readonly listClassName?: string | undefined;
  readonly panelClassName?: string | undefined;
}) {
  const [chosen, setSelected] = useState<string | null>(null);
  const selected =
    chosen ??
    (tabs.some((tab) => tab.key === initial) ? initial : tabs[0]?.key);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    const target = (next + tabs.length) % tabs.length;
    const tab = tabs[target];
    if (tab) {
      setSelected(tab.key);
      buttons.current[target]?.focus();
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className={`tw-flex tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-1 sm:tw-inline-flex ${listClassName}`}
      >
        {tabs.map((tab, index) => {
          const active = tab.key === selected;
          return (
            <button
              key={tab.key}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              type="button"
              id={`${id}-tab-${tab.key}`}
              role="tab"
              aria-selected={active}
              aria-controls={`${id}-panel-${tab.key}`}
              tabIndex={active ? 0 : -1}
              className={`${TAB} ${active ? SELECTED : UNSELECTED}`}
              onClick={() => setSelected(tab.key)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          id={`${id}-panel-${tab.key}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${tab.key}`}
          hidden={tab.key !== selected}
          tabIndex={0}
          className={`tw-rounded-xl focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${panelClassName}`}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
