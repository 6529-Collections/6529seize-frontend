"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ShieldCheckIcon } from "@heroicons/react/16/solid";
import { ShieldCheckIcon as ShieldCheckOutlineIcon } from "@heroicons/react/24/outline";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import DropGroupSignatureDialog, {
  type GroupSignatureDrop,
} from "./DropGroupSignatureDialog";
import DropSignatureDialog from "./DropSignatureDialog";
import { isDropAuthorSigned } from "./dropAuthorSigned";

type MarkedDrop = Pick<
  ApiDrop,
  "id" | "is_author_signed" | "title" | "parts" | "wave" | "author"
>;

// Enter and Space activate the seal itself; a clickable card around it must
// not treat them as its own activation. (The Signature dialogs keep their own
// events inside, see SignatureDialogFrame.)
const stopActivationKeys = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.stopPropagation();
  }
};

function SignedSealButton({
  label,
  icon,
  onOpenDialog,
  dialog,
}: {
  readonly label: string;
  readonly icon: ReactNode;
  readonly onOpenDialog: () => void;
  /** The Signature dialog this seal opens (rendered closed until then). */
  readonly dialog: ReactNode;
}) {
  const { hasTouchScreen } = useDeviceInfo();
  const tooltipId = `drop-author-signed-${useId()}`;
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const showTooltip = !hasTouchScreen;

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        {...(showTooltip && { "data-tooltip-id": tooltipId })}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsTooltipOpen(false);
          onOpenDialog();
        }}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        onFocus={() => setIsTooltipOpen(true)}
        onBlur={() => setIsTooltipOpen(false)}
        onKeyDown={(event) => {
          stopActivationKeys(event);
          if (event.key === "Escape") {
            setIsTooltipOpen(false);
          }
        }}
        // 24px target; the negative margins keep the row height and spacing.
        className="-tw-mx-1 -tw-my-1.5 tw-inline-flex tw-size-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-0 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-200"
      >
        {icon}
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
      {dialog}
    </>
  );
}

function DropAuthorSignedMarkerButton({ drop }: { readonly drop: MarkedDrop }) {
  const locale = useBrowserLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <SignedSealButton
      label={t(locale, "signedMessages.marker.label")}
      icon={<ShieldCheckIcon aria-hidden="true" className="tw-size-3.5" />}
      onOpenDialog={() => setIsDialogOpen(true)}
      dialog={
        <DropSignatureDialog
          dropId={drop.id}
          drop={drop}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      }
    />
  );
}

const GROUP_ALL_KEYS = {
  one: "signedMessages.group.all.one",
  other: "signedMessages.group.all.other",
} as const;

const GROUP_PARTIAL_KEYS = {
  one: "signedMessages.group.partial.one",
  other: "signedMessages.group.partial.other",
} as const;

/** "All 3 posts signed by their author" or "2 of 3 posts signed by their author". */
function getGroupSealLabel(
  locale: SupportedLocale,
  signedCount: number,
  total: number
): string {
  const category =
    selectPluralCategory(locale, total) === "one" ? "one" : "other";
  const count = formatInteger(locale, total);
  if (signedCount === total) {
    return t(locale, GROUP_ALL_KEYS[category], { count });
  }
  return t(locale, GROUP_PARTIAL_KEYS[category], {
    signed: formatInteger(locale, signedCount),
    count,
  });
}

function DropGroupSignedMarkerButton({
  group,
  signedCount,
}: {
  readonly group: readonly GroupSignatureDrop[];
  readonly signedCount: number;
}) {
  const locale = useBrowserLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const allSigned = signedCount === group.length;
  // A partly signed group shows an outlined seal: the shape, not only the
  // label, tells it apart from a fully signed group.
  const icon = allSigned ? (
    <ShieldCheckIcon
      aria-hidden="true"
      data-seal-state="all"
      className="tw-size-3.5"
    />
  ) : (
    <ShieldCheckOutlineIcon
      aria-hidden="true"
      data-seal-state="partial"
      className="tw-size-3.5"
      strokeWidth={2}
    />
  );
  return (
    <SignedSealButton
      label={getGroupSealLabel(locale, signedCount, group.length)}
      icon={icon}
      onOpenDialog={() => setIsDialogOpen(true)}
      dialog={
        <DropGroupSignatureDialog
          group={group}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      }
    />
  );
}

const SealBeside = ({
  children,
  seal,
}: {
  readonly children: ReactNode;
  readonly seal: ReactNode;
}) => (
  <span className="tw-inline-flex tw-items-center tw-gap-x-1.5">
    {children}
    {seal}
  </span>
);

/**
 * Adds the "Signed by its author" seal beside a drop's timestamp and keeps
 * both on one line. The seal opens the Signature dialog, which verifies the
 * signature in the browser. Unsigned drops render the timestamp exactly as
 * before.
 *
 * With `group` (a chat header followed by grouped posts by the same author),
 * the seal stands for the whole group: a full seal when every post is author
 * signed, an outlined seal when only some are, and nothing when none are. It
 * then opens the group Signature dialog. A group of one behaves as a drop.
 */
export function WithDropAuthorSignedMarker({
  drop,
  group,
  children,
}: {
  readonly drop: MarkedDrop;
  readonly group?: readonly GroupSignatureDrop[] | undefined;
  readonly children: ReactNode;
}) {
  if (group && group.length > 1) {
    const signedCount = group.filter(isDropAuthorSigned).length;
    if (signedCount === 0) {
      return children;
    }
    return (
      <SealBeside
        seal={
          <DropGroupSignedMarkerButton
            group={group}
            signedCount={signedCount}
          />
        }
      >
        {children}
      </SealBeside>
    );
  }
  if (!isDropAuthorSigned(drop)) {
    return children;
  }
  return (
    <SealBeside seal={<DropAuthorSignedMarkerButton drop={drop} />}>
      {children}
    </SealBeside>
  );
}

/**
 * Static seal for timestamps that cannot hold controls: the one revealed on
 * grouped chat rows and timestamps inside a button (search results, entry
 * pickers). The drop menu's Signature item opens the dialog there.
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
