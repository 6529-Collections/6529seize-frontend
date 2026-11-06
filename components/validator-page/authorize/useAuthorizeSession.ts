"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { recoverTypedDataAddress } from "viem";
import { useAccount, useSignTypedData } from "wagmi";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { withLegacyRecoveryByte } from "@/lib/validator-page/authorize/display";
import {
  decodeDraftLink,
  type Draft,
} from "@/lib/validator-page/authorize/draftLink";
import { toSignableTypedData } from "@/lib/validator-page/authorize/typedData";

import {
  isUserRejection,
  reviewDraft,
  type GrantReview,
} from "./authorizeFlow";

export type Signing =
  | { readonly status: "idle" | "wallet" | "rejected" | "failed" | "mismatch" }
  | { readonly status: "signed"; readonly signature: string };

const IDLE: Signing = { status: "idle" };

/**
 * The link the page was opened with: undefined until the page has read its
 * address, null without a fragment, "bad" for a damaged one.
 */
function subscribeToFragment(onChange: () => void): () => void {
  globalThis.addEventListener("hashchange", onChange);
  return () => globalThis.removeEventListener("hashchange", onChange);
}

function useDraftFromFragment(): Draft | null | "bad" | undefined {
  const fragment = useSyncExternalStore<string | undefined>(
    subscribeToFragment,
    () => globalThis.location.hash,
    // The server never sees the fragment.
    () => undefined
  );
  return useMemo(() => {
    if (fragment === undefined) {
      return undefined;
    }
    if (fragment.length < 2) {
      return null;
    }
    return decodeDraftLink(fragment) ?? "bad";
  }, [fragment]);
}

function asDraft(value: Draft | null | "bad" | undefined): Draft | null {
  return typeof value === "object" ? value : null;
}

/**
 * The phone's side of authorizing a validator: the draft from the link,
 * the wallet that must sign it, and the signature. Nothing is sent
 * anywhere; the holder copies the signature into the validator.
 */
export function useAuthorizeSession() {
  const { isSafeWallet, seizeConnect, seizeConnectFresh } =
    useSeizeConnectContext();
  // The wallet that signs: the live connection, even when the site keeps
  // another of the holder's accounts active.
  const live = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const draft = useDraftFromFragment();
  const currentDraft = asDraft(draft);
  const review: GrantReview | null = useMemo(
    () => (currentDraft === null ? null : reviewDraft(currentDraft)),
    [currentDraft]
  );
  const account =
    live.isConnected && live.address ? live.address.toLowerCase() : null;

  // Kept with the draft it is for, so a new link starts over.
  const [signingState, setSigningState] = useState<{
    readonly draft: Draft | null;
    readonly signing: Signing;
  }>({ draft: null, signing: IDLE });
  const signing =
    signingState.draft === currentDraft ? signingState.signing : IDLE;

  const sign = useCallback(async () => {
    if (!currentDraft || !review || review.problems.length > 0) {
      return;
    }
    if (account !== currentDraft.account) {
      return;
    }
    const show = (next: Signing) =>
      setSigningState({ draft: currentDraft, signing: next });
    show({ status: "wallet" });
    const signable = toSignableTypedData(review.grant);
    let signature: string;
    try {
      signature = withLegacyRecoveryByte(
        await signTypedDataAsync({
          account: account as `0x${string}`,
          ...signable,
        })
      );
    } catch (error) {
      show({ status: isUserRejection(error) ? "rejected" : "failed" });
      return;
    }
    // The validator takes only the account's own signature; say so here
    // rather than there.
    let signer = "";
    try {
      signer = await recoverTypedDataAddress({
        ...signable,
        signature: signature as `0x${string}`,
      });
    } catch {
      // A signature that recovers to nobody is a mismatch.
    }
    show(
      signer.toLowerCase() === account
        ? { status: "signed", signature }
        : { status: "mismatch" }
    );
  }, [account, currentDraft, review, signTypedDataAsync]);

  return {
    draft,
    review,
    account,
    isSafeWallet: account !== null && isSafeWallet,
    connect: seizeConnect,
    connectAnother: seizeConnectFresh,
    signing,
    sign,
  };
}
