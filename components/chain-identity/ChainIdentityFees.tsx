"use client";

import { useState } from "react";
import type { Hex } from "viem";
import type { Config } from "wagmi";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { requestDrip, type DripOutcome } from "@/lib/chain-identity/drip";
import { fundIdentity } from "@/lib/chain-identity/identityOps";
import {
  ChainOperationError,
  draftOperation,
} from "@/lib/chain-identity/operation";
import { walletSigner } from "@/lib/chain-identity/signers";
import { fake6529Input, formatFake6529, parseFake6529 } from "./chainAmount";
import ChainActionStatus from "./ChainActionStatus";
import { chainErrorMessage } from "./chainErrorMessage";
import {
  CHAIN_HINT_CLASS,
  CHAIN_INPUT_CLASS,
  CHAIN_LABEL_CLASS,
  ChainSection,
} from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";

const DRIP_COPY: Record<DripOutcome["kind"], MessageKey> = {
  sent: "chainIdentity.fees.dripSent",
  already: "chainIdentity.fees.dripAlready",
  limited: "chainIdentity.fees.dripLimited",
  unavailable: "chainIdentity.fees.dripUnavailable",
};

/** The drip, and moving $fake6529 from the wallet to its identity. */
export default function ChainIdentityFees({
  wallet,
  config,
  principalId,
  currencyAsset,
  walletBalance,
  identityBalance,
  onChanged,
}: {
  readonly wallet: Hex;
  readonly config: Config;
  readonly principalId: Hex | null;
  readonly currencyAsset: Hex | null;
  readonly walletBalance: bigint | null;
  readonly identityBalance: bigint | null;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const [dripping, setDripping] = useState(false);
  const [dripMessage, setDripMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const move = useChainAction(() => {
    setAmount("");
    onChanged();
  });
  const parsed = parseFake6529(amount);
  const [moveNote, setMoveNote] = useState<string | undefined>(undefined);
  const amountOk =
    parsed !== null &&
    parsed > 0n &&
    (walletBalance === null || parsed <= walletBalance);

  const drip = async () => {
    setDripping(true);
    setDripMessage(null);
    try {
      const outcome = await requestDrip(config, wallet);
      setDripMessage(t(locale, DRIP_COPY[outcome.kind]));
      if (outcome.kind === "sent") {
        globalThis.setTimeout(onChanged, 15_000);
      }
    } catch (error) {
      setDripMessage(
        chainErrorMessage(locale, error) ??
          t(locale, "chainIdentity.action.declined")
      );
    } finally {
      setDripping(false);
    }
  };

  // The wallet pays the move's fee too, so the fee is held back from it.
  const startMove = () => {
    if (!amountOk || principalId === null || currencyAsset === null) {
      return;
    }
    setMoveNote(undefined);
    const draftMove = (value: bigint) => {
      const operation = fundIdentity(wallet, principalId, currencyAsset, value);
      return draftOperation(operation.request, operation.primaryType);
    };
    void move.prepare(async () => {
      let value = parsed;
      let draft = await draftMove(value);
      const fits = (fee: string) =>
        walletBalance === null || value + BigInt(fee) <= walletBalance;
      if (!fits(draft.fee.maxFee) && walletBalance !== null) {
        value = walletBalance - BigInt(draft.fee.maxFee);
        if (value <= 0n) {
          throw new ChainOperationError(
            "stated",
            t(locale, "chainIdentity.fees.moveNoRoom")
          );
        }
        draft = await draftMove(value);
        if (!fits(draft.fee.maxFee)) {
          throw new ChainOperationError(
            "stated",
            t(locale, "chainIdentity.fees.moveNoRoom")
          );
        }
        setMoveNote(
          t(locale, "chainIdentity.fees.moveAdjusted", {
            amount: formatFake6529(locale, value),
          })
        );
      }
      return {
        draft,
        signer: walletSigner(config, wallet),
        payer: "wallet",
      };
    });
  };

  return (
    <ChainSection
      id="chain-identity-fees"
      heading={t(locale, "chainIdentity.fees.heading")}
      body={t(locale, "chainIdentity.fees.body")}
    >
      {principalId !== null && identityBalance === 0n && (
        <p className="tw-mb-4 tw-mt-0 tw-max-w-3xl tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-px-3 tw-py-2 tw-text-sm tw-leading-6 tw-text-iron-100">
          {t(locale, "chainIdentity.fees.empty")}
        </p>
      )}
      <Button
        variant="secondary"
        size="md"
        disabled={dripping}
        onClick={() => void drip()}
      >
        {t(locale, "chainIdentity.fees.drip")}
      </Button>
      {dripMessage && (
        <p
          role="status"
          className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-300"
        >
          {dripMessage}
        </p>
      )}
      {principalId !== null && (
        <div className="tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-4">
          <p className="tw-mb-3 tw-mt-0 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "chainIdentity.fees.moveBody")}
          </p>
          <label
            htmlFor="chain-identity-move-amount"
            className={CHAIN_LABEL_CLASS}
          >
            {t(locale, "chainIdentity.fees.moveAmount")}
          </label>
          <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center">
            <input
              id="chain-identity-move-amount"
              className={`${CHAIN_INPUT_CLASS} sm:tw-max-w-[12rem]`}
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              disabled={move.busy}
              aria-invalid={amount !== "" && !amountOk}
              aria-describedby="chain-identity-move-hint"
              onChange={(event) => setAmount(event.target.value)}
            />
            {walletBalance !== null && walletBalance > 0n && (
              <Button
                variant="secondary"
                size="md"
                disabled={move.busy || move.state.kind === "confirm"}
                onClick={() => setAmount(fake6529Input(walletBalance))}
              >
                {t(locale, "chainIdentity.fees.moveAll")}
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              disabled={!amountOk || move.busy || move.state.kind === "confirm"}
              onClick={startMove}
            >
              {t(locale, "chainIdentity.fees.moveAction")}
            </Button>
          </div>
          {amount !== "" && !amountOk && (
            <p id="chain-identity-move-hint" className={CHAIN_HINT_CLASS}>
              {t(locale, "chainIdentity.fees.moveInvalid")}
            </p>
          )}
          <ChainActionStatus
            state={move.state}
            note={moveNote}
            onConfirm={() => void move.confirm()}
            onCancel={move.cancel}
          />
        </div>
      )}
    </ChainSection>
  );
}
