"use client";

import Link from "next/link";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { formatFake6529 } from "./chainAmount";
import { chainFailureText, isFeeShortfall } from "./chainErrorMessage";
import type { ChainActionState } from "./useChainAction";

/**
 * Where a change stands: the fee to confirm, the wallet prompt, the wait for
 * the 6529 Network, and the outcome.
 */
export default function ChainActionStatus({
  state,
  onConfirm,
  onCancel,
  note,
  feeText,
  feeShortfallText,
}: {
  readonly state: ChainActionState;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  /** What the change does that the person should know before signing. */
  readonly note?: string | undefined;
  /** The fee line, when the payer isn't this wallet or its identity. */
  readonly feeText?: ((amount: string) => string) | undefined;
  /** What to say when the payer is short of $fake6529, if not this page's. */
  readonly feeShortfallText?: string | undefined;
}) {
  // One live region, present from the first render, so each step is read out.
  return (
    <div aria-live="polite" aria-atomic="true">
      <ChainActionStatusContent
        state={state}
        onConfirm={onConfirm}
        onCancel={onCancel}
        note={note}
        feeText={feeText}
        feeShortfallText={feeShortfallText}
      />
    </div>
  );
}

function ChainActionStatusContent({
  state,
  onConfirm,
  onCancel,
  note,
  feeText,
  feeShortfallText,
}: {
  readonly state: ChainActionState;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly note?: string | undefined;
  readonly feeText?: ((amount: string) => string) | undefined;
  readonly feeShortfallText?: string | undefined;
}) {
  const locale = useBrowserLocale();

  if (state.kind === "idle") {
    return null;
  }

  if (state.kind === "confirm") {
    const amount = formatFake6529(locale, state.maxFee, true);
    const fee =
      feeText?.(amount) ??
      t(
        locale,
        state.payer === "identity"
          ? "chainIdentity.action.confirmIdentity"
          : "chainIdentity.action.confirmWallet",
        { amount }
      );
    return (
      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-min-w-0 tw-space-y-1">
          {note && (
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
              {note}
            </p>
          )}
          <p className="tw-m-0 tw-text-sm tw-text-iron-200">{fee}</p>
        </div>
        <div className="tw-flex tw-shrink-0 tw-gap-2">
          <Button variant="primary" size="sm" onClick={onConfirm}>
            {t(
              locale,
              state.keyType === 1
                ? "chainIdentity.action.sign"
                : "chainIdentity.action.confirmKey"
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {t(locale, "chainIdentity.action.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  if (state.kind === "failed") {
    const short = isFeeShortfall(state.error);
    if (short && feeShortfallText !== undefined) {
      return (
        <p role="alert" className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-error">
          {feeShortfallText}
        </p>
      );
    }
    return (
      <p role="alert" className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-error">
        {chainFailureText(locale, state.error)}
        {short && (
          <>
            {" "}
            <Link
              href="#chain-identity-fees"
              className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
            >
              {t(locale, "chainIdentity.action.feeHint")}
            </Link>
          </>
        )}
      </p>
    );
  }

  const key = {
    preparing: "chainIdentity.action.preparing",
    signingDocument: "chainIdentity.action.signingDocument",
    signing: "chainIdentity.action.signing",
    sending: "chainIdentity.action.sending",
    held: "chainIdentity.action.held",
    done: "chainIdentity.action.done",
  } as const;
  return (
    <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-300">
      {t(locale, key[state.kind])}
    </p>
  );
}
