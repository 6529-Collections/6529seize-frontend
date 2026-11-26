import { useRef, type KeyboardEvent } from "react";
import PillTab from "@/components/common/PillTab";
import { GRANTED_TABS } from "../constants";
import type { GrantedTab } from "../types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface UserPageXtdhGrantedListTabsProps {
  readonly idPrefix: string;
  readonly panelId: string;
  readonly activeTab: GrantedTab;
  readonly onTabChange: (tab: GrantedTab) => void;
  readonly pendingCount?: number | undefined;
}

export function UserPageXtdhGrantedListTabs({
  idPrefix,
  panelId,
  activeTab,
  onTabChange,
  pendingCount,
}: UserPageXtdhGrantedListTabsProps) {
  const locale = useBrowserLocale();
  const tabsRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "Right":
        next = (index + 1) % GRANTED_TABS.length;
        break;
      case "ArrowLeft":
      case "Left":
        next = (index + GRANTED_TABS.length - 1) % GRANTED_TABS.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = GRANTED_TABS.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    tabsRef.current
      ?.querySelectorAll<HTMLButtonElement>("button")
      [next]?.focus();
    onTabChange(GRANTED_TABS[next]!.value);
  };
  return (
    <div
      ref={tabsRef}
      role="tablist"
      aria-orientation="horizontal"
      aria-label={t(locale, "xtdh.grant.statusTabsLabel")}
      className="tw-no-scrollbar tw-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-overflow-x-auto tw-py-1"
    >
      {GRANTED_TABS.map((tab, index) => (
        <PillTab
          key={tab.key}
          id={`${idPrefix}-${tab.value}`}
          aria-controls={panelId}
          active={activeTab === tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
          tabIndex={activeTab === tab.value ? 0 : -1}
          onClick={() => onTabChange(tab.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {tab.label}
          {tab.value === "PENDING" &&
            pendingCount !== undefined &&
            pendingCount > 0 && (
              <span className="tw-flex tw-h-[18px] tw-min-w-[18px] tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-bold tw-text-white">
                {pendingCount}
              </span>
            )}
        </PillTab>
      ))}
    </div>
  );
}
