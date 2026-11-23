"use client";

import { type ReactNode, useEffect, useId, useState } from "react";
import {
  BaseError,
  ExecutionRevertedError,
  formatEther,
  getAddress,
  RawContractError,
} from "viem";
import { usePublicClient } from "wagmi";
import { ALL_USE_CASES } from "@/components/delegation/delegation-constants";
import { getAddressEtherscanLink } from "@/helpers/Helpers";
import type { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { WalletRequest } from "@/lib/desktop/wallet-forwarding";
import type {
  DecodedTuple,
  DecodedValue,
} from "@/lib/desktop/wallet-transactions/decode";
import type {
  TransactionDescription,
  TransactionEffect,
} from "@/lib/desktop/wallet-transactions/describe";
import {
  hasReadablePrice,
  type PriceReader,
  readExpectedMintValue,
} from "@/lib/desktop/wallet-transactions/price";
import type { RuleArg } from "@/lib/desktop/wallet-transactions/types";
import {
  isPublisherCall,
  readPublisherAuthorization,
  type RegistryReader,
} from "@/lib/desktop/wallet-transactions/provenance";
import BrowserWalletProvenanceDetails from "./BrowserWalletProvenanceDetails";
import BrowserWalletTransferRecipient from "./BrowserWalletTransferRecipient";

type Locale = ReturnType<typeof useBrowserLocale>;
type MessageKey = Parameters<typeof t>[1];
type TransactionRequest = Extract<
  WalletRequest,
  { readonly method: "eth_sendTransaction" }
>;

/** Send is not offered with less time left than a wallet prompt needs. */
const MIN_SEND_TIME_MS = 45_000;
const SEPOLIA = 11_155_111;

type CallCheck =
  | { readonly kind: "checking" }
  | { readonly kind: "ok" }
  /** The call reverts: sending would cost a fee and do nothing. */
  | { readonly kind: "reverted"; readonly reason: string; readonly raw: string }
  /** The node could not be asked; the user may send anyway. */
  | { readonly kind: "unavailable"; readonly raw: string };

type PriceCheck =
  | { readonly kind: "checking" }
  | { readonly kind: "none" }
  | { readonly kind: "ok" }
  | { readonly kind: "mismatch" }
  | { readonly kind: "unavailable" };

/** For a provenance publisher call: whether the sender may publish. */
type SenderCheck =
  | { readonly kind: "checking" }
  | { readonly kind: "none" }
  | { readonly kind: "ok" }
  | { readonly kind: "denied" }
  | { readonly kind: "unavailable" };

function shortMessage(error: unknown): string {
  if (error instanceof BaseError) return error.shortMessage;
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRevert(error: unknown): boolean {
  return (
    error instanceof BaseError &&
    error.walk(
      (cause) =>
        cause instanceof ExecutionRevertedError ||
        cause instanceof RawContractError
    ) !== null
  );
}

/** A check's result, tagged with the inputs it was made for. */
interface Tagged<T> {
  readonly key: string;
  readonly result: T;
}

/** Runs one call check (never throws). */
async function runCallCheck(
  client: NonNullable<ReturnType<typeof usePublicClient>>,
  transaction: TransactionRequest["transaction"]
): Promise<CallCheck> {
  try {
    await client.call({
      account: getAddress(transaction.from),
      to: getAddress(transaction.to),
      data: transaction.data,
      value: BigInt(transaction.value),
    });
    return { kind: "ok" };
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    return isRevert(error)
      ? { kind: "reverted", reason: shortMessage(error), raw }
      : { kind: "unavailable", raw };
  }
}

/**
 * The transaction run as a call at the latest block with the page's own
 * read client (not the wallet), before Send is offered. `round` runs it
 * again.
 */
function useCallCheck(request: TransactionRequest, round: number): CallCheck {
  const client = usePublicClient({ chainId: request.chainId });
  const [tagged, setTagged] = useState<Tagged<CallCheck> | null>(null);
  const { transaction } = request;
  const key = `${round}:${transaction.to}:${transaction.data}:${transaction.value}`;
  useEffect(() => {
    if (!client) return undefined;
    let active = true;
    const run = async () => {
      const result = await runCallCheck(client, transaction);
      if (active) setTagged({ key, result });
    };
    void run();
    return () => {
      active = false;
    };
  }, [client, transaction, key]);
  if (!client) return { kind: "unavailable", raw: "" };
  return tagged?.key === key ? tagged.result : { kind: "checking" };
}

/** Runs one price check (never throws). */
async function runPriceCheck(
  client: NonNullable<ReturnType<typeof usePublicClient>>,
  description: TransactionDescription
): Promise<PriceCheck> {
  try {
    const expected = await readExpectedMintValue(
      client as unknown as PriceReader,
      description
    );
    if (expected === null) return { kind: "none" };
    return { kind: expected === description.value ? "ok" : "mismatch" };
  } catch {
    return { kind: "unavailable" };
  }
}

/** For a mint, whether the value equals the current price on chain. */
function usePriceCheck(
  request: TransactionRequest,
  description: TransactionDescription,
  round: number
): PriceCheck {
  const client = usePublicClient({ chainId: request.chainId });
  const readable = hasReadablePrice(description);
  const [tagged, setTagged] = useState<Tagged<PriceCheck> | null>(null);
  const key = String(round);
  useEffect(() => {
    if (!client || !readable) return undefined;
    let active = true;
    const run = async () => {
      const result = await runPriceCheck(client, description);
      if (active) setTagged({ key, result });
    };
    void run();
    return () => {
      active = false;
    };
  }, [client, readable, description, key]);
  if (!readable) return { kind: "none" };
  if (!client) return { kind: "unavailable" };
  return tagged?.key === key ? tagged.result : { kind: "checking" };
}

/** Runs one sender check (never throws). */
async function runSenderCheck(
  client: NonNullable<ReturnType<typeof usePublicClient>>,
  request: TransactionRequest
): Promise<SenderCheck> {
  try {
    const allowed = await readPublisherAuthorization(
      client as unknown as RegistryReader,
      getAddress(request.transaction.to),
      getAddress(request.transaction.from)
    );
    return { kind: allowed ? "ok" : "denied" };
  } catch {
    return { kind: "unavailable" };
  }
}

/**
 * For a provenance publisher call, whether the sender is an authorized
 * publisher key or the registry's owner now (read from the chain).
 */
function useSenderCheck(
  request: TransactionRequest,
  description: TransactionDescription,
  round: number
): SenderCheck {
  const client = usePublicClient({ chainId: request.chainId });
  const needed = isPublisherCall(description);
  const [tagged, setTagged] = useState<Tagged<SenderCheck> | null>(null);
  const key = String(round);
  useEffect(() => {
    if (!client || !needed) return undefined;
    let active = true;
    const run = async () => {
      const result = await runSenderCheck(client, request);
      if (active) setTagged({ key, result });
    };
    void run();
    return () => {
      active = false;
    };
  }, [client, needed, request, key]);
  if (!needed) return { kind: "none" };
  if (!client) return { kind: "unavailable" };
  return tagged?.key === key ? tagged.result : { kind: "checking" };
}

function senderCheckMessage(locale: Locale, check: SenderCheck): string | null {
  switch (check.kind) {
    case "checking":
      return t(locale, "browserConnector.tx.sender.checking");
    case "ok":
      return t(locale, "browserConnector.tx.sender.ok");
    case "denied":
      return t(locale, "browserConnector.tx.sender.denied");
    case "unavailable":
      return t(locale, "browserConnector.tx.sender.unavailable");
    case "none":
      return null;
  }
}

/** True once less than `MIN_SEND_TIME_MS` is left. */
function useTooLate(expiresAt: number): boolean {
  const cutoff = expiresAt - MIN_SEND_TIME_MS;
  const [lateAtStart] = useState(() => Date.now() >= cutoff);
  const [timerFired, setTimerFired] = useState(false);
  useEffect(() => {
    const remaining = cutoff - Date.now();
    if (remaining <= 0) return undefined;
    const timer = setTimeout(() => setTimerFired(true), remaining);
    return () => clearTimeout(timer);
  }, [cutoff]);
  return lateAtStart || timerFired;
}

const formatAddress = (value: string) => getAddress(value);

function formatValue(
  locale: Locale,
  type: string,
  value: DecodedValue,
  components?: readonly RuleArg[]
): string {
  if (type === "bytes32[]" && Array.isArray(value)) {
    return t(locale, "browserConnector.tx.proof", {
      count: formatDecimalString(locale, String(value.length)),
    });
  }
  if (type === "bytes32[][]" && Array.isArray(value)) {
    return t(locale, "browserConnector.tx.proofs", {
      count: formatDecimalString(locale, String(value.length)),
    });
  }
  if (Array.isArray(value)) {
    const elementType = type.slice(0, -2);
    const separator = components === undefined ? ", " : "; ";
    return (value as readonly DecodedValue[])
      .map((element) => formatValue(locale, elementType, element, components))
      .join(separator);
  }
  if (components !== undefined) {
    // A tuple: each field by name, with its own type.
    const tuple = value as DecodedTuple;
    const fields = components.map((component) =>
      t(locale, "browserConnector.tx.field", {
        name: component.name,
        value: formatValue(
          locale,
          component.type,
          tuple[component.name] ?? "",
          component.components
        ),
      })
    );
    return `(${fields.join(", ")})`;
  }
  if (typeof value === "boolean") {
    return t(
      locale,
      value ? "browserConnector.tx.yes" : "browserConnector.tx.no"
    );
  }
  if (typeof value === "bigint") {
    return formatDecimalString(locale, value.toString());
  }
  const text = value as string;
  if (type === "address") return formatAddress(text);
  if (type === "string") {
    return t(locale, "browserConnector.tx.quoted", { text });
  }
  return text;
}

/** A delegation use case by number and its name in the delegation center. */
const labelForUseCase = (locale: Locale, id: string): string => {
  const known = ALL_USE_CASES.find((item) => String(item.use_case) === id);
  return known
    ? t(locale, "browserConnector.tx.useCase", { id, name: known.display })
    : id;
};

function effectText(locale: Locale, effect: TransactionEffect): string {
  switch (effect.kind) {
    case "delegate":
      return t(locale, "browserConnector.tx.effect.delegate", {
        delegate: formatAddress(effect.delegate),
        useCase: labelForUseCase(locale, effect.useCase),
      });
    case "onBehalfOf":
      return t(locale, "browserConnector.tx.effect.onBehalfOf", {
        delegator: formatAddress(effect.delegator),
      });
    case "recipient":
      return t(locale, "browserConnector.tx.effect.recipient", {
        recipient: formatAddress(effect.recipient),
      });
    case "mintAsDelegate":
      return t(locale, "browserConnector.tx.effect.mintAsDelegate", {
        delegator: formatAddress(effect.delegator),
      });
    case "largeValue":
      return t(locale, "browserConnector.tx.effect.largeValue");
  }
}

function callCheckMessage(locale: Locale, check: CallCheck): string {
  switch (check.kind) {
    case "checking":
      return t(locale, "browserConnector.tx.check.checking");
    case "ok":
      return t(locale, "browserConnector.tx.check.ok");
    case "reverted":
      return t(locale, "browserConnector.tx.check.reverted", {
        reason: check.reason,
      });
    case "unavailable":
      return t(locale, "browserConnector.tx.check.unavailable");
  }
}

function priceCheckMessage(locale: Locale, check: PriceCheck): string | null {
  switch (check.kind) {
    case "checking":
      return t(locale, "browserConnector.tx.price.checking");
    case "ok":
      return t(locale, "browserConnector.tx.price.ok");
    case "mismatch":
      return t(locale, "browserConnector.tx.price.mismatch");
    case "unavailable":
      return t(locale, "browserConnector.tx.price.unavailable");
    case "none":
      return null;
  }
}

/** Whether Send may be offered, given every check and confirmation. */
function canSendTransaction(state: {
  readonly call: CallCheck["kind"];
  readonly sendAnyway: boolean;
  readonly price: PriceCheck["kind"];
  readonly sender: SenderCheck["kind"];
  readonly highImpact: boolean;
  readonly understood: boolean;
  readonly tooLate: boolean;
}): boolean {
  if (state.tooLate) return false;
  if (state.call === "checking" || state.call === "reverted") return false;
  if (state.price === "checking" || state.price === "mismatch") return false;
  if (state.sender === "checking" || state.sender === "denied") return false;
  // A check that could not run needs the user's explicit "Send anyway".
  if (
    (state.call === "unavailable" ||
      state.price === "unavailable" ||
      state.sender === "unavailable") &&
    !state.sendAnyway
  ) {
    return false;
  }
  if (state.highImpact && !state.understood) return false;
  return true;
}

const CHECK_BUTTON_CLASS =
  "tw-min-h-11 tw-self-start tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

/**
 * The browser page's view of a transaction 6529 Desktop asks the wallet to
 * send: what it does, the contract, every decoded argument, the value, the
 * call check and (for a mint) the price check, and for a high-impact
 * transaction what it changes with an "I understand" box. `children`
 * renders the wallet controls with whether Send may be offered.
 */
export default function BrowserWalletTransactionView({
  locale,
  request,
  description,
  expiresAt,
  children,
}: {
  readonly locale: Locale;
  readonly request: TransactionRequest;
  readonly description: TransactionDescription;
  readonly expiresAt: number;
  /** The wallet controls; `describedBy` names the checks that gate Send. */
  readonly children: (canSend: boolean, describedBy: string) => ReactNode;
}) {
  const [round, setRound] = useState(0);
  const call = useCallCheck(request, round);
  const price = usePriceCheck(request, description, round);
  const sender = useSenderCheck(request, description, round);
  const tooLate = useTooLate(expiresAt);
  const [understood, setUnderstood] = useState(false);
  const [sendAnyway, setSendAnyway] = useState(false);
  const understandId = useId();
  const checksId = useId();
  const transfer = description.risk === "transfer";
  const testNetwork = description.chainId === SEPOLIA;
  const canSend = canSendTransaction({
    call: call.kind,
    sendAnyway,
    price: price.kind,
    sender: sender.kind,
    // A transfer's recipient box counts as its confirmation.
    highImpact: description.risk !== "normal",
    understood,
    tooLate,
  });
  const priceMessage = priceCheckMessage(locale, price);
  const senderMessage = senderCheckMessage(locale, sender);
  const unavailable =
    call.kind === "unavailable" ||
    price.kind === "unavailable" ||
    sender.kind === "unavailable";
  const contractAddress = formatAddress(description.to);

  return (
    <>
      <p className="tw-m-0 tw-text-lg tw-font-semibold">
        {t(
          locale,
          `browserConnector.tx.title.${description.ruleId}` as MessageKey
        )}
      </p>
      <p className="tw-m-0 tw-break-all">
        {t(locale, "browserConnector.tx.intro", { address: request.address })}
      </p>
      <dl className="tw-m-0 tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-p-3 tw-text-sm">
        <div>
          <dt className="tw-text-iron-400">
            {t(locale, "browserConnector.tx.contract")}
          </dt>
          <dd className="tw-m-0">
            {t(locale, `browserConnector.tx.contract.${description.contract}`)}
            <a
              href={getAddressEtherscanLink(
                description.chainId,
                contractAddress
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-block tw-break-all tw-font-mono tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {contractAddress}
            </a>
          </dd>
        </div>
        <div>
          <dt className="tw-text-iron-400">
            {t(locale, "browserConnector.tx.network")}
          </dt>
          <dd
            className={`tw-m-0 ${testNetwork ? "tw-font-semibold tw-text-amber-200" : ""}`}
          >
            {t(
              locale,
              testNetwork
                ? "browserConnector.tx.network.sepolia"
                : "browserConnector.tx.network.mainnet"
            )}
          </dd>
        </div>
        {description.count !== null && (
          <div>
            <dt className="tw-text-iron-400">
              {t(locale, "browserConnector.tx.count")}
            </dt>
            <dd className="tw-m-0">
              {formatDecimalString(locale, description.count.toString())}
            </dd>
          </div>
        )}
        <div>
          <dt className="tw-text-iron-400">
            {t(locale, "browserConnector.tx.value")}
          </dt>
          <dd className="tw-m-0">
            {t(locale, "browserConnector.tx.valueAmount", {
              amount: formatDecimalString(
                locale,
                formatEther(description.value)
              ),
            })}
          </dd>
        </div>
      </dl>
      {transfer && description.recipient !== null && (
        <BrowserWalletTransferRecipient
          locale={locale}
          chainId={description.chainId}
          recipient={description.recipient}
          confirmed={understood}
          onConfirmedChange={setUnderstood}
          checkboxId={understandId}
        />
      )}
      {description.contract === "provenance" && (
        <BrowserWalletProvenanceDetails
          locale={locale}
          description={description}
        />
      )}
      {description.risk === "high" && (
        <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/60 tw-bg-amber-950/40 tw-p-3 tw-text-amber-100">
          <p className="tw-m-0 tw-font-semibold">
            {t(locale, "browserConnector.tx.highImpact")}
          </p>
          {description.effects.length > 0 && (
            <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-1 tw-pl-5">
              {description.effects.map((effect) => (
                <li key={JSON.stringify(effect)} className="tw-break-all">
                  {effectText(locale, effect)}
                </li>
              ))}
            </ul>
          )}
          <label
            htmlFor={understandId}
            className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-font-semibold"
          >
            <input
              id={understandId}
              type="checkbox"
              checked={understood}
              onChange={(event) => setUnderstood(event.target.checked)}
              className="tw-size-5"
            />
            {t(locale, "browserConnector.tx.understand")}
          </label>
        </div>
      )}
      <details className="tw-rounded-lg tw-bg-iron-900 tw-p-3">
        <summary className="tw-cursor-pointer tw-font-semibold focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "browserConnector.tx.details", {
            function:
              description.functionName ??
              t(locale, "browserConnector.tx.plainTransfer"),
          })}
        </summary>
        <dl className="tw-m-0 tw-mt-3 tw-flex tw-flex-col tw-gap-2 tw-text-sm">
          {description.args.map((arg) => (
            <div key={arg.name}>
              <dt className="tw-font-mono tw-text-iron-400">{arg.name}</dt>
              <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-iron-100">
                {formatValue(locale, arg.type, arg.value, arg.components)}
              </dd>
            </div>
          ))}
          <div>
            <dt className="tw-font-mono tw-text-iron-400">
              {t(locale, "browserConnector.tx.data")}
            </dt>
            <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-iron-100">
              {request.transaction.data}
            </dd>
          </div>
        </dl>
      </details>
      <div id={checksId} className="tw-flex tw-flex-col tw-gap-2 tw-text-sm">
        <output
          aria-live="polite"
          className="tw-flex tw-flex-col tw-gap-2 tw-text-iron-200 empty:tw-hidden"
        >
          {call.kind !== "reverted" && (
            <span className="tw-block">{callCheckMessage(locale, call)}</span>
          )}
          {priceMessage !== null && price.kind !== "mismatch" && (
            <span className="tw-block">{priceMessage}</span>
          )}
          {senderMessage !== null && sender.kind !== "denied" && (
            <span className="tw-block">{senderMessage}</span>
          )}
        </output>
        <div
          role="alert"
          className="tw-flex tw-flex-col tw-gap-2 empty:tw-hidden"
        >
          {call.kind === "reverted" && (
            <p className="tw-m-0 tw-text-red">
              {callCheckMessage(locale, call)}
            </p>
          )}
          {price.kind === "mismatch" && priceMessage !== null && (
            <p className="tw-m-0 tw-text-red">{priceMessage}</p>
          )}
          {sender.kind === "denied" && senderMessage !== null && (
            <p className="tw-m-0 tw-text-red">{senderMessage}</p>
          )}
          {tooLate && (
            <p className="tw-m-0 tw-text-amber-200">
              {t(locale, "browserConnector.tx.tooLate")}
            </p>
          )}
        </div>
        {(call.kind === "reverted" || call.kind === "unavailable") &&
          call.raw !== "" && (
            <details>
              <summary className="tw-cursor-pointer focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                {t(locale, "browserConnector.tx.check.details")}
              </summary>
              <p className="tw-m-0 tw-mt-2 tw-break-all tw-font-mono tw-text-iron-300">
                {call.raw}
              </p>
            </details>
          )}
        {(call.kind === "reverted" ||
          price.kind === "mismatch" ||
          sender.kind === "denied" ||
          unavailable) && (
          <button
            type="button"
            className={CHECK_BUTTON_CLASS}
            onClick={() => {
              setSendAnyway(false);
              setRound((value) => value + 1);
            }}
          >
            {t(locale, "browserConnector.tx.check.again")}
          </button>
        )}
        {unavailable && !sendAnyway && (
          <button
            type="button"
            className={CHECK_BUTTON_CLASS}
            onClick={() => setSendAnyway(true)}
          >
            {t(locale, "browserConnector.tx.check.sendAnyway")}
          </button>
        )}
      </div>
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, "browserConnector.tx.safety")}
      </p>
      <div className="tw-flex tw-flex-wrap tw-gap-3">
        {children(canSend, checksId)}
      </div>
    </>
  );
}
