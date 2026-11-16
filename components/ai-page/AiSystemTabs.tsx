"use client";

import Image from "next/image";
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import PillTab from "@/components/common/PillTab";
import type { AiGuideSystemKey } from "@/lib/ai-page/content/guide";

type AiSystemTab = {
  readonly key: AiGuideSystemKey;
  readonly label: string;
  /** The system's logo, from /public. */
  readonly image: string;
  readonly panel: ReactNode;
};

/**
 * One tab per system, opening on the visitor's. Every panel is rendered on
 * the server; the tabs only choose which one shows. Arrow keys, Home and
 * End move between tabs, as WAI-ARIA's tabs pattern describes.
 */
export default function AiSystemTabs({
  tabs,
  initial,
  label,
}: {
  readonly tabs: readonly AiSystemTab[];
  readonly initial: AiGuideSystemKey;
  /** The tab list's accessible name: "Your system". */
  readonly label: string;
}) {
  const [selected, setSelected] = useState(initial);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    if (tab) {
      setSelected(tab.key);
      buttons.current[tabs.indexOf(tab)]?.focus();
    }
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      select(next);
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="tw-inline-flex tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-1"
      >
        {tabs.map((tab, index) => {
          const active = tab.key === selected;
          return (
            <PillTab
              key={tab.key}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              id={`${id}-tab-${tab.key}`}
              role="tab"
              aria-selected={active}
              aria-controls={`${id}-panel-${tab.key}`}
              tabIndex={active ? 0 : -1}
              active={active}
              size="md"
              className="tw-h-9 tw-px-4"
              onClick={() => setSelected(tab.key)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              <span
                className={`tw-flex tw-size-5 tw-flex-none tw-items-center tw-justify-center tw-rounded-md tw-bg-white ${active ? "" : "tw-opacity-70"}`}
              >
                <Image
                  unoptimized
                  src={tab.image}
                  alt=""
                  width={12}
                  height={12}
                  className="tw-size-3 tw-object-contain"
                />
              </span>
              {tab.label}
            </PillTab>
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
          className="tw-mt-8 tw-rounded-xl focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
