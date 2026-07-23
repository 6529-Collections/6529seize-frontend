import { MEME_FOCUS, MEME_TABS } from "@/components/the-memes/MemeShared";
import type { LabNFT } from "@/entities/INFT";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const ACTIVITY_PAGE_SIZE = 25;
const MEME_LAB_TAB_FOCUSES = [
  MEME_FOCUS.LIVE,
  MEME_FOCUS.COLLECTORS,
  MEME_FOCUS.HISTORY,
  MEME_FOCUS.REFERENCES,
] as const;
const MEME_LAB_FOCUS_VALUES = new Set<MEME_FOCUS>(MEME_LAB_TAB_FOCUSES);
const isMemeLabFocus = (focus: MEME_FOCUS): boolean =>
  MEME_LAB_FOCUS_VALUES.has(focus);
export const MEME_LAB_TABS = MEME_LAB_TAB_FOCUSES.map((focus) =>
  MEME_TABS.find((tab) => tab.focus === focus)
).filter((tab): tab is (typeof MEME_TABS)[number] => tab !== undefined);

export enum MEME_LAB_HISTORY_TAB {
  ACTIVITY = "activity",
  YOUR_TRANSACTIONS = "your-transactions",
  TIMELINE = "timeline",
}

export const MEME_LAB_HISTORY_TABS: {
  readonly focus: MEME_LAB_HISTORY_TAB;
}[] = [
  { focus: MEME_LAB_HISTORY_TAB.ACTIVITY },
  { focus: MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS },
  { focus: MEME_LAB_HISTORY_TAB.TIMELINE },
];

export function parseMemeLabFocus(
  focus: string | null
): MEME_FOCUS | undefined {
  if (focus === MEME_FOCUS.THE_ART) {
    return MEME_FOCUS.LIVE;
  }

  if (
    focus === MEME_FOCUS.ACTIVITY ||
    focus === MEME_FOCUS.YOUR_TRANSACTIONS ||
    focus === MEME_FOCUS.TIMELINE
  ) {
    return MEME_FOCUS.HISTORY;
  }

  const resolvedFocus = Object.values(MEME_FOCUS).find(
    (candidate) => candidate === focus
  );
  if (resolvedFocus === undefined || !isMemeLabFocus(resolvedFocus)) {
    return undefined;
  }

  return resolvedFocus;
}

export function getMemeLabHistoryTabForFocus(
  focus: string | null
): MEME_LAB_HISTORY_TAB {
  if (focus === MEME_FOCUS.TIMELINE) {
    return MEME_LAB_HISTORY_TAB.TIMELINE;
  }

  if (focus === MEME_FOCUS.YOUR_TRANSACTIONS) {
    return MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS;
  }

  return MEME_LAB_HISTORY_TAB.ACTIVITY;
}

export function getMemeLabRouteFocus(
  activeTab: MEME_FOCUS,
  activeHistoryTab: MEME_LAB_HISTORY_TAB
): MEME_FOCUS {
  if (activeTab !== MEME_FOCUS.HISTORY) {
    return activeTab;
  }

  if (activeHistoryTab === MEME_LAB_HISTORY_TAB.TIMELINE) {
    return MEME_FOCUS.TIMELINE;
  }

  if (activeHistoryTab === MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS) {
    return MEME_FOCUS.YOUR_TRANSACTIONS;
  }

  return MEME_FOCUS.ACTIVITY;
}

export const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }
  return error instanceof Error && error.name === "AbortError";
};

export function runAfterCriticalWork(callback: () => void): () => void {
  if (typeof globalThis.requestIdleCallback !== "function") {
    callback();
    return () => undefined;
  }

  const idleCallbackId = globalThis.requestIdleCallback(callback, {
    timeout: 1500,
  });
  return () => globalThis.cancelIdleCallback(idleCallbackId);
}

const MEME_LAB_TAB_BUTTON_BASE_CLASS_NAME =
  "tw-m-0 tw-flex tw-items-center tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-1 tw-py-4 tw-text-base tw-font-semibold tw-leading-4 tw-no-underline tw-transition-colors tw-duration-150 tw-ease-out motion-reduce:tw-transition-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

function getMemeLabTabButtonClassName(isActive: boolean) {
  return `${MEME_LAB_TAB_BUTTON_BASE_CLASS_NAME} ${
    isActive
      ? "tw-pointer-events-none tw-border-primary-400 tw-text-iron-100"
      : "tw-cursor-pointer tw-border-transparent tw-text-iron-500 hover:tw-border-gray-300 hover:tw-text-iron-100"
  }`;
}

export function MemeLabPageTabButton({
  title,
  isActive,
  onClick,
}: {
  readonly title: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      className={getMemeLabTabButtonClassName(isActive)}
      onClick={onClick}
    >
      {title}
    </button>
  );
}

export function getMemeLabDetailTabLabel(
  focus: MEME_FOCUS,
  locale: SupportedLocale
): string {
  switch (focus) {
    case MEME_FOCUS.LIVE:
      return t(locale, "memeLab.detail.tabs.overview");
    case MEME_FOCUS.REFERENCES:
      return t(locale, "memeLab.detail.tabs.references");
    case MEME_FOCUS.COLLECTORS:
      return t(locale, "memeLab.detail.tabs.collectors");
    case MEME_FOCUS.HISTORY:
      return t(locale, "memeLab.detail.tabs.history");
    default:
      return t(locale, "memeLab.detail.tabs.overview");
  }
}

export function getMemeLabHistoryTabLabel(
  focus: MEME_LAB_HISTORY_TAB,
  locale: SupportedLocale
): string {
  switch (focus) {
    case MEME_LAB_HISTORY_TAB.ACTIVITY:
      return t(locale, "memeLab.detail.tabs.cardActivity");
    case MEME_LAB_HISTORY_TAB.YOUR_TRANSACTIONS:
      return t(locale, "memeLab.detail.tabs.yourTransactions");
    case MEME_LAB_HISTORY_TAB.TIMELINE:
      return t(locale, "memeLab.detail.tabs.timeline");
  }
}

function getMemeLabRouteFocusLabel(
  focus: MEME_FOCUS,
  locale: SupportedLocale
): string {
  if (focus === MEME_FOCUS.ACTIVITY) {
    return t(locale, "memeLab.detail.tabs.cardActivity");
  }

  if (focus === MEME_FOCUS.YOUR_TRANSACTIONS) {
    return t(locale, "memeLab.detail.tabs.yourTransactions");
  }

  if (focus === MEME_FOCUS.TIMELINE) {
    return t(locale, "memeLab.detail.tabs.timeline");
  }

  return getMemeLabDetailTabLabel(parseMemeLabFocus(focus) ?? focus, locale);
}

export function getMemeLabBrowserTitle({
  nft,
  nftId,
  routeFocus,
  locale,
}: {
  readonly nft: LabNFT | undefined;
  readonly nftId: string;
  readonly routeFocus: MEME_FOCUS;
  readonly locale: SupportedLocale;
}): string {
  const title = nft
    ? t(locale, "memeLab.detail.browserTitle", {
        name: nft.name,
        tokenId: nft.id,
      })
    : t(locale, "memeLab.detail.heading.card", { tokenId: nftId });

  if (routeFocus === MEME_FOCUS.LIVE) {
    return title;
  }

  return t(locale, "memeLab.detail.browserTitleWithTab", {
    title,
    tab: getMemeLabRouteFocusLabel(routeFocus, locale),
  });
}
