"use client";

import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { usePublicClient } from "wagmi";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";

type Locale = ReturnType<typeof useBrowserLocale>;

/** The 6529 profile an address belongs to, from 6529's profile data. */
type IdentityFact =
  | { readonly kind: "checking" }
  | { readonly kind: "found"; readonly name: string }
  | { readonly kind: "none" }
  | { readonly kind: "unavailable" };

/** Whether the recipient address has contract code. */
type CodeFact =
  | { readonly kind: "checking" }
  | { readonly kind: "contract" }
  | { readonly kind: "account" }
  | { readonly kind: "unavailable" };

interface Tagged<T> {
  readonly key: string;
  readonly fact: T;
}

async function readIdentity(recipient: string): Promise<IdentityFact> {
  try {
    const identity = await commonApiFetch<ApiIdentity>({
      endpoint: `identities/${recipient}`,
    });
    const name = identity.handle ?? null;
    return name ? { kind: "found", name } : { kind: "none" };
  } catch (error) {
    return getStructuredApiErrorStatus(error) === 404
      ? { kind: "none" }
      : { kind: "unavailable" };
  }
}

function useIdentity(recipient: string): IdentityFact {
  const [tagged, setTagged] = useState<Tagged<IdentityFact> | null>(null);
  useEffect(() => {
    let active = true;
    const run = async () => {
      const fact = await readIdentity(recipient);
      if (active) setTagged({ key: recipient, fact });
    };
    void run();
    return () => {
      active = false;
    };
  }, [recipient]);
  return tagged?.key === recipient ? tagged.fact : { kind: "checking" };
}

function useCode(chainId: number, recipient: string): CodeFact {
  const client = usePublicClient({ chainId });
  const [tagged, setTagged] = useState<Tagged<CodeFact> | null>(null);
  const key = `${chainId}:${recipient}`;
  useEffect(() => {
    if (!client) return undefined;
    let active = true;
    const run = async () => {
      let fact: CodeFact;
      try {
        const code = await client.getCode({ address: getAddress(recipient) });
        fact = { kind: code && code !== "0x" ? "contract" : "account" };
      } catch {
        fact = { kind: "unavailable" };
      }
      if (active) setTagged({ key, fact });
    };
    void run();
    return () => {
      active = false;
    };
  }, [client, recipient, key]);
  if (!client) return { kind: "unavailable" };
  return tagged?.key === key ? tagged.fact : { kind: "checking" };
}

/** `0x` and the checksummed address in groups of four characters. */
function groupAddress(address: string): readonly string[] {
  const body = getAddress(address).slice(2);
  return ["0x", ...(body.match(/.{1,4}/g) ?? [])];
}

function identityText(locale: Locale, fact: IdentityFact): string {
  switch (fact.kind) {
    case "checking":
      return t(locale, "browserConnector.tx.transfer.identityChecking");
    case "found":
      return t(locale, "browserConnector.tx.transfer.identity", {
        name: fact.name,
      });
    case "none":
      return t(locale, "browserConnector.tx.transfer.identityNone");
    case "unavailable":
      return t(locale, "browserConnector.tx.transfer.identityUnavailable");
  }
}

/**
 * The recipient of an NFT transfer, for the browser page: the address in
 * full (checksummed, in groups of four), the 6529 profile it belongs to
 * (labelled as 6529 profile data, not part of the transaction), a warning
 * when it is a contract, and the box the user must tick before Send.
 */
export default function BrowserWalletTransferRecipient({
  locale,
  chainId,
  recipient,
  confirmed,
  onConfirmedChange,
  checkboxId,
}: {
  readonly locale: Locale;
  readonly chainId: number;
  /** Lower-case recipient from the decoded transaction. */
  readonly recipient: string;
  readonly confirmed: boolean;
  readonly onConfirmedChange: (confirmed: boolean) => void;
  readonly checkboxId: string;
}) {
  const identity = useIdentity(recipient);
  const code = useCode(chainId, recipient);
  const groups = groupAddress(recipient);
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/60 tw-bg-amber-950/40 tw-p-3 tw-text-amber-100">
      <p className="tw-m-0 tw-font-semibold">
        {t(locale, "browserConnector.tx.transfer.recipient")}
      </p>
      <p
        className="tw-m-0 tw-flex tw-flex-wrap tw-gap-x-2 tw-font-mono tw-text-lg tw-text-white"
        aria-label={getAddress(recipient)}
      >
        {groups.map((group, index) => (
          // Groups repeat ("0000"); their position identifies them.
          <span key={`${index}:${group}`}>{group}</span>
        ))}
      </p>
      <p className="tw-m-0 tw-break-words tw-text-sm">
        {identityText(locale, identity)}
      </p>
      <p className="tw-m-0 tw-text-sm tw-text-amber-200">
        {t(locale, "browserConnector.tx.transfer.identityNote")}
      </p>
      {code.kind === "contract" && (
        <p
          role="alert"
          className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-red tw-p-3 tw-font-semibold tw-text-white"
        >
          {t(locale, "browserConnector.tx.transfer.contract")}
        </p>
      )}
      {code.kind === "unavailable" && (
        <p className="tw-m-0 tw-text-sm">
          {t(locale, "browserConnector.tx.transfer.codeUnavailable")}
        </p>
      )}
      <label
        htmlFor={checkboxId}
        className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-font-semibold"
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={confirmed}
          onChange={(event) => onConfirmedChange(event.target.checked)}
          className="tw-size-5 tw-shrink-0"
        />
        {t(locale, "browserConnector.tx.transfer.confirm")}
      </label>
    </div>
  );
}
