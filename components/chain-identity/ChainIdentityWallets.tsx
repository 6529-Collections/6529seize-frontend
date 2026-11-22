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

/**
 * The identity's wallets: IDENTITY_REMOVE for any of them but the last, and
 * IDENTITY_JOIN, which this wallet signs first and 6529.io's relay holds
 * until the new wallet signs, on this device or another.
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
  /** The chain's wait before a removed wallet can join again; null: unknown. */
  readonly rejoinWaitMs: number | null;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const { requestAuth } = useAuth();
  const [joining, setJoining] = useState("");
  const [removing, setRemoving] = useState<Hex | null>(null);
  // The wallet the join being signed adds: fixed when "Add wallet" is clicked.
  const [joinTarget, setJoinTarget] = useState<Hex | null>(null);
  const remove = useChainAction(onChanged);
  const join = useChainAction(() => setJoining(""));
  const started = useSyncExternalStore(
    subscribeStartedJoins,
    snapshotStartedJoins,
    serverStartedJoins
  ).filter((item) => sameWallet(item.principalId, identity.principalId));
  // One held join per wallet: its nonce would clash with a second one's.
  const waiting = started.find(
    (item) =>
      sameWallet(item.identityWallet, wallet) && item.expiresAtMs > Date.now()
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
          Date.now(),
          identity.principalId
        )
      : null;
  const mine =
    readiness?.kind === "bound" &&
    sameWallet(readiness.principalId, identity.principalId);
  const canJoin =
    typedOk && readiness?.kind === "free" && waiting === undefined;
  const canRemove = identity.wallets.length > 1;

  let readinessText: string | null = null;
  if (typed !== "" && !typedOk) {
    readinessText = t(locale, "chainIdentity.wallets.addInvalid");
  } else if (typedOk && membership.isFetching && readiness === null) {
    readinessText = t(locale, "chainIdentity.wallets.checking");
  } else if (mine) {
    readinessText = t(locale, "chainIdentity.wallets.readyMine");
  } else if (readiness?.kind === "bound") {
    readinessText = t(locale, "chainIdentity.wallets.readyBound");
  } else if (readiness?.kind === "waiting") {
    readinessText = t(locale, "chainIdentity.wallets.readyWaiting", {
      left: formatDate(locale, readiness.leftMs, DATE_TIME),
      until: formatDate(locale, readiness.untilMs, DATE_TIME),
    });
  } else if (readiness?.kind === "free") {
    readinessText = t(locale, "chainIdentity.wallets.readyFree");
  } else if (membership.isError) {
    readinessText = chainErrorMessage(locale, membership.error);
  }

  const startRemove = (target: Hex) => {
    setRemoving(target);
    void remove.prepare(async () => {
      const operation = identityRemove(identity.principalId, wallet, target);
      return {
        draft: await draftOperation(operation.request, operation.primaryType),
        signer: walletSigner(config, wallet),
        payer: "identity",
      };
    });
  };

  const removeNote = (() => {
    if (removing === null) {
      return undefined;
    }
    const target = shortHex(removing);
    const effect =
      rejoinWaitMs === null
        ? t(locale, "chainIdentity.wallets.removeNoteNoWait", {
            wallet: target,
          })
        : t(locale, "chainIdentity.wallets.removeNote", {
            wallet: target,
            date: formatDate(locale, Date.now() + rejoinWaitMs, DATE_TIME),
          });
    return sameWallet(removing, wallet)
      ? `${t(locale, "chainIdentity.wallets.removeSelf")} ${effect}`
      : effect;
  })();

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
            {canRemove && (
              <Button
                variant="secondary"
                size="sm"
                disabled={remove.busy || remove.state.kind === "confirm"}
                aria-label={t(locale, "chainIdentity.wallets.removeLabel", {
                  wallet: shortHex(item),
                })}
                onClick={() => startRemove(item)}
              >
                {t(locale, "chainIdentity.wallets.remove")}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <ChainActionStatus
        state={remove.state}
        note={removeNote}
        onConfirm={() => void remove.confirm()}
        onCancel={remove.cancel}
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
          state={join.state}
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
