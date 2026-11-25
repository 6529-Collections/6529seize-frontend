import "@/i18n/namespaces/wave-sidebar";
import { ArrowPathIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import IconButton from "@/components/utils/button/IconButton";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";

export interface SidebarSubwaveRowProps {
  readonly depth?: 0 | 1 | undefined;
  readonly canExpand?: boolean | undefined;
  readonly hasUnreadSubwaves?: boolean | undefined;
  readonly subwavesExpanded?: boolean | undefined;
  readonly subwavesLoading?: boolean | undefined;
  readonly unreadSubwaveDropsCount?: number | undefined;
  readonly isLastSubwave?: boolean | undefined;
  readonly showSubwaveConnector?: boolean | undefined;
  readonly onPrefetchSubwaves?: ((waveId: string) => void) | undefined;
  readonly onToggleSubwaves?: ((waveId: string) => void) | undefined;
}

interface SidebarSubwavesToggleProps {
  readonly isExpanded: boolean;
  readonly isLoading: boolean;
  readonly onClick: () => void;
  readonly parentWaveName: string;
  readonly unreadDropsCount: number;
}

export function SidebarSubwavesToggle({
  isExpanded,
  isLoading,
  onClick,
  parentWaveName,
  unreadDropsCount,
}: SidebarSubwavesToggleProps) {
  const locale = useBrowserLocale();
  const unreadId = useId();
  let labelKey: MessageKey = "waves.sidebar.expandControlExpandAriaLabel";
  if (isLoading) {
    labelKey = "waves.sidebar.expandControlLoadingAriaLabel";
  } else if (isExpanded) {
    labelKey = "waves.sidebar.expandControlCollapseAriaLabel";
  }
  const hasUnreadSubwaves = unreadDropsCount > 0;
  const unreadCount = formatInteger(locale, Math.min(unreadDropsCount, 99));
  const unreadDescription = hasUnreadSubwaves
    ? t(locale, "waves.sidebar.subwavesToggleUnreadDescription", {
        count: unreadDropsCount > 99 ? `${unreadCount}+` : unreadCount,
      })
    : undefined;

  return (
    <IconButton
      variant="ghost"
      size={24}
      shape="compact"
      aria-label={t(locale, labelKey, { waveName: parentWaveName })}
      aria-describedby={unreadDescription ? unreadId : undefined}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || undefined}
      aria-expanded={isExpanded}
      title={unreadDescription}
      onClick={(event) => {
        if (!event.defaultPrevented && !isLoading) onClick();
      }}
      className="tw-absolute tw-inset-y-0 tw-left-1 tw-z-10 tw-my-auto touch-only:tw-size-11"
    >
      {isLoading ? (
        <ArrowPathIcon
          aria-hidden="true"
          className="tw-size-3.5 tw-animate-spin motion-reduce:tw-animate-none"
        />
      ) : (
        <span className="tw-relative tw-flex">
          <ChevronRightIcon
            aria-hidden="true"
            className={`tw-size-3.5 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${isExpanded ? "tw-rotate-90" : ""}`}
          />
          {hasUnreadSubwaves && !isExpanded && (
            <span
              aria-hidden="true"
              data-testid="sidebar-subwave-unread-dot"
              className="tw-pointer-events-none tw-absolute -tw-right-0.5 -tw-top-0.5 tw-size-1.5 tw-rounded-full tw-bg-primary-400"
            />
          )}
        </span>
      )}
      {unreadDescription && (
        <span id={unreadId} className="tw-sr-only">
          {unreadDescription}
        </span>
      )}
    </IconButton>
  );
}
