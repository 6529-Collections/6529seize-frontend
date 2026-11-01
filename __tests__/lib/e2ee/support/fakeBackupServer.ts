import { E2eeApiError } from "@/lib/e2ee/api";
import type {
  ApiE2eeBackup,
  ApiE2eeBackupChunk,
  E2eeBackupApi,
} from "@/lib/e2ee/backup/api";
import { base64ToBytes } from "@/lib/e2ee/bytes";

/**
 * In-memory stand-in for the backend backup routes (same rules: one active
 * and one pending generation, server-assigned seq, the expected_seq append
 * precondition, bucket lengths, quota).
 * Records every request body so tests can assert nothing plaintext leaves
 * the client.
 */

const BUCKETS = [4096, 16_384, 65_536, 262_144, 1_048_576];

interface Generation {
  backup: ApiE2eeBackup;
  profileId: string;
  chunks: Map<number, { data: string; meta: ApiE2eeBackupChunk }>;
}

export interface RecordedBackupRequest {
  profileId: string;
  method: string;
  path: string;
  body: unknown;
}

export interface FakeBackupServer {
  readonly requests: RecordedBackupRequest[];
  quotaBytes: number;
  /**
   * Honors the append precondition (409 E2EE_BACKUP_SEQ_CONFLICT). Off, it
   * behaves like a server that predates expected_seq and ignores it.
   */
  supportsExpectedSeq: boolean;
  clientFor(profileId: string): E2eeBackupApi;
  generations(profileId: string): ApiE2eeBackup[];
}

const notFound = () =>
  new E2eeApiError({
    message: "not found",
    status: 404,
    code: "E2EE_NOT_FOUND",
  });

export function createFakeBackupServer(now: () => number): FakeBackupServer {
  const generations = new Map<string, Generation>();
  const requests: RecordedBackupRequest[] = [];
  const server: FakeBackupServer = {
    requests,
    quotaBytes: 256 * 1024 * 1024,
    supportsExpectedSeq: true,
    generations: (profileId) =>
      [...generations.values()]
        .filter((gen) => gen.profileId === profileId)
        .map((gen) => ({ ...gen.backup })),
    clientFor: (profileId) => client(profileId),
  };

  const own = (profileId: string, backupId: string): Generation => {
    const gen = generations.get(backupId);
    if (gen?.profileId !== profileId) {
      throw notFound();
    }
    return gen;
  };
  const usage = (profileId: string) =>
    [...generations.values()]
      .filter((gen) => gen.profileId === profileId)
      .reduce((sum, gen) => sum + gen.backup.size, 0);
  const record = (
    profileId: string,
    method: string,
    path: string,
    body: unknown = null
  ) => {
    requests.push({ profileId, method, path, body: structuredClone(body) });
  };

  function client(profileId: string): E2eeBackupApi {
    return {
      getStatus: async () => {
        record(profileId, "GET", "e2ee/backup");
        const active = [...generations.values()].find(
          (gen) => gen.profileId === profileId && gen.backup.active
        );
        return {
          backup: active ? { ...active.backup } : null,
          used_bytes: usage(profileId),
          quota_bytes: server.quotaBytes,
          max_chunk_bytes: 1_048_576,
          chunk_buckets: BUCKETS,
        };
      },
      getBackup: async (backupId) => {
        record(profileId, "GET", `e2ee/backups/${backupId}`);
        return { ...own(profileId, backupId).backup };
      },
      createBackup: async (body) => {
        record(profileId, "POST", "e2ee/backups", body);
        for (const [id, gen] of generations) {
          if (gen.profileId === profileId && !gen.backup.active) {
            generations.delete(id);
          }
        }
        const backup: ApiE2eeBackup = {
          backup_id: body.backup_id,
          envelope: body.envelope,
          active: false,
          chunk_count: 0,
          size: 0,
          next_seq: 1,
          created_at: now(),
          updated_at: now(),
          activated_at: null,
        };
        generations.set(body.backup_id, {
          backup,
          profileId,
          chunks: new Map(),
        });
        return { ...backup };
      },
      activate: async (backupId, deviceKey) => {
        record(profileId, "POST", `e2ee/backups/${backupId}/activate`, {
          device_key: deviceKey,
        });
        const gen = own(profileId, backupId);
        for (const [id, other] of generations) {
          if (other.profileId === profileId && id !== backupId) {
            generations.delete(id);
          }
        }
        gen.backup = {
          ...gen.backup,
          active: true,
          activated_at: gen.backup.activated_at ?? now(),
        };
        return { ...gen.backup };
      },
      appendChunk: async (backupId, body) => {
        record(profileId, "POST", `e2ee/backups/${backupId}/chunks`, body);
        const gen = own(profileId, backupId);
        const size = base64ToBytes(body.data).length;
        if (!BUCKETS.includes(size)) {
          throw new E2eeApiError({
            message: "bucket",
            status: 400,
            code: "E2EE_BAD_REQUEST",
          });
        }
        if (
          server.supportsExpectedSeq &&
          body.expected_seq !== undefined &&
          body.expected_seq !== gen.backup.next_seq
        ) {
          throw new E2eeApiError({
            message: "seq conflict",
            status: 409,
            code: "E2EE_BACKUP_SEQ_CONFLICT",
          });
        }
        if (usage(profileId) + size > server.quotaBytes) {
          throw new E2eeApiError({
            message: "quota",
            status: 413,
            code: "E2EE_BACKUP_QUOTA",
          });
        }
        const meta = { seq: gen.backup.next_seq, size, created_at: now() };
        gen.chunks.set(meta.seq, { data: body.data, meta });
        gen.backup = {
          ...gen.backup,
          next_seq: meta.seq + 1,
          chunk_count: gen.backup.chunk_count + 1,
          size: gen.backup.size + size,
          updated_at: now(),
        };
        return { ...meta };
      },
      listChunks: async (backupId, afterSeq, limit = 500) => {
        record(profileId, "GET", `e2ee/backups/${backupId}/chunks`);
        const gen = own(profileId, backupId);
        const all = [...gen.chunks.values()]
          .map((chunk) => chunk.meta)
          .filter((meta) => meta.seq > afterSeq)
          .sort((a, b) => a.seq - b.seq);
        const items = all.slice(0, limit);
        return {
          items,
          next_after_seq: all.length > limit ? items.at(-1)!.seq : null,
        };
      },
      getChunk: async (backupId, seq) => {
        record(profileId, "GET", `e2ee/backups/${backupId}/chunks/${seq}`);
        const chunk = own(profileId, backupId).chunks.get(seq);
        if (!chunk) {
          throw notFound();
        }
        return { seq, data: chunk.data };
      },
      compact: async (backupId, body) => {
        record(profileId, "POST", `e2ee/backups/${backupId}/compact`, body);
        const gen = own(profileId, backupId);
        for (const seq of [...gen.chunks.keys()]) {
          if (seq <= body.through_seq) {
            gen.chunks.delete(seq);
          }
        }
        const rest = [...gen.chunks.values()];
        gen.backup = {
          ...gen.backup,
          chunk_count: rest.length,
          size: rest.reduce((sum, chunk) => sum + chunk.meta.size, 0),
        };
        return { ...gen.backup };
      },
      deleteAll: async () => {
        record(profileId, "DELETE", "e2ee/backup");
        for (const [id, gen] of generations) {
          if (gen.profileId === profileId) {
            generations.delete(id);
          }
        }
      },
    };
  }

  return server;
}
