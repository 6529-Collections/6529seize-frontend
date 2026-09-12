"use client";

import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { CollectTradeAction, CollectTradeDraft } from "./collect.types";
import {
  assertCollectOfferAmount,
  assertCollectOfferQuantity,
} from "./collect-offer-policy";
import { validateCommittedMarketOffer } from "./market-validation";

interface OfferIntentOptions {
  readonly action: CollectTradeAction;
  readonly assetKey: string;
  readonly draft: CollectTradeDraft;
  readonly profileId: string | undefined;
  readonly wallet: string | undefined;
  readonly authenticated: boolean;
  readonly proxy: boolean;
  readonly maximumOfferAmountWei: string | undefined;
  readonly fixedOfferQuantity?: string | undefined;
  readonly initialOperation: ApiMarketOperation | undefined;
  readonly operation: ApiMarketOperation | null;
  readonly expected: ApiMarketPrepareRequest | null;
  readonly onPublished: ((operation: ApiMarketOperation) => void) | undefined;
  readonly onCommitment?:
    | ((
        operation: ApiMarketOperation,
        expected: ApiMarketPrepareRequest
      ) => void)
    | undefined;
}

/** Keep one offer's asynchronous work bound to its committed actor and draft. */
export function useCollectOfferIntent(options: OfferIntentOptions) {
  const identity = JSON.stringify({
    action: options.action,
    asset: options.assetKey,
    profile: options.profileId,
    wallet: options.wallet?.toLowerCase(),
    authenticated: options.authenticated,
    proxy: options.proxy,
    draft: options.draft,
    maximum: options.maximumOfferAmountWei,
    quantity: options.fixedOfferQuantity,
    commitmentRequired: options.onCommitment !== undefined,
  });
  const generation = useMemo(() => ({ identity }), [identity]);
  const current = useRef<{
    generation: object;
    options: OfferIntentOptions;
  } | null>(null);
  const binding = useRef(
    options.initialOperation && options.expected
      ? {
          generation,
          id: options.initialOperation.id,
          request: JSON.stringify(options.expected),
        }
      : null
  );
  const observed = useRef(new Set<string>());
  const reserved = useRef(new Set<string>());
  const newest = useRef<ApiMarketOperation | null>(null);

  useLayoutEffect(() => {
    current.current = { generation, options };
    return () => {
      current.current = null;
    };
  }, [generation, options]);

  const guard = (request?: ApiMarketPrepareRequest) => {
    if (options.action !== "offer") return;
    const live = current.current;
    if (
      live?.generation !== generation ||
      !live.options.authenticated ||
      live.options.proxy
    )
      throw new Error("MARKET_CONNECTION_CHANGED");
    if (!request) return;
    if (
      request.kind !== ApiMarketKind.Offer ||
      request.asset_key !== live.options.assetKey ||
      request.profile_id !== live.options.profileId ||
      request.wallet.toLowerCase() !== live.options.wallet?.toLowerCase()
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
    assertCollectOfferAmount(request, live.options.maximumOfferAmountWei);
    assertCollectOfferQuantity(request, live.options.fixedOfferQuantity);
  };

  const bind = (
    operation: ApiMarketOperation,
    request: ApiMarketPrepareRequest
  ) => {
    if (options.action !== "offer") return;
    guard(request);
    binding.current = {
      generation,
      id: operation.id,
      request: JSON.stringify(request),
    };
    newest.current = null;
  };

  const guardReview = (
    operation: ApiMarketOperation,
    request: ApiMarketPrepareRequest
  ) => {
    guard(request);
    if (options.action !== "offer") return;
    const bound = binding.current;
    if (
      bound?.generation !== generation ||
      bound.id !== operation.id ||
      bound.request !== JSON.stringify(request)
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
  };

  const notifyCommitment = (
    operation: ApiMarketOperation,
    request: ApiMarketPrepareRequest
  ) => {
    const onCommitment = current.current?.options.onCommitment;
    if (!onCommitment || reserved.current.has(operation.id)) return;
    reserved.current.add(operation.id);
    try {
      onCommitment(operation, request);
    } catch (failure) {
      reserved.current.delete(operation.id);
      throw failure;
    }
  };

  // Called synchronously after a signature returns, before it can reach the
  // market. A failed reservation must prevent the publication request.
  const reserve = (
    operation: ApiMarketOperation,
    request: ApiMarketPrepareRequest
  ) => {
    guardReview(operation, request);
    validateCommittedMarketOffer(operation, request);
    notifyCommitment(operation, request);
  };

  useEffect(() => {
    const { operation, expected, onPublished } = options;
    if (options.action !== "offer" || !operation || !expected) return;
    try {
      guardReview(operation, expected);
      const prior = newest.current;
      if (
        prior &&
        (operation.updated_at < prior.updated_at ||
          (operation.updated_at === prior.updated_at &&
            operation.revision !== prior.revision))
      )
        return;
      newest.current = operation;
      // A persisted awaiting-signature row does not establish that a signature
      // was sent. Only the explicit pre-publication event can reserve that row.
      if (
        !["PUBLISHING", "UNKNOWN", "LIVE", "CONFIRMED"].includes(
          operation.state
        )
      )
        return;
      validateCommittedMarketOffer(operation, expected);
    } catch {
      return;
    }
    notifyCommitment(operation, expected);
    if (!["LIVE", "CONFIRMED"].includes(operation.state)) return;
    if (!onPublished || observed.current.has(operation.id)) return;
    observed.current.add(operation.id);
    onPublished(operation);
  });

  return { generation, guard, bind, guardReview, reserve };
}
