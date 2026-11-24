"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { TabCountBadge } from "@/components/common/TabCountBadge";
import TabButton from "@/components/common/TabButton";
import {
  getUnderlineTabClasses,
  UNDERLINE_TAB_TEXT_INDICATOR_CLASSES,
} from "@/components/common/underlineTabStyles";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const TAB_LAYOUT =
  "tw-flex tw-min-h-11 tw-min-w-11 tw-flex-none tw-items-center tw-justify-center tw-gap-1 tw-px-2 tw-text-center tw-text-sm tw-leading-4";
const TAB_LABEL =
  "tw-relative tw-inline-flex tw-items-center tw-self-stretch tw-whitespace-nowrap";

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
  readonly trailingAction?: ReactNode;
  readonly settingsRef?: Ref<HTMLButtonElement> | undefined;
  readonly settingsKey?: string | undefined;
}

function TabBadge({ tab }: { readonly tab: PhoneWaveTab }) {
  return tab.badge ?? <TabCountBadge count={tab.badgeCount} variant="wave" />;
}

/** Small waves show every section; larger waves keep everyday destinations first. */
export default function PhoneWaveTabs({
  tabs,
  primaryKeys,
  activeKey,
  trailingAction,
  settingsRef,
  settingsKey,
}: PhoneWaveTabsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const locale = useBrowserLocale();
  const more = t(locale, "wave.navigation.more");
  const sections = t(locale, "wave.navigation.waveSections");
  const everyday = primaryKeys.flatMap((key) => {
    const tab = tabs.find((option) => option.key === key);
    return tab ? [tab] : [];
  });
  everyday.push(
    ...tabs.filter(
      (tab) =>
        (tab.curationId !== undefined || tab.key.startsWith("curation:")) &&
        !primaryKeys.includes(tab.key)
    )
  );
  const everydayKeys = new Set(everyday.map((tab) => tab.key));
  const reference = tabs.filter((tab) => !everydayKeys.has(tab.key));
  const showAll = tabs.length <= 5;
  const primary = showAll ? [...everyday, ...reference] : everyday.slice(0, 4);
  const secondary = showAll ? [] : [...everyday.slice(4), ...reference];
  const activeSecondary = secondary.find((tab) => tab.key === activeKey);
  const hasTabPanels = primary.some((tab) => tab.panelId);
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const revealActiveTab = () =>
      row
        .querySelector<HTMLElement>(
          '[aria-selected="true"], [aria-current="true"]'
        )
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    revealActiveTab();
    const observer = new ResizeObserver(revealActiveTab);
    observer.observe(row);
    const activeTab = row.querySelector<HTMLElement>(
      '[aria-selected="true"], [aria-current="true"]'
    );
    if (activeTab) observer.observe(activeTab);
    return () => observer.disconnect();
  }, [activeKey, activeSecondary?.label]);

  return (
    <>
      <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-1">
        <div
          ref={rowRef}
          className="tw-flex tw-min-w-0 tw-flex-1 tw-scroll-px-px tw-items-stretch tw-gap-1 tw-overflow-x-auto tw-overflow-y-hidden tw-overscroll-x-contain tw-pr-px tw-scrollbar-none"
          data-wave-phone-tabs=""
        >
          <div
            className="tw-flex tw-flex-none tw-items-stretch tw-gap-1"
            role={hasTabPanels ? "tablist" : undefined}
            aria-label={hasTabPanels ? sections : undefined}
          >
            {primary.map((tab) => {
              const selected = tab.key === activeKey;
              const hasAction =
                tab.action !== null &&
                tab.action !== undefined &&
                tab.action !== false;
              const button = (
                <TabButton
                  key={tab.key}
                  ref={tab.key === settingsKey ? settingsRef : undefined}
                  type="button"
                  role={tab.panelId ? "tab" : undefined}
                  aria-selected={tab.panelId ? selected : undefined}
                  aria-controls={tab.panelId}
                  aria-current={!tab.panelId && selected ? "true" : undefined}
                  data-wave-tab-value={tab.key.toLowerCase()}
                  data-curation-id={tab.curationId}
                  className={`${TAB_LAYOUT} ${getUnderlineTabClasses({ active: selected, externalIndicator: true })}`}
                  onClick={tab.onSelect}
                  onPointerEnter={tab.onIntent}
                  onFocus={tab.onIntent}
                >
                  {tab.leadingIcon}
                  <span
                    className={`${TAB_LABEL} ${selected ? UNDERLINE_TAB_TEXT_INDICATOR_CLASSES : ""}`}
                    data-wave-tab-label=""
                  >
                    {tab.label}
                  </span>
                  <TabBadge tab={tab} />
                </TabButton>
              );
              return hasAction ? (
                <div
                  key={tab.key}
                  className="tw-flex tw-flex-none tw-items-center"
                >
                  {button}
                  {tab.action}
                </div>
              ) : (
                button
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
              className={`${TAB_LAYOUT} ${getUnderlineTabClasses({ active: Boolean(activeSecondary), externalIndicator: true })}`}
              onClick={() => setIsOpen(true)}
            >
              <span
                className={`${TAB_LABEL} ${activeSecondary ? UNDERLINE_TAB_TEXT_INDICATOR_CLASSES : ""}`}
                data-wave-tab-label=""
              >
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
        {trailingAction}
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
