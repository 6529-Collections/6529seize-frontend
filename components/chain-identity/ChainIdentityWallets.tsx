"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useSyncExternalStore } from "react";
import { isAddress, type Hex } from "viem";
import type { Config } from "wagmi";
import { useAuth } from "@/components/auth/authContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import { chainGateway, type ChainIdentity } from "@/lib/chain-identity/gateway";
import { identityRemove } from "@/lib/chain-identity/identityOps";
import {
  draftJoin,
  JOIN_VALID_MS,
  joinReadiness,
  ROLE_SIGNER,
  type JoinReadiness,
} from "@/lib/chain-identity/joins";
import {
  ChainOperationError,
  draftOperation,
} from "@/lib/chain-identity/operation";
import {
  serverStartedJoins,
  snapshotStartedJoins,
  startedJoins,
  subscribeStartedJoins,
} from "@/lib/chain-identity/pendingJoin";
import { chainRelay } from "@/lib/chain-identity/relay";
import { walletSigner } from "@/lib/chain-identity/signers";
import ChainActionStatus from "./ChainActionStatus";
import ChainStartedJoin from "./ChainStartedJoin";
import { chainErrorMessage } from "./chainErrorMessage";
import {
  CHAIN_HINT_CLASS,
  CHAIN_INPUT_CLASS,
  CHAIN_LABEL_CLASS,
  ChainSection,
  shortHex,
} from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";
import { useChainClock } from "./useChainClock";

const DATE_TIME: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

const sameWallet = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();

/** The time the joining wallet has to sign, in hours, as words. */
const joinWindow = (locale: SupportedLocale): string =>
  new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "hour",
    unitDisplay: "long",
  }).format(JOIN_VALID_MS / 3_600_000);

/** What the chain says about the wallet typed under "Add a wallet". */
function addWalletHint(
  locale: SupportedLocale,
  input: {
    readonly typed: string;
    readonly typedOk: boolean;
    readonly readiness: JoinReadiness | null;
    readonly principalId: Hex;
    readonly checking: boolean;
    readonly error: unknown;
  }
): string | null {
  const { readiness } = input;
  if (input.typed !== "" && !input.typedOk) {
    return t(locale, "chainIdentity.wallets.addInvalid");
  }
  if (input.typedOk && input.checking && readiness === null) {
    return t(locale, "chainIdentity.wallets.checking");
  }
  if (readiness?.kind === "bound") {
    return sameWallet(readiness.principalId, input.principalId)
      ? t(locale, "chainIdentity.wallets.readyMine")
      : t(locale, "chainIdentity.wallets.readyBound");
  }
  if (readiness?.kind === "waiting") {
    return t(locale, "chainIdentity.wallets.readyWaiting", {
      left: formatDate(locale, readiness.leftMs, DATE_TIME),
      until: formatDate(locale, readiness.untilMs, DATE_TIME),
    });
  }
  if (readiness?.kind === "free") {
    return t(locale, "chainIdentity.wallets.readyFree");
  }
  return input.error === null ? null : chainErrorMessage(locale, input.error);
}

/** What leaving does to this wallet, said before it signs. */
function leaveNote(
  locale: SupportedLocale,
  input: {
    readonly rejoinWaitMs: number | null;
    readonly nowMs: number;
  }
): string {
  const effect =
    input.rejoinWaitMs === null
      ? t(locale, "chainIdentity.wallets.leaveNoteNoWait")
      : t(locale, "chainIdentity.wallets.leaveNote", {
          date: formatDate(locale, input.nowMs + input.rejoinWaitMs, DATE_TIME),
        });
  return `${effect} ${t(locale, "chainIdentity.wallets.leaveAfter")}`;
}

/**
 * The identity's wallets: IDENTITY_REMOVE for this wallet itself, unless it
 * is the last (the 6529 Network takes a removal only from the wallet being
 * removed), and IDENTITY_JOIN, which this wallet signs first and 6529.io's
 * relay holds until the new wallet signs, on this device or another.
 */
export default function ChainIdentityWallets({
  wallet,
  config,
  identity,
  rejoinWaitMs,
  onChanged,
}: {
  readonly wallet: Hex;
  readonly config: Config;
  readonly identity: ChainIdentity;
  /**
   * The chain's wait before a wallet that left can join another identity or
   * create one; null: unknown.
   */
  readonly rejoinWaitMs: number | null;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const { requestAuth } = useAuth();
  const [joining, setJoining] = useState("");
  // The wallet the join being signed adds: fixed when "Add wallet" is clicked.
  const [joinTarget, setJoinTarget] = useState<Hex | null>(null);
  const leave = useChainAction(onChanged);
  const join = useChainAction(() => setJoining(""));
  const started = useSyncExternalStore(
    subscribeStartedJoins,
    snapshotStartedJoins,
    serverStartedJoins
  ).filter((item) => sameWallet(item.principalId, identity.principalId));
  const nowMs = useChainClock();
  // One held join per wallet: its nonce would clash with a second one's.
  const waiting = started.find(
    (item) =>
      sameWallet(item.identityWallet, wallet) && item.expiresAtMs > nowMs
  );

  const typed = joining.trim();
  const typedOk = isAddress(typed);
  // Only a whole address is read, so typing needs no debounce.
  const checked = typed.toLowerCase();
  const membership = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "membership", checked],
    queryFn: ({ signal }) =>
      chainGateway.getWalletMembership(checked as Hex, signal),
    enabled: typedOk,
    staleTime: 5_000,
  });
  const readiness =
    typedOk && membership.data
      ? joinReadiness(
          membership.data,
          rejoinWaitMs,
          nowMs,
          identity.principalId
        )
      : null;
  const canJoin =
    typedOk && readiness?.kind === "free" && waiting === undefined;
  // Only this wallet can leave, and never as the identity's last wallet.
  const canLeave =
    identity.wallets.length > 1 &&
    identity.wallets.some((item) => sameWallet(item, wallet));

  const readinessText = addWalletHint(locale, {
    typed,
    typedOk,
    readiness,
    principalId: identity.principalId,
    checking: membership.isFetching,
    error: membership.isError ? membership.error : null,
  });

  const startLeave = () => {
    void leave.prepare(async () => {
      const operation = identityRemove(identity.principalId, wallet, wallet);
      return {
        draft: await draftOperation(operation.request, operation.primaryType),
        signer: walletSigner(config, wallet),
        payer: "identity",
      };
    });
  };

  // Shown only while the wallet is asked to confirm leaving.
  const leaveText = leaveNote(locale, { rejoinWaitMs, nowMs });

  const startJoin = () => {
    if (!canJoin) {
      return;
    }
    const target = typed.toLowerCase() as Hex;
    setJoinTarget(target);
    void join.prepare(async () => {
      // The relay keeps the first signature for this wallet's 6529.io session.
      const { success } = await requestAuth();
      if (!success) {
        throw new ChainOperationError(
          "signer_mismatch",
          t(locale, "chainIdentity.wallets.signInFailed")
        );
      }
      const draft = await draftJoin(identity.principalId, wallet, target);
      return {
        draft,
        signer: walletSigner(config, wallet),
        payer: "identity",
        held: true,
        submit: async (signed, signature) => {
          await chainRelay.hold(signed, [
            { role: ROLE_SIGNER, key_type: 1, sig: signature },
          ]);
          startedJoins.save({
            txId: signed.txId,
            principalId: identity.principalId,
            identityWallet: wallet,
            joiningWallet: target,
            expiresAtMs: Number(signed.envelope.header["expiresAt"]),
          });
        },
      };
    });
  };

  return (
    <ChainSection
      id="chain-identity-wallets"
      heading={t(locale, "chainIdentity.wallets.heading")}
      body={t(locale, "chainIdentity.wallets.body")}
    >
      <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
        {identity.wallets.map((item) => (
          <li
            key={item}
            className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-px-3 tw-py-2"
          >
            <span className="tw-min-w-0 tw-break-all tw-font-mono tw-text-sm tw-text-iron-200">
              {item}
              {sameWallet(item, wallet) && (
                <span className="tw-ml-2 tw-font-sans tw-text-xs tw-text-iron-400">
                  {t(locale, "chainIdentity.wallets.current")}
                </span>
              )}
            </span>
            {canLeave && sameWallet(item, wallet) && (
              <Button
                variant="secondary"
                size="sm"
                disabled={leave.busy || leave.state.kind === "confirm"}
                aria-describedby="chain-identity-leave-hint"
                onClick={startLeave}
              >
                {t(locale, "chainIdentity.wallets.leave")}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {canLeave && (
        <p id="chain-identity-leave-hint" className={CHAIN_HINT_CLASS}>
          {t(locale, "chainIdentity.wallets.leaveHint")}
        </p>
      )}
      <ChainActionStatus
        state={leave.state}
        note={leaveText}
        onConfirm={() => void leave.confirm()}
        onCancel={leave.cancel}
      />

      <div className="tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-4">
        <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {t(locale, "chainIdentity.wallets.addHeading")}
        </h3>
        <p className="tw-mb-3 tw-mt-1.5 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "chainIdentity.wallets.addBody", {
            time: joinWindow(locale),
          })}
        </p>
        {started.length > 0 && (
          <ul className="tw-mb-4 tw-mt-0 tw-list-none tw-space-y-3 tw-p-0">
            {started.map((item) => (
              <ChainStartedJoin
                key={item.txId}
                join={item}
                identity={identity}
                onChanged={onChanged}
              />
            ))}
          </ul>
        )}
        {waiting ? (
          <p className={CHAIN_HINT_CLASS}>
            {t(locale, "chainIdentity.wallets.oneAtATime", {
              wallet: shortHex(waiting.joiningWallet),
            })}
          </p>
        ) : (
          <>
            <label
              htmlFor="chain-identity-join-wallet"
              className={CHAIN_LABEL_CLASS}
            >
              {t(locale, "chainIdentity.wallets.addLabel")}
            </label>
            <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center">
              <input
                id="chain-identity-join-wallet"
                className={`${CHAIN_INPUT_CLASS} tw-font-mono sm:tw-max-w-md`}
                value={joining}
                autoComplete="off"
                spellCheck={false}
                placeholder={t(locale, "chainIdentity.addressPlaceholder")}
                disabled={join.busy || join.state.kind === "confirm"}
                aria-invalid={typed !== "" && !canJoin}
                aria-describedby="chain-identity-join-hint"
                onChange={(event) => setJoining(event.target.value)}
              />
              <Button
                variant="primary"
                size="md"
                disabled={
                  !canJoin || join.busy || join.state.kind === "confirm"
                }
                onClick={startJoin}
              >
                {t(locale, "chainIdentity.wallets.addAction")}
              </Button>
            </div>
            <p
              id="chain-identity-join-hint"
              aria-live="polite"
              className={CHAIN_HINT_CLASS}
            >
              {readinessText}
            </p>
          </>
        )}
        <ChainActionStatus
          state={
            join.state.kind === "held" && waiting === undefined
              ? { kind: "idle" }
              : join.state
          }
          note={
            joinTarget === null
              ? undefined
              : t(locale, "chainIdentity.wallets.joinNote", {
                  wallet: shortHex(joinTarget),
                })
          }
          onConfirm={() => void join.confirm()}
          onCancel={join.cancel}
        />
      </div>
    </ChainSection>
  );
}
