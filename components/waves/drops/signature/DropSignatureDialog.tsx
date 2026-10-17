"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import { shortenAddress } from "@/helpers/address.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import { getDeviceKeyFingerprint } from "@/lib/device-signing/grant-message";
import {
  verifyDropSignedEvents,
  type DropSignatureVerdict,
  type ContractSignatureVerifier,
  toDisplayedDropContent,
} from "@/lib/device-signing/verify-signed-events";
import { fetchDropSignedEvents } from "@/services/api/device-grants-api";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  MinusCircleIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

interface DropSignatureDialogProps {
  readonly dropId: string;
  /** The drop as shown; its content is checked against the signed body. */
  readonly drop?: Pick<ApiDrop, "title" | "parts"> | undefined;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

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
      t(
        locale,
        signature.walletSignature === "verified"
          ? "signedMessages.signature.walletVerified"
          : "signedMessages.signature.contractWallet"
      ),
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

function DropSignatureDialogContent({
  dropId,
  drop,
  isOpen,
  onClose,
}: DropSignatureDialogProps) {
  const locale = useBrowserLocale();
  const publicClient = usePublicClient({ chainId: 1 });
  // Contract-wallet grants (EIP-1271) are checked on Ethereum from the browser.
  const verifyContractSignature: ContractSignatureVerifier | undefined =
    publicClient
      ? async ({ address, message, signature, chainId }) => {
          if (chainId !== 1) {
            // No client for this chain: keep the labelled sign-in check.
            throw new Error(`No Ethereum client for chain ${chainId}`);
          }
          return await publicClient.verifyMessage({
            address,
            message,
            signature,
          });
        }
      : undefined;
  const content = drop ? toDisplayedDropContent(drop) : undefined;
  const query = useQuery({
    queryKey: [QueryKey.DROP_SIGNED_EVENTS, dropId, content ?? null],
    queryFn: async ({ signal }) =>
      await verifyDropSignedEvents(
        await fetchDropSignedEvents(dropId, signal),
        {
          verifyContractSignature,
          displayed: content,
        }
      ),
    enabled: isOpen,
    staleTime: 60_000,
    retry: 1,
  });

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="tailwind-scope tw-relative tw-z-[1000]"
    >
      <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-950/80" />
      <div className="tw-fixed tw-inset-0 tw-overflow-y-auto tw-p-4">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center sm:tw-items-center">
          <DialogPanel className="tw-w-full tw-max-w-lg tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 tw-shadow-2xl sm:tw-p-6">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
              <DialogTitle className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                {t(locale, "signedMessages.signature.title")}
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
            <div className="tw-mt-4" aria-live="polite">
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
                  <p
                    role="alert"
                    className="tw-m-0 tw-text-sm tw-text-iron-300"
                  >
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
              {query.data && (
                <VerdictView locale={locale} verdict={query.data} />
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
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
