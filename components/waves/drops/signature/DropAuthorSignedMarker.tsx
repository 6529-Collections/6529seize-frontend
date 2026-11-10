"use client";

import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ShieldCheckIcon } from "@heroicons/react/16/solid";
import {
  QuestionMarkCircleIcon,
  ShieldCheckIcon as ShieldCheckOutlineIcon,
  ShieldExclamationIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Tooltip } from "react-tooltip";
import DropGroupSignatureDialog, {
  type GroupSignatureDrop,
} from "./DropGroupSignatureDialog";
import DropSignatureDialog from "./DropSignatureDialog";
import { authorSignedLabel, isDropAuthorSigned } from "./dropAuthorSigned";
import {
  useDropSealStates,
  type SealState,
  type VerdictDrop,
} from "./dropSignatureVerdicts";
import { useNearViewport } from "./useNearViewport";

type MarkedDrop = VerdictDrop;

/** What a seal shows: a drop's state, or a group's ("all" or "partial"). */
type SealPresentation = SealState | "all" | "partial";

const SEAL_LABEL_KEYS = {
  verified: "signedMessages.marker.label",
  pending: "signedMessages.marker.pending",
  unverified: "signedMessages.marker.unverified",
  unlinked: "signedMessages.marker.unlinked",
  failed: "signedMessages.marker.failed",
} as const satisfies Record<SealState, string>;

/**
 * Each state has its own shape, so it never rests on colour alone: the
 * filled seal only once this browser verified the signature.
 */
function SealIcon({ state }: { readonly state: SealPresentation }) {
  switch (state) {
    case "verified":
    case "all":
      return (
        <ShieldCheckIcon
          aria-hidden="true"
          data-seal-state={state}
          className="tw-size-3.5"
        />
      );
    case "partial":
      return (
        <ShieldCheckOutlineIcon
          aria-hidden="true"
          data-seal-state="partial"
          className="tw-size-3.5"
          strokeWidth={2}
        />
      );
    case "pending":
      return (
        <ShieldCheckOutlineIcon
          aria-hidden="true"
          data-seal-state="pending"
          className="tw-size-3.5 tw-opacity-50"
        />
      );
    case "unverified":
      return (
        <QuestionMarkCircleIcon
          aria-hidden="true"
          data-seal-state="unverified"
          className="tw-size-3.5"
          strokeWidth={2}
        />
      );
    case "unlinked":
      // Neutral: neither the verified shield nor the failure state.
      return (
        <UserMinusIcon
          aria-hidden="true"
          data-seal-state="unlinked"
          className="tw-size-3.5"
          strokeWidth={2}
        />
      );
    case "failed":
      return (
        <ShieldExclamationIcon
          aria-hidden="true"
          data-seal-state="failed"
          className="tw-size-3.5 tw-text-red"
          strokeWidth={2}
        />
      );
  }
}

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
  buttonRef,
}: {
  readonly label: string;
  readonly icon: ReactNode;
  readonly onOpenDialog: () => void;
  /** The Signature dialog this seal opens (rendered closed until then). */
  readonly dialog: ReactNode;
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  const { hasTouchScreen } = useDeviceInfo();
  const tooltipId = `drop-author-signed-${useId()}`;
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const showTooltip = !hasTouchScreen;

  return (
    <>
      <button
        ref={buttonRef}
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

/** This browser's check of one drop, queued while its seal is near the viewport. */
function useNearDropSealState(
  drop: MarkedDrop,
  ref: RefObject<Element | null>
): SealState {
  const near = useNearViewport(ref);
  const drops = useMemo(() => [drop], [drop]);
  return useDropSealStates(drops, near)[0] ?? "pending";
}

function DropAuthorSignedMarkerButton({ drop }: { readonly drop: MarkedDrop }) {
  const locale = useBrowserLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const state = useNearDropSealState(drop, buttonRef);
  return (
    <SignedSealButton
      buttonRef={buttonRef}
      label={t(locale, SEAL_LABEL_KEYS[state])}
      icon={<SealIcon state={state} />}
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

/**
 * A group's seal: any post whose signature does not match, then any still
 * being checked, then any signed by a wallet that is not on the author's
 * profile, then how many of all its posts this browser verified.
 */
function getGroupSeal(
  locale: SupportedLocale,
  states: readonly SealState[],
  total: number
): { readonly state: SealPresentation; readonly label: string } {
  if (states.includes("failed")) {
    return { state: "failed", label: t(locale, "signedMessages.group.failed") };
  }
  if (states.includes("pending")) {
    return {
      state: "pending",
      label: t(locale, "signedMessages.group.pending"),
    };
  }
  if (states.includes("unlinked")) {
    return {
      state: "unlinked",
      label: t(locale, "signedMessages.group.unlinked"),
    };
  }
  const verified = states.filter((state) => state === "verified").length;
  if (verified === 0) {
    return {
      state: "unverified",
      label: t(locale, "signedMessages.group.unverified"),
    };
  }
  const category =
    selectPluralCategory(locale, total) === "one" ? "one" : "other";
  const count = formatInteger(locale, total);
  if (verified === total) {
    return {
      state: "all",
      label: t(locale, GROUP_ALL_KEYS[category], { count }),
    };
  }
  // "2 of 3 posts signed by their author": verified here, not just claimed.
  return {
    state: "partial",
    label: t(locale, GROUP_PARTIAL_KEYS[category], {
      signed: formatInteger(locale, verified),
      count,
    }),
  };
}

function DropGroupSignedMarkerButton({
  group,
  signedDrops,
}: {
  readonly group: readonly GroupSignatureDrop[];
  /** The posts 6529.io marks as signed, checked while the seal is near the viewport. */
  readonly signedDrops: readonly GroupSignatureDrop[];
}) {
  const locale = useBrowserLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const near = useNearViewport(buttonRef);
  const states = useDropSealStates(signedDrops, near);
  const seal = getGroupSeal(locale, states, group.length);
  return (
    <SignedSealButton
      buttonRef={buttonRef}
      label={seal.label}
      icon={<SealIcon state={seal.state} />}
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

function GroupSealBeside({
  group,
  children,
}: {
  readonly group: readonly GroupSignatureDrop[];
  readonly children: ReactNode;
}) {
  const signedDrops = useMemo(() => group.filter(isDropAuthorSigned), [group]);
  if (signedDrops.length === 0) {
    return children;
  }
  return (
    <SealBeside
      seal={
        <DropGroupSignedMarkerButton group={group} signedDrops={signedDrops} />
      }
    >
      {children}
    </SealBeside>
  );
}

/**
 * Adds the author-signed seal beside a drop's timestamp and keeps both on
 * one line. When the seal nears the viewport, this browser verifies the signature
 * itself; the seal reads "Signed by its author" only after that check
 * passed, a neutral pending state until then, and distinct states when the
 * signature cannot be verified here or does not match. The seal opens the
 * Signature dialog. Unsigned drops render the timestamp exactly as before.
 *
 * With `group` (a chat header followed by grouped posts by the same author),
 * the seal stands for the whole group: a full seal when this browser
 * verified every post, an outlined seal when it verified only some, and
 * nothing when 6529.io marks none as signed. It then opens the group
 * Signature dialog. A group of one behaves as a drop.
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
    return <GroupSealBeside group={group}>{children}</GroupSealBeside>;
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

function StaticSeal({
  state,
  sealRef,
}: {
  readonly state: SealState;
  readonly sealRef?: RefObject<HTMLSpanElement | null> | undefined;
}) {
  const locale = useBrowserLocale();
  return (
    <span
      ref={sealRef}
      role="img"
      aria-label={t(locale, SEAL_LABEL_KEYS[state])}
      className="tw-inline-flex tw-flex-shrink-0 tw-text-iron-400"
    >
      <SealIcon state={state} />
    </span>
  );
}

function CheckedStaticSeal({ drop }: { readonly drop: MarkedDrop }) {
  const sealRef = useRef<HTMLSpanElement>(null);
  const state = useNearDropSealState(drop, sealRef);
  return <StaticSeal state={state} sealRef={sealRef} />;
}

/**
 * Static seal for timestamps that cannot hold controls: the one revealed on
 * grouped chat rows and timestamps inside a button (search results, entry
 * pickers). The drop menu's Signature item opens the dialog there. Given the
 * drop, it shows this browser's check; without one it never claims more
 * than signed, not yet verified.
 */
export function DropAuthorSignedIndicator({
  drop,
}: {
  readonly drop?: MarkedDrop | undefined;
}) {
  return drop ? (
    <CheckedStaticSeal drop={drop} />
  ) : (
    <StaticSeal state="unverified" />
  );
}

/**
 * The hidden name of a control that is the whole drop card: point its
 * aria-labelledby at `id`. It is the label with the drop's signed status
 * as this browser's check reports it, and follows that check as it
 * finishes.
 */
export function AuthorSignedLabel({
  id,
  drop,
  label,
}: {
  readonly id: string;
  readonly drop: MarkedDrop;
  readonly label: string;
}) {
  const locale = useBrowserLocale();
  const drops = useMemo(() => [drop], [drop]);
  const state = useDropSealStates(drops, false)[0] ?? "pending";
  return (
    <span id={id} hidden>
      {authorSignedLabel(locale, label, drop, state)}
    </span>
  );
}
