import { E2eeError } from "./errors";
import type { ImportedPayload } from "../imported-payload";
import type { HistoryPageOptions } from "../history-order";
import type { E2eeMessage } from "../types";
import { requireGroup, type EngineContext } from "./context";
import {
  historyAround,
  loadHistoryPage,
  loadMessage,
  trimHistory,
} from "./history";
import { toE2eeMessage } from "./store";

export async function getSavedMessage(
  ctx: EngineContext,
  g: string,
  id: string
): Promise<E2eeMessage | null> {
  return ctx.queue.run(async () => {
    const runtime = requireGroup(ctx, g);
    const message = await loadMessage(ctx, runtime, id);
    const snapshot = message ? toE2eeMessage(message) : null;
    trimHistory(runtime, ctx.openConversation === runtime.record.g);
    return snapshot;
  });
}

export async function loadSavedHistory(
  ctx: EngineContext,
  g: string,
  options: HistoryPageOptions & { around?: string } = {}
): Promise<void> {
  return ctx.queue.run(async () => {
    const runtime = requireGroup(ctx, g);
    try {
      if (options.around) await historyAround(ctx, runtime, options.around);
      else await loadHistoryPage(ctx, runtime, options);
      runtime.historyError = false;
    } catch (error) {
      runtime.historyError = true;
      throw error;
    } finally {
      ctx.store.touch(runtime.record.g);
    }
  });
}

export async function findSavedImport(
  ctx: EngineContext,
  g: string,
  waveId: string,
  dropId: string,
  part: number
): Promise<E2eeMessage | null> {
  return ctx.queue.run(async () => {
    const canonical = requireGroup(ctx, g).record.g;
    const matches = await ctx.storage.findImported(ctx.profileId, canonical, {
      w: waveId,
      d: dropId,
      p: part,
    } as ImportedPayload);
    return matches[0] ? toE2eeMessage(matches[0]) : null;
  });
}

export async function requireSavedMessage(
  ctx: EngineContext,
  g: string,
  id: string
) {
  const message = await loadMessage(ctx, requireGroup(ctx, g), id);
  if (message?.kind !== "message") {
    throw new E2eeError("E2EE_NO_MESSAGE");
  }
  trimHistory(requireGroup(ctx, g), ctx.openConversation === g.toLowerCase());
  return message;
}
