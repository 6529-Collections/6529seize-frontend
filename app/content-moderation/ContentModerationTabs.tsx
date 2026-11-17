"use client";

import { DROPDOWN_FIELD_CLASSES } from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import { getUnderlineTabClasses } from "@/components/common/underlineTabStyles";

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
  reviewCount,
  resolvedCount,
  suspendedCount,
}: {
  readonly activeTab: ModerationTab;
  readonly reviewCount: number | undefined;
  readonly resolvedCount: number;
  readonly suspendedCount: number;
}) {
  const locale = useBrowserLocale();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabs = [
    { id: "REVIEW", key: "needsReview", count: reviewCount },
    { id: "CHECKS", key: "checks", count: undefined },
    { id: "RESOLVED", key: "resolved", count: resolvedCount },
    { id: "ENCRYPTED_REPORTS", key: "encryptedReports", count: undefined },
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
          className={`${DROPDOWN_FIELD_CLASSES} tw-min-h-11 tw-w-full tw-px-3 tw-py-2 tw-text-sm`}
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
              className={`${getUnderlineTabClasses({ active: activeTab === tab.id, size: "sm" })} tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-px-1 tw-py-3 sm:tw-flex-none sm:tw-px-3`}
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
