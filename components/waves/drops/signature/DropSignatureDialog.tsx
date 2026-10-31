"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import { shortenAddress } from "@/helpers/address.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import { createContractWalletReader } from "@/lib/device-signing/contract-wallet-reader";
import { getDeviceKeyFingerprint } from "@/lib/device-signing/grant-message";
import {
  verifyDropSignedEvents,
  type DropSignatureVerdict,
  type WalletSignatureCheck,
  toDisplayedDropContent,
} from "@/lib/device-signing/verify-signed-events";
import {
  fetchAuthorWallets,
  fetchDropSignedEvents,
} from "@/services/api/device-grants-api";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  MinusCircleIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useQuery } from "@tanstack/react-query";
import type { KeyboardEvent, ReactNode, SyntheticEvent } from "react";
import { usePublicClient } from "wagmi";

interface DropSignatureDialogProps {
  readonly dropId: string;
  /** The drop as shown; its content is checked against the signed body. */
  readonly drop?:
    | Pick<ApiDrop, "title" | "parts" | "wave" | "author">
    | undefined;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

/** How the wallet's sign-in signature was verified, one label per check. */
const WALLET_SIGNATURE_KEYS = {
  verified: "signedMessages.signature.walletVerified",
  "contract-verified": "signedMessages.signature.contractWalletVerified",
} as const satisfies Record<WalletSignatureCheck, string>;

function SignedDetails({
  locale,
  verdict,
}: {
  readonly locale: SupportedLocale;
  readonly verdict: Extract<DropSignatureVerdict, { status: "signed" }>;
}) {
  const { signature } = verdict;
  const rows: ReadonlyArray<readonly [string, string]> = [
    [
      t(locale, "signedMessages.signature.wallet"),
      shortenAddress(signature.wallet),
    ],
    [
      t(locale, "signedMessages.signature.deviceKey"),
      getDeviceKeyFingerprint(signature.deviceKey),
    ],
    [
      t(locale, "signedMessages.signature.grantExpires"),
      formatDate(locale, signature.grantExpiresAt),
    ],
    [
      t(locale, "signedMessages.signature.walletSignature"),
      t(locale, WALLET_SIGNATURE_KEYS[signature.walletSignature]),
    ],
    [
      t(locale, "signedMessages.signature.currentContent"),
      t(
        locale,
        verdict.currentContentSigned
          ? "signedMessages.signature.currentSigned"
          : "signedMessages.signature.currentUnsigned"
      ),
    ],
  ];
  return (
    <dl className="tw-m-0 tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-y-3 sm:tw-grid-cols-[auto_1fr] sm:tw-gap-x-6">
      {rows.map(([term, value]) => (
        <div key={term} className="tw-contents">
          <dt className="tw-text-xs tw-font-medium tw-text-iron-400 sm:tw-text-sm">
            {term}
          </dt>
          <dd className="tw-m-0 tw-break-words tw-font-mono tw-text-sm tw-text-iron-100">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const VERDICT_PRESENTATION = {
  signed: {
    Icon: ShieldCheckIcon,
    iconClassName: "tw-text-success",
    titleKey: "signedMessages.signature.signed",
    descriptionKey: "signedMessages.signature.signedDescription",
  },
  unsigned: {
    Icon: MinusCircleIcon,
    iconClassName: "tw-text-iron-400",
    titleKey: "signedMessages.signature.unsigned",
    descriptionKey: "signedMessages.signature.unsignedDescription",
  },
  invalid: {
    Icon: ExclamationTriangleIcon,
    iconClassName: "tw-text-red",
    titleKey: "signedMessages.signature.invalid",
    descriptionKey: "signedMessages.signature.invalidDescription",
  },
  // Neutral, never the signed seal: nothing was verified.
  unverifiable: {
    Icon: QuestionMarkCircleIcon,
    iconClassName: "tw-text-iron-400",
    titleKey: "signedMessages.signature.unverifiable",
    descriptionKey: "signedMessages.signature.unverifiableDescription",
  },
} as const;

function VerdictView({
  locale,
  verdict,
}: {
  readonly locale: SupportedLocale;
  readonly verdict: DropSignatureVerdict;
}) {
  const { Icon, iconClassName, titleKey, descriptionKey } =
    VERDICT_PRESENTATION[verdict.status];
  return (
    <div>
      <p className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-semibold tw-text-iron-50">
        <Icon
          aria-hidden="true"
          className={`tw-size-5 tw-flex-shrink-0 ${iconClassName}`}
        />
        <span>{t(locale, titleKey)}</span>
      </p>
      <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
        {t(locale, descriptionKey)}
      </p>
      {verdict.status === "signed" && (
        <SignedDetails locale={locale} verdict={verdict} />
      )}
    </div>
  );
}

type SignatureDrop = NonNullable<DropSignatureDialogProps["drop"]>;

/**
 * Fetches a drop's signed events and verifies them in the browser. Mounted
 * only when shown, so the group dialog checks a post only once it is opened.
 */
function useDropSignatureVerdict({
  dropId,
  drop,
}: {
  readonly dropId: string;
  readonly drop: SignatureDrop | undefined;
}) {
  const publicClient = usePublicClient({ chainId: 1 });
  // Contract-wallet grants (EIP-1271) are checked on Ethereum from the browser.
  const contractWallets = publicClient
    ? createContractWalletReader(publicClient)
    : undefined;
  const content = drop ? toDisplayedDropContent(drop) : undefined;
  return useQuery({
    queryKey: [QueryKey.DROP_SIGNED_EVENTS, dropId, content ?? null],
    queryFn: async ({ signal }) => {
      const signedEvents = await fetchDropSignedEvents(dropId, signal);
      // Only events are checked against the author's wallets, so an unsigned
      // drop (or one whose author is hidden) needs no identity lookup. A
      // failed lookup fails the query, which offers Try again.
      const authorAddress = drop?.author.primary_address;
      const authorWallets =
        drop && authorAddress && signedEvents.events.length > 0
          ? await fetchAuthorWallets(authorAddress, signal)
          : [];
      return await verifyDropSignedEvents(signedEvents, {
        contractWallets,
        displayed: content,
        expected: drop
          ? { dropId, waveId: drop.wave.id, authorWallets }
          : undefined,
      });
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/** Loading, error (with Try again) and verdict states for one drop. */
export function DropSignatureVerification({
  dropId,
  drop,
}: {
  readonly dropId: string;
  readonly drop?: SignatureDrop | undefined;
}) {
  const locale = useBrowserLocale();
  const query = useDropSignatureVerdict({ dropId, drop });
  return (
    <div aria-live="polite">
      {query.isPending && (
        <output className="tw-flex tw-items-center tw-gap-3 tw-text-sm tw-text-iron-300">
          <span
            aria-hidden="true"
            className="tw-size-5 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400 motion-reduce:tw-animate-none"
          />
          {t(locale, "signedMessages.signature.loading")}
        </output>
      )}
      {query.isError && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "signedMessages.signature.error")}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void query.refetch()}
          >
            {t(locale, "signedMessages.signature.retry")}
          </Button>
        </div>
      )}
      {query.data && <VerdictView locale={locale} verdict={query.data} />}
    </div>
  );
}

// The dialog renders in a portal, but React still bubbles its events through
// the component tree: through drop rows (long press, swipe) and through
// clickable cards such as quoted drops and link previews, whose click and
// Enter handlers would otherwise act. Escape and other keys still bubble, so
// Headless UI's window listener closes the dialog.
const stopBubbling = (event: SyntheticEvent) => event.stopPropagation();

const stopActivationKeys = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.stopPropagation();
  }
};

/** The dialog frame shared by the single-drop and group signature dialogs. */
export function SignatureDialogFrame({
  isOpen,
  onClose,
  title,
  children,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      // Above the dialogs a seal can appear in, such as the single-drop view.
      className="tailwind-scope tw-relative tw-z-[1000002]"
      onClick={stopBubbling}
      onKeyDown={stopActivationKeys}
      onPointerDown={stopBubbling}
      onTouchStart={stopBubbling}
    >
      <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-950/80" />
      <div className="tw-fixed tw-inset-0 tw-overflow-y-auto tw-p-4">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center sm:tw-items-center">
          <DialogPanel className="tw-w-full tw-max-w-lg tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 tw-shadow-2xl sm:tw-p-6">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
              <DialogTitle className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label={t(locale, "signedMessages.signature.close")}
                className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
              >
                <XMarkIcon aria-hidden="true" className="tw-size-5" />
              </button>
            </div>
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

function DropSignatureDialogContent({
  dropId,
  drop,
  isOpen,
  onClose,
}: DropSignatureDialogProps) {
  const locale = useBrowserLocale();
  return (
    <SignatureDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      title={t(locale, "signedMessages.signature.title")}
    >
      <div className="tw-mt-4">
        <DropSignatureVerification dropId={dropId} drop={drop} />
      </div>
    </SignatureDialogFrame>
  );
}

/**
 * Fetches a drop's signed events on demand and verifies them in the browser.
 * Renders nothing while signed messages are disabled.
 */
export default function DropSignatureDialog(props: DropSignatureDialogProps) {
  if (!isSignedMessagesEnabled() || !props.isOpen) {
    return null;
  }
  return <DropSignatureDialogContent {...props} />;
}
