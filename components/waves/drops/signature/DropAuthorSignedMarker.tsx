"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { t } from "@/i18n/messages";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import { ShieldCheckIcon } from "@heroicons/react/16/solid";
import { useId, useState, type ReactNode, type SyntheticEvent } from "react";
import { Tooltip } from "react-tooltip";
import DropSignatureDialog from "./DropSignatureDialog";

type AuthorSignableDrop = Pick<ApiDrop, "id" | "is_author_signed">;
type MarkedDrop = AuthorSignableDrop &
  Pick<ApiDrop, "title" | "parts" | "wave" | "author">;

/** Positive-only: unsigned drops get no marker at all. */
export const isDropAuthorSigned = (drop: AuthorSignableDrop): boolean =>
  isSignedMessagesEnabled() &&
  drop.is_author_signed === true &&
  !drop.id.startsWith("temp-");

// The dialog renders in a portal, but React still bubbles its events through
// the drop row, whose touch and pointer handlers start long press and swipe.
const stopRowGesture = (event: SyntheticEvent) => event.stopPropagation();

function DropAuthorSignedMarkerButton({ drop }: { readonly drop: MarkedDrop }) {
  const locale = useBrowserLocale();
  const { hasTouchScreen } = useDeviceInfo();
  const tooltipId = `drop-author-signed-${useId()}`;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const label = t(locale, "signedMessages.marker.label");
  const showTooltip = !hasTouchScreen;

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        data-tooltip-id={showTooltip ? tooltipId : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsTooltipOpen(false);
          setIsDialogOpen(true);
        }}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        onFocus={() => setIsTooltipOpen(true)}
        onBlur={() => setIsTooltipOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsTooltipOpen(false);
          }
        }}
        // 24px target; the negative margins keep the row height and spacing.
        className="-tw-mx-1 -tw-my-1.5 tw-inline-flex tw-size-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-0 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-200"
      >
        <ShieldCheckIcon aria-hidden="true" className="tw-size-3.5" />
      </button>
      {showTooltip && (
        <Tooltip
          id={tooltipId}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          style={TOOLTIP_STYLES}
          isOpen={isTooltipOpen}
        >
          <span className="tw-text-xs">{label}</span>
        </Tooltip>
      )}
      <span
        className="tw-contents"
        onPointerDown={stopRowGesture}
        onTouchStart={stopRowGesture}
      >
        <DropSignatureDialog
          dropId={drop.id}
          drop={drop}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </span>
    </>
  );
}

/**
 * Adds the "Signed by its author" seal beside a drop's timestamp and keeps
 * both on one line. The seal opens the Signature dialog, which verifies the
 * signature in the browser. Unsigned drops render the timestamp exactly as
 * before.
 */
export function WithDropAuthorSignedMarker({
  drop,
  children,
}: {
  readonly drop: MarkedDrop;
  readonly children: ReactNode;
}) {
  if (!isDropAuthorSigned(drop)) {
    return children;
  }
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-x-1.5">
      {children}
      <DropAuthorSignedMarkerButton drop={drop} />
    </span>
  );
}

/**
 * Static seal for the timestamp revealed on grouped chat rows, which cannot
 * hold controls. The drop menu's Signature item opens the dialog there.
 */
export function DropAuthorSignedIndicator() {
  const locale = useBrowserLocale();
  return (
    <span
      role="img"
      aria-label={t(locale, "signedMessages.marker.label")}
      className="tw-inline-flex tw-flex-shrink-0 tw-text-iron-400"
    >
      <ShieldCheckIcon aria-hidden="true" className="tw-size-3.5" />
    </span>
  );
}
