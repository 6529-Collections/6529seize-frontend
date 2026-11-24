"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import {
  chainWriteDetails,
  chainWriteFailure,
} from "@/components/chain-waves/chainWavesErrorMessage";
import {
  invalidateChainEntryQueries,
  useChainEntrySubmit,
  type ChainEntrySubmit,
} from "@/components/chain-waves/useChainEntryWriters";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { removeTemporaryThreadReply } from "@/components/waves/drops/reply-threads/pending-replies";
import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  ChainEntryPendingError,
  type ChainEntryStage,
} from "@/lib/chain-waves/entryWriters";
import type { DropMutationBody } from "./drop-submission.types";

const CHAIN_ENTRY_SENT =
  "Entry sent to the 6529 Network. It shows here once 6529.io lists it.";
const CHAIN_ENTRY_FAILED = "Couldn't send this entry to the 6529 Network.";
const CHAIN_ENTRY_IN_FLIGHT =
  "Your entry is still on its way. Wait for it before you send another.";
const CHAIN_ENTRY_KEPT = "Nothing was sent. Your entry is still here.";
const CHAIN_ENTRY_LOST = "Nothing was sent. Your entry is not saved.";

/** What the composer shows while an entry is on its way. */
export const CHAIN_ENTRY_STAGE_LABEL: Record<ChainEntryStage, string> = {
  preparing: "Getting your entry ready.",
  wallet: "Waiting for your wallet.",
  sending: "Sending to the 6529 Network.",
};

type ProcessDropRemoved = (waveId: string, dropId: string) => void;

/**
 * Takes back a post its sender already showed (curation, quorum), as for a
 * failed send, and tells the sender. The row may be added right after the
 * refusal, so it goes on the next task.
 */
export function takeBackRefusedDrop(
  dropRequest: DropMutationBody,
  error: unknown,
  stream: {
    readonly queryClient: QueryClient;
    readonly processDropRemoved: ProcessDropRemoved;
  }
): void {
  const optimisticId = dropRequest.dropId;
  if (optimisticId) {
    setTimeout(() => {
      if (dropRequest.drop.reply_to) {
        removeTemporaryThreadReply(
          stream.queryClient,
          dropRequest.drop.wave_id,
          optimisticId
        );
      }
      stream.processDropRemoved(dropRequest.drop.wave_id, optimisticId);
    }, 0);
  }
  dropRequest.onError?.(error);
}

/** Resolves on a later task, after the ones already queued. */
const nextTask = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

/**
 * The toast for an entry the 6529 Network didn't take, or null when the
 * wallet prompt was declined and the entry is still in the composer. The
 * network's reason is the description, in plain words, with no details
 * under it; a refusal from a block says the fee was charged.
 */
function failureToast(
  locale: SupportedLocale,
  error: unknown,
  sent: boolean,
  keepsDraft: boolean
): AppToastInput | null {
  if (isUserRejectedSigningError(error)) {
    return keepsDraft ? null : { message: CHAIN_ENTRY_LOST, type: "warning" };
  }
  const reason = chainWriteFailure(locale, error, "", "entry");
  const kept = keepsDraft ? CHAIN_ENTRY_KEPT : CHAIN_ENTRY_LOST;
  const description = [reason, sent ? "" : kept]
    .filter((line) => line !== "")
    .join(" ");
  return {
    type: "error",
    title: CHAIN_ENTRY_FAILED,
    ...(description === "" ? {} : { description }),
    details: chainWriteDetails(error),
  };
}

interface SendContext {
  readonly locale: SupportedLocale;
  readonly terms: string | null;
  readonly setStage: (stage: ChainEntryStage) => void;
  readonly setToast: (toast: AppToastInput) => void;
  readonly onAllDropsAdded: (() => void) | undefined;
  readonly processDropRemoved: ProcessDropRemoved;
  readonly queryClient: QueryClient;
  /** Lets the next entry go and clears the stage. */
  readonly release: () => void;
}

/**
 * Removes the sender's optimistic row once the write settles; 6529.io lists
 * the entry once its index reads it from the chain.
 */
async function removeOptimisticRow(
  body: DropMutationBody,
  processDropRemoved: ProcessDropRemoved
): Promise<void> {
  const optimisticId = body.dropId;
  if (!optimisticId) {
    return;
  }
  // The composer adds its optimistic row after it hears the answer,
  // inserting it on a task it queues then. Waiting a task first queues the
  // removal after that insert.
  await nextTask();
  setTimeout(() => processDropRemoved(body.drop.wave_id, optimisticId), 0);
}

/**
 * Sends one entry and answers whether it went out: true once the signed
 * entry is on its way, false when it failed before that.
 */
function sendEntry(
  submit: ChainEntrySubmit,
  body: DropMutationBody,
  context: SendContext
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let sent = false;
    const markSent = () => {
      if (!sent) {
        sent = true;
        resolve(true);
      }
    };
    const succeeded = (toast: AppToastInput) => {
      markSent();
      context.setToast(toast);
      body.onSuccess?.();
      context.onAllDropsAdded?.();
    };
    const run = async () => {
      try {
        await submit({
          request: body.drop,
          terms: context.terms,
          onStage: (stage) => {
            context.setStage(stage);
            if (stage === "sending") {
              markSent();
            }
          },
        });
        succeeded({ message: CHAIN_ENTRY_SENT, type: "success" });
      } catch (error) {
        if (error instanceof ChainEntryPendingError) {
          // Sent, not yet final: it may still land, so no retry is offered.
          succeeded({ message: error.message, type: "warning" });
        } else if (body.onError?.(error) !== true) {
          const toast = failureToast(
            context.locale,
            error,
            sent,
            body.keepsDraftWhenRefused === true
          );
          if (toast) {
            context.setToast(toast);
          }
        }
      } finally {
        context.release();
        resolve(sent);
        await removeOptimisticRow(body, context.processDropRemoved);
        await invalidateChainEntryQueries(
          context.queryClient,
          body.drop.wave_id
        ).catch(() => undefined);
      }
    };
    void run();
  });
}

export interface ChainEntrySender {
  /** Where the entry on its way stands, or null with none. */
  readonly stage: ChainEntryStage | null;
  /**
   * Sends an entry to the 6529 Network; null unless entries go there now.
   * Refuses one (false) while another is on its way: the wallet prompt can
   * stay open for a while, and a second entry sent beside it would be a
   * second entry on the chain. Otherwise answers whether the entry went
   * out. A sender that waits for the answer (the composer) keeps its draft
   * until then, so a declined wallet prompt or a refusal before anything
   * was sent leaves the entry in place.
   */
  readonly send: ((body: DropMutationBody) => false | Promise<boolean>) | null;
}

/**
 * The composer's entries on the 6529 Network: their own signatures, no
 * 6529.io drop to accept.
 */
export function useChainEntrySender({
  competition,
  terms,
  onAllDropsAdded,
}: {
  readonly competition: ApiCompetition | null;
  readonly terms: string | null;
  readonly onAllDropsAdded: (() => void) | undefined;
}): ChainEntrySender {
  const submit = useChainEntrySubmit(competition);
  const { setToast } = useAuth();
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const { processDropRemoved } = useMyStreamActions();
  const inFlightRef = useRef(false);
  const [stage, setStage] = useState<ChainEntryStage | null>(null);

  const send = useCallback(
    (body: DropMutationBody): false | Promise<boolean> => {
      if (!submit) {
        return false;
      }
      if (inFlightRef.current) {
        takeBackRefusedDrop(
          body,
          new ChainOperationError("rejected", CHAIN_ENTRY_IN_FLIGHT),
          { queryClient, processDropRemoved }
        );
        setToast({ message: CHAIN_ENTRY_IN_FLIGHT, type: "error" });
        return false;
      }
      inFlightRef.current = true;
      setStage("preparing");
      return sendEntry(submit, body, {
        locale,
        terms,
        setStage,
        setToast,
        onAllDropsAdded,
        processDropRemoved,
        queryClient,
        release: () => {
          inFlightRef.current = false;
          setStage(null);
        },
      });
    },
    [
      locale,
      onAllDropsAdded,
      processDropRemoved,
      queryClient,
      setToast,
      submit,
      terms,
    ]
  );

  return { stage, send: submit ? send : null };
}
