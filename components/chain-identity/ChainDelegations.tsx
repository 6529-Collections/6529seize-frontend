"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { isAddress, type Hex } from "viem";
import { useAccount, useConfig } from "wagmi";
import {
  DELEGATION_USE_CASES,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
  SUPPORTED_COLLECTIONS,
} from "@/components/delegation/delegation-constants";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { NEVER_DATE } from "@/constants/constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import {
  chainGateway,
  type ChainDelegationRecord,
} from "@/lib/chain-identity/gateway";
import {
  DELEGATION_SCOPE,
  delegationRevoke,
  delegationSet,
} from "@/lib/chain-identity/identityOps";
import { draftOperation } from "@/lib/chain-identity/operation";
import { walletSigner } from "@/lib/chain-identity/signers";
import ChainActionStatus from "./ChainActionStatus";
import {
  CHAIN_HINT_CLASS,
  CHAIN_INPUT_CLASS,
  CHAIN_LABEL_CLASS,
  ChainSection,
  shortHex,
} from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";

/** The use cases the Delegation Center offers today, the chain's too. */
const USE_CASES = [
  ...DELEGATION_USE_CASES,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
];
const DIGITS = /^\d{1,78}$/;

type Scope = "identity" | "wallet";

const nameOfUseCase = (number: number): string | null =>
  USE_CASES.find((item) => item.use_case === number)?.display ?? null;

const collectionName = (address: string): string | null =>
  SUPPORTED_COLLECTIONS.find(
    (item) => item.contract.toLowerCase() === address.toLowerCase()
  )?.title ?? null;

/** Seconds from a yyyy-mm-dd date at 00:00 UTC, or null. */
const expiryFromDate = (date: string): bigint | null => {
  const ms = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(ms) && ms > Date.now() ? BigInt(ms / 1000) : null;
};

/**
 * The Delegation Center on the 6529 Network: DELEGATION_SET and
 * DELEGATION_REVOKE with NFTDelegation's collections and use cases, for the
 * connected wallet alone or for its whole identity.
 */
export default function ChainDelegations() {
  const locale = useBrowserLocale();
  const config = useConfig();
  const { address } = useAccount();
  const wallet = address;
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: [QueryKey.CHAIN_DELEGATIONS] });

  const identity = useQuery({
    queryKey: [QueryKey.CHAIN_DELEGATIONS, "identity", wallet?.toLowerCase()],
    queryFn: ({ signal }) =>
      chainGateway.getIdentityByWallet(wallet as Hex, signal),
    enabled: !!wallet,
  });
  const records = useQuery({
    queryKey: [QueryKey.CHAIN_DELEGATIONS, "of-wallet", wallet?.toLowerCase()],
    queryFn: ({ signal }) =>
      chainGateway.getDelegationsOfWallet(wallet as Hex, signal),
    enabled: !!wallet,
  });

  const [scope, setScope] = useState<Scope>("identity");
  const [collection, setCollection] = useState(
    SUPPORTED_COLLECTIONS[0]?.contract ?? ""
  );
  const [useCase, setUseCase] = useState(USE_CASES[0]?.use_case ?? 1);
  const [delegate, setDelegate] = useState("");
  const [never, setNever] = useState(true);
  const [date, setDate] = useState("");
  const [allTokens, setAllTokens] = useState(true);
  const [tokenId, setTokenId] = useState("");
  const setAction = useChainAction(() => {
    setDelegate("");
    void refresh();
  });
  const revokeAction = useChainAction(() => void refresh());

  const principalId = identity.data?.principalId ?? null;
  const useIdentity = scope === "identity" && principalId !== null;
  const expiry = never ? BigInt(NEVER_DATE) : expiryFromDate(date);
  const formOk =
    isAddress(delegate.trim()) &&
    expiry !== null &&
    (allTokens || DIGITS.test(tokenId.trim()));

  if (!wallet) {
    return (
      <ChainSection
        id="chain-delegations"
        heading={t(locale, "chainIdentity.chainDelegations.heading")}
        body={t(locale, "chainIdentity.chainDelegations.connect")}
      />
    );
  }

  const register = () => {
    if (expiry === null || !formOk) {
      return;
    }
    void setAction.prepare(async () => {
      const operation = delegationSet(
        useIdentity ? principalId : null,
        wallet,
        {
          collection: collection as Hex,
          delegate: delegate.trim() as Hex,
          useCase,
          tokenId: allTokens ? null : BigInt(tokenId.trim()),
        },
        expiry
      );
      return {
        draft: await draftOperation(operation.request, operation.primaryType),
        signer: walletSigner(config, wallet),
        payer: useIdentity ? "identity" : "wallet",
      };
    });
  };

  const revoke = (record: ChainDelegationRecord) => {
    const identityRecord = record.scope === "identity";
    // An identity's record is revoked for the identity; this wallet's own
    // record by the wallet itself, from its own account.
    const signerPrincipal = identityRecord ? principalId : null;
    void revokeAction.prepare(async () => {
      const operation = delegationRevoke(signerPrincipal, wallet, {
        scope: identityRecord
          ? DELEGATION_SCOPE.IDENTITY
          : DELEGATION_SCOPE.WALLET,
        holder: record.holder,
        collection: record.collection,
        delegate: record.delegate,
        useCase: record.useCase,
        tokenId: record.allTokens === 1 ? null : BigInt(record.tokenId),
      });
      return {
        draft: await draftOperation(operation.request, operation.primaryType),
        signer: walletSigner(config, wallet),
        payer: signerPrincipal ? "identity" : "wallet",
      };
    });
  };

  const rows = (records.data ?? []).flatMap((group) => group.records);

  return (
    <ChainSection
      id="chain-delegations"
      heading={t(locale, "chainIdentity.chainDelegations.heading")}
      body={t(locale, "chainIdentity.chainDelegations.body")}
    >
      {rows.length === 0 ? (
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {records.isPending
            ? t(locale, "chainIdentity.loading")
            : t(locale, "chainIdentity.chainDelegations.none")}
        </p>
      ) : (
        <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
          {rows.map((record) => {
            const useCaseLabel =
              nameOfUseCase(record.useCase) ??
              t(locale, "chainIdentity.chainDelegations.unknownUseCase", {
                number: record.useCase,
              });
            return (
              <li
                key={`${record.scope}-${record.holder}-${record.collection}-${record.delegate}-${record.useCase}-${record.tokenId}`}
                className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-px-3 tw-py-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between"
              >
                <div className="tw-min-w-0 tw-text-sm tw-text-iron-200">
                  <span className="tw-font-semibold">{useCaseLabel}</span>
                  <span className="tw-text-iron-400">
                    {" · "}
                    {collectionName(record.collection) ??
                      t(locale, "chainIdentity.chainDelegations.unknownCollection", {
                        address: shortHex(record.collection),
                      })}
                    {" · "}
                    {t(locale, "chainIdentity.chainDelegations.to", {
                      delegate: shortHex(record.delegate),
                    })}
                    {" · "}
                    {t(
                      locale,
                      record.scope === "identity"
                        ? "chainIdentity.chainDelegations.identityRecord"
                        : "chainIdentity.chainDelegations.walletRecord"
                    )}
                    {record.expired &&
                      ` · ${t(locale, "chainIdentity.chainDelegations.expired")}`}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={
                    revokeAction.busy || revokeAction.state.kind === "confirm"
                  }
                  aria-label={t(
                    locale,
                    "chainIdentity.chainDelegations.revokeLabel",
                    { useCase: useCaseLabel, delegate: shortHex(record.delegate) }
                  )}
                  onClick={() => revoke(record)}
                >
                  {t(locale, "chainIdentity.chainDelegations.revoke")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <ChainActionStatus
        state={revokeAction.state}
        onConfirm={() => void revokeAction.confirm()}
        onCancel={revokeAction.cancel}
      />

      <div className="tw-mt-5 tw-grid tw-gap-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-4 sm:tw-grid-cols-2">
        {principalId !== null && (
          <fieldset className="tw-m-0 tw-border-0 tw-p-0 sm:tw-col-span-2">
            <legend className={CHAIN_LABEL_CLASS}>
              {t(locale, "chainIdentity.chainDelegations.scope")}
            </legend>
            <div className="tw-flex tw-flex-wrap tw-gap-4 tw-text-sm tw-text-iron-200">
              {(["identity", "wallet"] as const).map((value) => (
                <label key={value} className="tw-flex tw-items-center tw-gap-2">
                  <input
                    type="radio"
                    name="chain-delegation-scope"
                    checked={scope === value}
                    onChange={() => setScope(value)}
                  />
                  {t(
                    locale,
                    value === "identity"
                      ? "chainIdentity.chainDelegations.identityScope"
                      : "chainIdentity.chainDelegations.walletScope"
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div>
          <label htmlFor="chain-delegation-collection" className={CHAIN_LABEL_CLASS}>
            {t(locale, "chainIdentity.chainDelegations.collection")}
          </label>
          <select
            id="chain-delegation-collection"
            className={CHAIN_INPUT_CLASS}
            value={collection}
            onChange={(event) => setCollection(event.target.value)}
          >
            {SUPPORTED_COLLECTIONS.map((item) => (
              <option key={item.contract} value={item.contract}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="chain-delegation-use-case" className={CHAIN_LABEL_CLASS}>
            {t(locale, "chainIdentity.chainDelegations.useCase")}
          </label>
          <select
            id="chain-delegation-use-case"
            className={CHAIN_INPUT_CLASS}
            value={useCase}
            onChange={(event) => setUseCase(Number(event.target.value))}
          >
            {USE_CASES.map((item) => (
              <option key={item.use_case} value={item.use_case}>
                {item.display}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:tw-col-span-2">
          <label htmlFor="chain-delegation-delegate" className={CHAIN_LABEL_CLASS}>
            {t(locale, "chainIdentity.chainDelegations.delegate")}
          </label>
          <input
            id="chain-delegation-delegate"
            className={`${CHAIN_INPUT_CLASS} tw-font-mono`}
            value={delegate}
            placeholder={t(locale, "chainIdentity.addressPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setDelegate(event.target.value)}
          />
        </div>
        <fieldset className="tw-m-0 tw-border-0 tw-p-0">
          <legend className={CHAIN_LABEL_CLASS}>
            {t(locale, "chainIdentity.chainDelegations.expiry")}
          </legend>
          <div className="tw-flex tw-flex-wrap tw-gap-4 tw-text-sm tw-text-iron-200">
            <label className="tw-flex tw-items-center tw-gap-2">
              <input
                type="radio"
                name="chain-delegation-expiry"
                checked={never}
                onChange={() => setNever(true)}
              />
              {t(locale, "chainIdentity.chainDelegations.never")}
            </label>
            <label className="tw-flex tw-items-center tw-gap-2">
              <input
                type="radio"
                name="chain-delegation-expiry"
                checked={!never}
                onChange={() => setNever(false)}
              />
              {t(locale, "chainIdentity.chainDelegations.onDate")}
            </label>
          </div>
          {!never && (
            <input
              type="date"
              aria-label={t(locale, "chainIdentity.chainDelegations.date")}
              className={`${CHAIN_INPUT_CLASS} tw-mt-2`}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </fieldset>
        <fieldset className="tw-m-0 tw-border-0 tw-p-0">
          <legend className={CHAIN_LABEL_CLASS}>
            {t(locale, "chainIdentity.chainDelegations.tokens")}
          </legend>
          <div className="tw-flex tw-flex-wrap tw-gap-4 tw-text-sm tw-text-iron-200">
            <label className="tw-flex tw-items-center tw-gap-2">
              <input
                type="radio"
                name="chain-delegation-tokens"
                checked={allTokens}
                onChange={() => setAllTokens(true)}
              />
              {t(locale, "chainIdentity.chainDelegations.allTokens")}
            </label>
            <label className="tw-flex tw-items-center tw-gap-2">
              <input
                type="radio"
                name="chain-delegation-tokens"
                checked={!allTokens}
                onChange={() => setAllTokens(false)}
              />
              {t(locale, "chainIdentity.chainDelegations.oneToken")}
            </label>
          </div>
          {!allTokens && (
            <input
              inputMode="numeric"
              aria-label={t(locale, "chainIdentity.chainDelegations.tokenId")}
              className={`${CHAIN_INPUT_CLASS} tw-mt-2`}
              value={tokenId}
              onChange={(event) => setTokenId(event.target.value)}
            />
          )}
        </fieldset>
      </div>
      <div className="tw-mt-4">
        <Button
          variant="primary"
          size="md"
          disabled={!formOk || setAction.busy || setAction.state.kind === "confirm"}
          onClick={register}
        >
          {t(locale, "chainIdentity.chainDelegations.set")}
        </Button>
        {delegate !== "" && !formOk && (
          <p className={CHAIN_HINT_CLASS}>
            {t(locale, "chainIdentity.chainDelegations.invalid")}
          </p>
        )}
      </div>
      <ChainActionStatus
        state={setAction.state}
        onConfirm={() => void setAction.confirm()}
        onCancel={setAction.cancel}
      />
    </ChainSection>
  );
}
