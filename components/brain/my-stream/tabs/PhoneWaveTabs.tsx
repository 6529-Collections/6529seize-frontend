"use client";

import { useId, useState, type ReactNode, type Ref } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { TabCountBadge } from "@/components/common/TabCountBadge";
import TabButton from "@/components/common/TabButton";
import { getUnderlineTabClasses } from "@/components/common/underlineTabStyles";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const TAB_LAYOUT =
  "tw-flex tw-min-h-11 tw-min-w-0 tw-items-center tw-justify-center tw-gap-0.5 tw-px-1 tw-py-1.5 tw-text-center tw-text-xs tw-leading-4";
const TAB_LABEL = "tw-min-w-0 tw-whitespace-normal tw-break-words";

export interface PhoneWaveTab {
  readonly key: string;
  readonly curationId?: string | undefined;
  readonly label: string;
  readonly badgeCount?: number | null | undefined;
  readonly badge?: ReactNode;
  readonly leadingIcon?: ReactNode;
  readonly action?: ReactNode;
  readonly panelId?: string | undefined;
  readonly onIntent?: (() => void) | undefined;
  readonly onSelect: () => void;
}

interface PhoneWaveTabsProps {
  readonly tabs: readonly PhoneWaveTab[];
  readonly primaryKeys: readonly string[];
  readonly activeKey: string;
  readonly settingsRef?: Ref<HTMLButtonElement> | undefined;
}

function TabBadge({ tab }: { readonly tab: PhoneWaveTab }) {
  return tab.badge ?? <TabCountBadge count={tab.badgeCount} variant="wave" />;
}

/** Wave sections beyond the four primary destinations stay reachable in one sheet. */
export default function PhoneWaveTabs({
  tabs,
  primaryKeys,
  activeKey,
  settingsRef,
}: PhoneWaveTabsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = useId();
  const locale = useBrowserLocale();
  const more = t(locale, "wave.navigation.more");
  const sections = t(locale, "wave.navigation.waveSections");
  const primary = primaryKeys
    .flatMap((key) => {
      const tab = tabs.find((option) => option.key === key);
      return tab ? [tab] : [];
    })
    .slice(0, 4);
  const secondary = tabs.filter(
    (tab) => !primary.some((visible) => visible.key === tab.key)
  );
  const activeSecondary = secondary.find((tab) => tab.key === activeKey);
  const hasTabPanels = primary.some((tab) => tab.panelId);

  return (
    <>
      <div
        className="tw-flex tw-min-w-0 tw-flex-1 tw-items-stretch"
        data-wave-phone-tabs=""
      >
        <div
          className="tw-flex tw-min-w-0 tw-flex-auto tw-items-stretch"
          role={hasTabPanels ? "tablist" : undefined}
          aria-label={hasTabPanels ? sections : undefined}
        >
          {primary.map((tab) => {
            const selected = tab.key === activeKey;
            return (
              <TabButton
                key={tab.key}
                type="button"
                role={tab.panelId ? "tab" : undefined}
                aria-selected={tab.panelId ? selected : undefined}
                aria-controls={tab.panelId}
                aria-current={!tab.panelId && selected ? "true" : undefined}
                data-wave-tab-value={tab.key.toLowerCase()}
                className={`${TAB_LAYOUT} tw-flex-auto ${getUnderlineTabClasses({ active: selected })}`}
                onClick={tab.onSelect}
                onPointerEnter={tab.onIntent}
                onFocus={tab.onIntent}
              >
                <span className={TAB_LABEL}>{tab.label}</span>
                <TabBadge tab={tab} />
              </TabButton>
            );
          })}
        </div>
        {secondary.length > 0 && (
          <button
            ref={settingsRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-current={activeSecondary ? "true" : undefined}
            aria-controls={isOpen ? dialogId : undefined}
            data-wave-phone-more=""
            className={`${TAB_LAYOUT} tw-w-1/4 tw-flex-none ${getUnderlineTabClasses({ active: Boolean(activeSecondary) })}`}
            onClick={() => setIsOpen(true)}
          >
            <span className={`tw-line-clamp-2 ${TAB_LABEL}`}>
              {activeSecondary?.label ?? more}
            </span>
            {activeSecondary && <TabBadge tab={activeSecondary} />}
            <ChevronDownIcon
              aria-hidden="true"
              className="tw-size-3 tw-shrink-0"
            />
          </button>
        )}
      </div>
      {secondary.length > 0 && (
        <MobileWrapperDialog
          id={dialogId}
          title={sections}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          showHeaderCloseButton
        >
          <div className="tw-flex tw-flex-col tw-gap-0.5 tw-px-4">
            {secondary.map((tab) => {
              const selected = tab.key === activeKey;
              return (
                <div key={tab.key} className="tw-flex tw-items-center tw-gap-1">
                  <TabButton
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    data-wave-tab-value={tab.key.toLowerCase()}
                    data-curation-id={tab.curationId}
                    className={`tw-flex tw-min-h-12 tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-px-3 tw-py-2 tw-text-left tw-text-base focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${selected ? "tw-bg-primary-500/10 tw-text-primary-300" : "tw-bg-transparent tw-text-iron-200 active:tw-bg-iron-800"}`}
                    onClick={() => {
                      setIsOpen(false);
                      tab.onSelect();
                    }}
                  >
                    {tab.leadingIcon}
                    <span className="tw-min-w-0 tw-flex-1 tw-break-words">
                      {tab.label}
                    </span>
                    <TabBadge tab={tab} />
                  </TabButton>
                  {tab.action}
                </div>
              );
            })}
          </div>
        </MobileWrapperDialog>
      )}
    </>
  );
}
