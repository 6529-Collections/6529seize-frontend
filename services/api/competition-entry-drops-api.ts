import type { ApiCompetitionEntryContextPage } from "@/generated/models/ApiCompetitionEntryContextPage";
import type { ApiCompetitionEntryContext } from "@/generated/models/ApiCompetitionEntryContext";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";
import {
  competitionEndpoint,
  type CompetitionIdentity,
} from "@/services/api/competitions-api";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";

type EntryDrop = ApiCompetitionEntryContext & {
  competition: ApiCompetition;
  original: ApiDrop;
};
type Lookup = {
  entryId: string;
  dropId: string;
  signal: AbortSignal;
  resolve: (value: EntryDrop | null) => void;
  reject: (error: unknown) => void;
};
const pending = new Map<string, Set<Lookup>>();

async function loadBatch(identity: CompetitionIdentity, lookups: Lookup[]) {
  const controller = new AbortController();
  const abort = () => {
    if (lookups.every((lookup) => lookup.signal.aborted)) controller.abort();
  };
  for (const lookup of lookups) lookup.signal.addEventListener("abort", abort);
  try {
    const [contexts, drops] = await Promise.all([
      commonApiFetch<ApiCompetitionEntryContextPage>({
        endpoint: `${competitionEndpoint(identity)}/entry-contexts`,
        params: {
          entry_ids: [...new Set(lookups.map((item) => item.entryId))].join(
            ","
          ),
        },
        signal: controller.signal,
        errorMode: "structured",
      }),
      fetchDropsV2ByIds({
        dropIds: [...new Set(lookups.map((item) => item.dropId))],
        signal: controller.signal,
        includeFullMetadata: true,
      }),
    ]);
    if (
      contexts.competition.id !== identity.competitionId ||
      contexts.competition.wave_id !== identity.waveId
    )
      throw new Error("Invalid competition parent");
    const entriesById = new Map(
      contexts.data.map((item) => [item.entry.id, item])
    );
    const dropsById = new Map(drops.map((drop) => [drop.id, drop]));
    for (const lookup of lookups) {
      try {
        if (lookup.signal.aborted) continue;
        const context = entriesById.get(lookup.entryId);
        const original = dropsById.get(lookup.dropId);
        if (!context || !original) {
          lookup.resolve(null);
          continue;
        }
        if (
          context.entry.competition_id !== identity.competitionId ||
          context.entry.wave_id !== identity.waveId ||
          context.entry.drop_id !== lookup.dropId ||
          original.wave.id !== identity.waveId
        ) {
          lookup.reject(new Error("Invalid competition entry"));
          continue;
        }
        lookup.resolve({
          ...context,
          competition: contexts.competition,
          original,
        });
      } catch (error) {
        lookup.reject(error);
      }
    }
  } catch (error) {
    for (const lookup of lookups) lookup.reject(error);
  } finally {
    for (const lookup of lookups)
      lookup.signal.removeEventListener("abort", abort);
  }
}

/** Coalesce visible card queries without sharing requests across viewers or parents. */
export function fetchCompetitionEntryDrop(
  identity: CompetitionIdentity,
  viewer: string | null,
  entryId: string,
  dropId: string,
  signal: AbortSignal
): Promise<EntryDrop | null> {
  if (signal.aborted) return Promise.reject(signal.reason);
  const key = JSON.stringify([identity.waveId, identity.competitionId, viewer]);
  return new Promise((resolve, reject) => {
    let group = pending.get(key);
    if (!group) {
      group = new Set();
      pending.set(key, group);
      const batch = group;
      setTimeout(() => {
        pending.delete(key);
        const active = [...batch].filter((lookup) => !lookup.signal.aborted);
        for (let start = 0; start < active.length; start += 50)
          void loadBatch(identity, active.slice(start, start + 50));
      }, 0);
    }
    const lookup: Lookup = {
      entryId,
      dropId,
      signal,
      resolve: finish,
      reject: fail,
    };
    const abort = () => {
      group.delete(lookup);
      fail(signal.reason ?? new DOMException("Aborted", "AbortError"));
    };
    function finish(value: EntryDrop | null) {
      signal.removeEventListener("abort", abort);
      resolve(value);
    }
    function fail(error: unknown) {
      signal.removeEventListener("abort", abort);
      reject(error);
    }
    signal.addEventListener("abort", abort, { once: true });
    group.add(lookup);
  });
}
