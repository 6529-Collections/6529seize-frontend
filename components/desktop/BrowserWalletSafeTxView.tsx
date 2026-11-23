"use client";

import { type ReactNode, useId, useState } from "react";
import { getAddress } from "viem";
import { usePublicClient } from "wagmi";
import { getAddressEtherscanLink } from "@/helpers/Helpers";
import type { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type {
  SafeTxCallDescription,
  SafeTxDescription,
} from "@/lib/desktop/wallet-safe-tx/describe";
import {
  readSafeTxPreflight,
  type SafeReader,
  type SafeTxPreflight,
} from "@/lib/desktop/wallet-safe-tx/preflight";
import { useCheckResult, useScopedFlag } from "./requestScopedState";
import { formatDecodedValue } from "./walletTransactionFormat";

type Locale = ReturnType<typeof useBrowserLocale>;
type MessageKey = Parameters<typeof t>[1];

const SEPOLIA = 11_155_111;

type Check =
  | { readonly kind: "checking" }
  | { readonly kind: "unavailable" }
  | SafeTxPreflight;

/**
 * The Safe and registries read from the chain before Sign; `round` reads
 * again. Every failure (including an unreachable node) blocks Sign.
 */
function usePreflight(
  requestKey: string,
  description: SafeTxDescription,
  signer: string,
  round: number
): Check {
  const client = usePublicClient({ chainId: description.chainId });
  // The result belongs to this request and signer (and round).
  const result = useCheckResult(
    `${requestKey}:${signer}`,
    client
      ? async (): Promise<Check> => {
          try {
            return await readSafeTxPreflight(
              client as unknown as SafeReader,
              description,
              signer
            );
          } catch {
            return { kind: "unavailable" };
          }
        }
      : null,
    round
  );
  if (!client) return { kind: "unavailable" };
  return result ?? { kind: "checking" };
}

function checkMessage(
  locale: Locale,
  check: Check,
  acceptsOwnership: boolean
): string {
  switch (check.kind) {
    case "checking":
      return t(locale, "browserConnector.safeTx.check.checking");
    case "unavailable":
      return t(locale, "browserConnector.safeTx.check.unavailable");
    case "notOwner":
      return t(locale, "browserConnector.safeTx.check.notOwner", {
        registry: getAddress(check.registry),
      });
    case "notPendingOwner":
      return t(locale, "browserConnector.safeTx.check.notPendingOwner", {
        registry: getAddress(check.registry),
      });
    case "notSigner":
      return t(locale, "browserConnector.safeTx.check.notSigner");
    case "usedNonce":
      return t(locale, "browserConnector.safeTx.check.usedNonce", {
        nonce: formatDecimalString(locale, check.currentNonce.toString()),
      });
    case "ok":
      // acceptOwnership is checked against the pending owner, not the owner.
      return t(
        locale,
        acceptsOwnership
          ? "browserConnector.safeTx.check.okPendingOwner"
          : "browserConnector.safeTx.check.ok"
      );
  }
}

const LINK_CLASS =
  "tw-block tw-break-all tw-font-mono tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

function Call({
  locale,
  chainId,
  call,
  position,
}: {
  readonly locale: Locale;
  readonly chainId: number;
  readonly call: SafeTxCallDescription;
  readonly position: number;
}) {
  const registry = getAddress(call.registry);
  const tone =
    call.risk === "normal"
      ? "tw-border-iron-700 tw-bg-iron-900"
      : "tw-border-red tw-bg-red/10";
  return (
    <li
      className={`tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-p-3 ${tone}`}
    >
      <p className="tw-m-0 tw-font-semibold">
        {t(locale, "browserConnector.safeTx.callTitle", {
          position: formatDecimalString(locale, String(position)),
          action: t(
            locale,
            `browserConnector.safeTx.call.${call.ruleId}` as MessageKey
          ),
        })}
      </p>
      <p className="tw-m-0 tw-text-sm">
        {t(
          locale,
          `browserConnector.safeTx.registry.${call.registryName}` as MessageKey
        )}
        <a
          href={getAddressEtherscanLink(chainId, registry)}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          {registry}
        </a>
      </p>
      {call.args.length > 0 && (
        <dl className="tw-m-0 tw-flex tw-flex-col tw-gap-2 tw-text-sm">
          {call.args.map((arg) => (
            <div key={arg.name}>
              <dt className="tw-font-mono tw-text-iron-400">{arg.name}</dt>
              <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-iron-100">
                {formatDecodedValue(
                  locale,
                  arg.type,
                  arg.value,
                  arg.components
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

const CHECK_BUTTON_CLASS =
  "tw-min-h-11 tw-self-start tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

/**
 * The browser page's view of a Safe transaction a Safe signer is asked to
 * sign: the Safe, network and nonce, every governance call in order with
 * its registry and decoded arguments, the chain checks (the Safe owns each
 * registry, the wallet is a Safe signer, the nonce is not used), and for a
 * high-impact call a warning with a confirmation box. `children` renders
 * the wallet controls with whether Sign may be offered.
 */
export default function BrowserWalletSafeTxView({
  locale,
  signer,
  requestKey,
  description,
  children,
}: {
  readonly locale: Locale;
  /** The address asked to sign. */
  readonly signer: string;
  /** The request's exact content (its typed data JSON): its identity. */
  readonly requestKey: string;
  readonly description: SafeTxDescription;
  readonly children: (canSign: boolean, describedBy: string) => ReactNode;
}) {
  const [round, setRound] = useState(0);
  const check = usePreflight(requestKey, description, signer, round);
  // The acknowledgement belongs to this request and signer.
  const [understood, setUnderstood] = useScopedFlag(`${requestKey}:${signer}`);
  const understandId = useId();
  const checksId = useId();
  const safe = getAddress(description.safe);
  const acceptsOwnership = description.calls.some(
    (call) => call.ruleId === "governance.acceptOwnership"
  );
  const warned = description.risk !== "normal";
  const canSign = check.kind === "ok" && (!warned || understood);
  const blocked = check.kind !== "ok" && check.kind !== "checking";
  const queued = check.kind === "ok" && description.nonce > check.currentNonce;

  return (
    <>
      <p className="tw-m-0 tw-text-lg tw-font-semibold">
        {t(locale, "browserConnector.safeTx.title")}
      </p>
      <p className="tw-m-0 tw-text-iron-200">
        {t(locale, "browserConnector.safeTx.signatureOnly")}
      </p>
      <dl className="tw-m-0 tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-p-3 tw-text-sm">
        <div>
          <dt className="tw-text-iron-400">
            {t(locale, "browserConnector.safeTx.safe")}
          </dt>
          <dd className="tw-m-0">
            {check.kind === "ok"
              ? t(locale, "browserConnector.safeTx.safeThreshold", {
                  threshold: formatDecimalString(
                    locale,
                    check.threshold.toString()
                  ),
                  owners: formatDecimalString(locale, String(check.owners)),
                })
              : t(locale, "browserConnector.safeTx.safeName")}
            <a
              href={getAddressEtherscanLink(description.chainId, safe)}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {safe}
            </a>
          </dd>
        </div>
        <div>
          <dt className="tw-text-iron-400">
            {t(locale, "browserConnector.tx.network")}
          </dt>
          <dd
            className={`tw-m-0 ${description.chainId === SEPOLIA ? "tw-font-semibold tw-text-amber-200" : ""}`}
          >
            {t(
              locale,
              description.chainId === SEPOLIA
                ? "browserConnector.tx.network.sepolia"
                : "browserConnector.tx.network.mainnet"
            )}
          </dd>
        </div>
        <div>
          <dt className="tw-text-iron-400">
            {t(locale, "browserConnector.safeTx.nonce")}
          </dt>
          <dd className="tw-m-0">
            {formatDecimalString(locale, description.nonce.toString())}
            {queued &&
              ` ${t(locale, "browserConnector.safeTx.queued", {
                current: formatDecimalString(
                  locale,
                  check.currentNonce.toString()
                ),
              })}`}
          </dd>
        </div>
      </dl>
      <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
        {description.calls.map((call, index) => (
          // Calls are listed in the signed order; position identifies them.
          <Call
            key={`${index}:${call.ruleId}`}
            locale={locale}
            chainId={description.chainId}
            call={call}
            position={index + 1}
          />
        ))}
      </ol>
      {warned && (
        <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-red tw-bg-red/10 tw-p-3 tw-text-white">
          <p className="tw-m-0 tw-font-semibold">
            {t(
              locale,
              description.risk === "critical"
                ? "browserConnector.safeTx.critical"
                : "browserConnector.safeTx.high"
            )}
          </p>
          <label
            htmlFor={understandId}
            className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-font-semibold"
          >
            <input
              id={understandId}
              type="checkbox"
              checked={understood}
              onChange={(event) => setUnderstood(event.target.checked)}
              className="tw-size-5 tw-shrink-0"
            />
            {t(locale, "browserConnector.safeTx.understand")}
          </label>
        </div>
      )}
      <div id={checksId} className="tw-flex tw-flex-col tw-gap-2 tw-text-sm">
        {/* Progress and success stay in the polite region (never emptied
            when a check fails); a blocking result goes into the alert
            region, keyed by round so a repeated failure is announced. */}
        <output aria-live="polite" className="tw-block tw-text-iron-200">
          {blocked
            ? t(locale, "browserConnector.safeTx.check.finished")
            : checkMessage(locale, check, acceptsOwnership)}
        </output>
        <div role="alert" className="empty:tw-hidden">
          {blocked && (
            <p key={round} className="tw-m-0 tw-font-semibold tw-text-red">
              {t(locale, "browserConnector.safeTx.check.blocked", {
                reason: checkMessage(locale, check, acceptsOwnership),
              })}
            </p>
          )}
        </div>
        {blocked && (
          <button
            type="button"
            className={CHECK_BUTTON_CLASS}
            onClick={() => setRound((value) => value + 1)}
          >
            {t(locale, "browserConnector.tx.check.again")}
          </button>
        )}
      </div>
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, "browserConnector.wallet.safety")}
      </p>
      <div className="tw-flex tw-flex-wrap tw-gap-3">
        {children(canSign, checksId)}
      </div>
    </>
  );
}
