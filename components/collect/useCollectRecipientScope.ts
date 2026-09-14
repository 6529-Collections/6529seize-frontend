"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { collectProfileWallets } from "./collect-recipient.helpers";

interface RecipientScopeOptions {
  readonly operation: { readonly id: string } | null;
  readonly expected: unknown;
  readonly profile: ApiIdentity | null;
  readonly wallet: string | undefined;
  readonly enabled: boolean;
}

function recipientScopes(options: RecipientScopeOptions) {
  const membership = collectProfileWallets(options.profile)
    .map((item) => item.wallet.toLowerCase())
    .sort((left, right) => {
      if (left < right) return -1;
      return left > right ? 1 : 0;
    });
  const idleIdentity = JSON.stringify({
    id: options.operation?.id,
    expected: options.expected,
    profile: options.profile?.id,
    membership,
    wallet: options.wallet?.toLowerCase(),
  });
  const updateIdentity = JSON.stringify({
    idleIdentity,
    operation: options.operation,
    enabled: options.enabled,
  });
  return { idleIdentity, updateIdentity };
}

/** Keep captured attempts bound to their committed actor and operation, including A → B → A transitions. */
export function useCollectRecipientScope<T extends RecipientScopeOptions>(
  options: T,
  boundActor: (options: T) => boolean,
  pendingAttempt: RefObject<object | null>
) {
  const { idleIdentity, updateIdentity } = recipientScopes(options);
  const idleGeneration = useMemo(
    () => ({ identity: idleIdentity }),
    [idleIdentity]
  );
  const updateGeneration = useMemo(
    () => ({ identity: updateIdentity }),
    [updateIdentity]
  );
  const live = useRef<{
    idle: object;
    update: object;
    options: T;
  } | null>(null);
  useLayoutEffect(() => {
    live.current = { idle: idleGeneration, update: updateGeneration, options };
    return () => {
      live.current = null;
    };
  }, [idleGeneration, updateGeneration, options]);

  const assertIdle = () => {
    if (
      live.current?.idle !== idleGeneration ||
      !boundActor(live.current.options) ||
      pendingAttempt.current
    )
      throw new Error("MARKET_CONNECTION_CHANGED");
  };
  const assertUpdate = () => {
    if (
      live.current?.update !== updateGeneration ||
      !live.current.options.enabled ||
      !boundActor(live.current.options)
    )
      throw new Error("MARKET_CONNECTION_CHANGED");
  };
  return { live, updateGeneration, assertIdle, assertUpdate };
}
