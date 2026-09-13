"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useRef, type KeyboardEvent } from "react";
import {
  getModerationTabPath,
  type ModerationTab,
} from "./content-moderation-tabs";

export default function ContentModerationTabs({
  activeTab,
  openCount,
  resolvedCount,
  suspendedCount,
}: {
  readonly activeTab: ModerationTab;
  readonly openCount: number;
  readonly resolvedCount: number;
  readonly suspendedCount: number;
}) {
  const locale = useBrowserLocale();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabs = [
    { id: "OPEN", key: "open", count: openCount },
    { id: "CHECKS", key: "checks", count: undefined },
    { id: "RESOLVED", key: "resolved", count: resolvedCount },
    { id: "SUSPENDED", key: "suspended", count: suspendedCount },
    { id: "BLOCK_ACTIVITY", key: "blockActivity", count: undefined },
  ] as const;

  function focusTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const offsets: Record<string, number> = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const nextIndex = offsets[event.key];
    if (nextIndex !== undefined) {
      event.preventDefault();
      tabRefs.current[nextIndex]?.focus();
    }
  }

  function selectTab(tab: ModerationTab) {
    if (tab === activeTab) {
      return;
    }
    // Next's native-history integration updates usePathname without a page fetch.
    const { search, hash } = globalThis.location;
    globalThis.history.pushState(
      null,
      "",
      `${getModerationTabPath(tab)}${search}${hash}`
    );
  }

  return (
    <>
      <label className="tw-mt-6 tw-block tw-space-y-2 tw-text-sm tw-text-iron-300 lg:tw-hidden">
        <span>{t(locale, "contentModeration.moderator.tabs.label")}</span>
        <select
          value={activeTab}
          onChange={(event) => selectTab(event.target.value as ModerationTab)}
          className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {t(locale, `contentModeration.moderator.tabs.${tab.key}`)}
              {tab.count === undefined
                ? ""
                : ` (${formatInteger(locale, tab.count)})`}
            </option>
          ))}
        </select>
      </label>
      <div
        role="tablist"
        aria-label={t(locale, "contentModeration.moderator.tabs.label")}
        className="tw-mt-8 tw-hidden tw-flex-wrap tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 lg:tw-flex"
      >
        {tabs.map((tab, index) => {
          const label = t(
            locale,
            `contentModeration.moderator.tabs.${tab.key}`
          );
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`moderation-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="moderation-tabpanel"
              tabIndex={activeTab === tab.id ? 0 : -1}
              aria-label={
                tab.count === undefined
                  ? label
                  : `${label} (${formatInteger(locale, tab.count)})`
              }
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => focusTab(event, index)}
              className={`tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-1 tw-py-3 tw-text-sm tw-font-semibold focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 sm:tw-flex-none sm:tw-px-3 ${
                activeTab === tab.id
                  ? "tw-border-primary-400 tw-text-iron-50"
                  : "tw-border-transparent tw-text-iron-400 hover:tw-text-iron-100"
              }`}
            >
              <span aria-hidden="true" className="sm:tw-hidden">
                {t(
                  locale,
                  `contentModeration.moderator.tabs.${tab.key}Compact`
                )}
              </span>
              <span aria-hidden="true" className="tw-hidden sm:tw-inline">
                {label}
              </span>
              {tab.count !== undefined && (
                <span
                  aria-hidden="true"
                  className="tw-ml-1.5 tw-rounded-full tw-bg-iron-800 tw-px-1.5 tw-py-0.5 tw-text-xs tw-text-iron-200 sm:tw-ml-2 sm:tw-px-2"
                >
                  {formatInteger(locale, tab.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
