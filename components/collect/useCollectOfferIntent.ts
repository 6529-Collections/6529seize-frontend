"use client";

import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { CollectTradeAction, CollectTradeDraft } from "./collect.types";
import { assertCollectOfferAmount } from "./collect-offer-policy";
import { validatePublishedMarketOffer } from "./market-validation";

interface OfferIntentOptions {
  readonly action: CollectTradeAction;
  readonly assetKey: string;
  readonly draft: CollectTradeDraft;
  readonly profileId: string | undefined;
  readonly wallet: string | undefined;
  readonly authenticated: boolean;
  readonly proxy: boolean;
  readonly maximumOfferAmountWei: string | undefined;
  readonly initialOperation: ApiMarketOperation | undefined;
  readonly operation: ApiMarketOperation | null;
  readonly expected: ApiMarketPrepareRequest | null;
  readonly onPublished: ((operation: ApiMarketOperation) => void) | undefined;
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
      validatePublishedMarketOffer(operation, expected);
    } catch {
      return;
    }
    if (!onPublished || observed.current.has(operation.id)) return;
    observed.current.add(operation.id);
    onPublished(operation);
  });

  return { generation, guard, bind, guardReview };
}
