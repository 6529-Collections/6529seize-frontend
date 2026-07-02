import { ArrowPathIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  getSidebarWaveRowLayoutClasses,
  type SidebarWaveRowLayoutVariant,
} from "./sidebarWaveRowLayout";

const SIDEBAR_LOCALE = DEFAULT_LOCALE;
const CONNECTOR_COLOR_CLASSES =
  "tw-border-iron-800/80 desktop-hover:group-hover/subwaves-toggle:tw-border-iron-700/80";

interface SidebarSubwavesToggleProps {
  readonly isExpanded: boolean;
  readonly isLoading: boolean;
  readonly knownSubwavesCount: number | null;
  readonly layoutVariant: SidebarWaveRowLayoutVariant;
  readonly onClick: () => void;
  readonly parentWaveName: string;
  readonly showConnector: boolean;
  readonly unreadDropsCount: number;
}

const getToggleLabel = ({
  isExpanded,
  isLoading,
  knownSubwavesCount,
}: Pick<
  SidebarSubwavesToggleProps,
  "isExpanded" | "isLoading" | "knownSubwavesCount"
>) => {
  if (isLoading) {
    return t(SIDEBAR_LOCALE, "waves.sidebar.subwavesToggleLoading");
  }

  if (isExpanded) {
    return t(SIDEBAR_LOCALE, "waves.sidebar.subwavesToggleHide");
  }

  if (knownSubwavesCount === null) {
    return t(SIDEBAR_LOCALE, "waves.sidebar.subwavesToggleView");
  }

  const key: MessageKey =
    knownSubwavesCount === 1
      ? "waves.sidebar.subwavesToggleViewCountOne"
      : "waves.sidebar.subwavesToggleViewCountMany";

  return t(SIDEBAR_LOCALE, key, { count: knownSubwavesCount });
};

const getToggleAriaLabel = ({
  isExpanded,
  isLoading,
  knownSubwavesCount,
  parentWaveName,
}: Pick<
  SidebarSubwavesToggleProps,
  "isExpanded" | "isLoading" | "knownSubwavesCount" | "parentWaveName"
>) => {
  if (isLoading) {
    return t(SIDEBAR_LOCALE, "waves.sidebar.subwavesToggleLoadingAriaLabel", {
      waveName: parentWaveName,
    });
  }

  if (isExpanded) {
    return t(SIDEBAR_LOCALE, "waves.sidebar.subwavesToggleHideAriaLabel", {
      waveName: parentWaveName,
    });
  }

  if (knownSubwavesCount === null) {
    return t(SIDEBAR_LOCALE, "waves.sidebar.subwavesToggleViewAriaLabel", {
      waveName: parentWaveName,
    });
  }

  const key: MessageKey =
    knownSubwavesCount === 1
      ? "waves.sidebar.subwavesToggleViewCountOneAriaLabel"
      : "waves.sidebar.subwavesToggleViewCountManyAriaLabel";

  return t(SIDEBAR_LOCALE, key, {
    count: knownSubwavesCount,
    waveName: parentWaveName,
  });
};

export function SidebarSubwavesToggle({
  isExpanded,
  isLoading,
  knownSubwavesCount,
  layoutVariant,
  onClick,
  parentWaveName,
  showConnector,
  unreadDropsCount,
}: SidebarSubwavesToggleProps) {
  const label = getToggleLabel({
    isExpanded,
    isLoading,
    knownSubwavesCount,
  });
  const ariaLabel = getToggleAriaLabel({
    isExpanded,
    isLoading,
    knownSubwavesCount,
    parentWaveName,
  });
  const showUnreadBadge = unreadDropsCount > 0;
  const wrapperSpacingClasses = isExpanded
    ? "tw-min-h-[38px] tw-pb-1"
    : "tw-min-h-[42px] tw-pb-2";
  const { rowPaddingClasses, guideLineOffsetClasses } =
    getSidebarWaveRowLayoutClasses({
      isChildRow: true,
      variant: layoutVariant,
    });

  return (
    <div
      className={`tw-group/subwaves-toggle tw-relative tw-flex tw-h-full tw-items-stretch ${rowPaddingClasses} tw-pt-0.5 ${wrapperSpacingClasses}`}
    >
      {showConnector && (
        <span
          aria-hidden="true"
          className={`tw-pointer-events-none tw-absolute tw-bottom-0 tw-top-0 ${guideLineOffsetClasses} tw-border-0 tw-border-l tw-border-solid ${CONNECTOR_COLOR_CLASSES} tw-transition-colors tw-duration-200`}
        />
      )}
      <button
        type="button"
        aria-busy={isLoading || undefined}
        aria-expanded={isExpanded}
        aria-label={ariaLabel}
        disabled={isLoading}
        onClick={onClick}
        className="tw-group/subwaves tw-relative tw-z-[1] tw-flex tw-h-8 tw-w-full tw-min-w-0 tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-text-left tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-300 motion-reduce:tw-transition-none"
      >
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
          {isLoading && (
            <ArrowPathIcon
              aria-hidden="true"
              className="tw-size-3.5 tw-flex-shrink-0 tw-animate-spin"
            />
          )}
          <span className="tw-truncate">{label}</span>
        </span>
        <span className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
          {showUnreadBadge && (
            <span className="tw-flex tw-h-[18px] tw-min-w-[18px] tw-items-center tw-justify-center tw-rounded-full tw-bg-indigo-600 tw-px-1.5 tw-text-[10px] tw-font-semibold tw-leading-none tw-text-white">
              {t(SIDEBAR_LOCALE, "waves.sidebar.subwavesToggleUnreadBadge", {
                count: unreadDropsCount > 99 ? "99+" : unreadDropsCount,
              })}
            </span>
          )}
          <ChevronRightIcon
            aria-hidden="true"
            className={`tw-size-3.5 tw-flex-shrink-0 tw-transition-transform tw-duration-200 tw-ease-out group-hover/subwaves:tw-translate-x-0.5 motion-reduce:tw-transition-none ${
              isExpanded ? "tw-rotate-90" : ""
            }`}
          />
        </span>
      </button>
    </div>
  );
}
