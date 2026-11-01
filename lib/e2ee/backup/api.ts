import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import { toE2eeApiError } from "../api";

/** REST shapes of the backup routes (backend `/e2ee/backup*`). */

export interface ApiE2eeBackup {
  backup_id: string;
  /** base64 opaque key envelope */
  envelope: string;
  active: boolean;
  chunk_count: number;
  size: number;
  next_seq: number;
  created_at: number;
  updated_at: number;
  activated_at: number | null;
}

export interface ApiE2eeBackupStatus {
  backup: ApiE2eeBackup | null;
  used_bytes: number;
  quota_bytes: number;
  max_chunk_bytes: number;
  chunk_buckets: number[];
}

export interface ApiE2eeBackupChunk {
  seq: number;
  size: number;
  created_at: number;
}

export interface ApiE2eeBackupChunkUpload {
  device_key: string;
  data: string;
  /**
   * Append precondition: the seq this chunk must get. The server refuses
   * any other next seq with 409 E2EE_BACKUP_SEQ_CONFLICT (another device
   * appended first). Servers without it ignore the field.
   */
  expected_seq?: number;
}

export interface ApiE2eeBackupChunkPage {
  items: ApiE2eeBackupChunk[];
  next_after_seq: number | null;
}

export interface ApiE2eeBackupChunkData {
  seq: number;
  data: string;
}

/** Every backup endpoint the backup manager uses. Tests inject a fake. */
export interface E2eeBackupApi {
  getStatus(): Promise<ApiE2eeBackupStatus>;
  getBackup(backupId: string): Promise<ApiE2eeBackup>;
  createBackup(body: {
    backup_id: string;
    envelope: string;
    device_key: string;
  }): Promise<ApiE2eeBackup>;
  activate(backupId: string, deviceKey: string): Promise<ApiE2eeBackup>;
  appendChunk(
    backupId: string,
    body: ApiE2eeBackupChunkUpload
  ): Promise<ApiE2eeBackupChunk>;
  listChunks(
    backupId: string,
    afterSeq: number,
    limit?: number
  ): Promise<ApiE2eeBackupChunkPage>;
  getChunk(backupId: string, seq: number): Promise<ApiE2eeBackupChunkData>;
  compact(
    backupId: string,
    body: { device_key: string; through_seq: number }
  ): Promise<ApiE2eeBackup>;
  deleteAll(): Promise<void>;
}

async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw toE2eeApiError(error);
  }
}

const enc = encodeURIComponent;

const get = <T>(endpoint: string, params?: Record<string, string>) =>
  call(() =>
    commonApiFetch<T>({
      endpoint,
      ...(params ? { params } : {}),
      errorMode: "structured",
      cache: "no-store",
    })
  );

const post = <T>(endpoint: string, body: object) =>
  call(() =>
    commonApiPost<object, T>({ endpoint, body, errorMode: "structured" })
  );

export function createE2eeBackupApiClient(): E2eeBackupApi {
  return {
    getStatus: () => get<ApiE2eeBackupStatus>("e2ee/backup"),
    getBackup: (backupId) => get(`e2ee/backups/${enc(backupId)}`),
    createBackup: (body) => post(`e2ee/backups`, body),
    activate: (backupId, deviceKey) =>
      post(`e2ee/backups/${enc(backupId)}/activate`, {
        device_key: deviceKey,
      }),
    appendChunk: (backupId, body) =>
      post(`e2ee/backups/${enc(backupId)}/chunks`, body),
    listChunks: (backupId, afterSeq, limit = 500) =>
      get(`e2ee/backups/${enc(backupId)}/chunks`, {
        after_seq: String(afterSeq),
        limit: String(limit),
      }),
    getChunk: (backupId, seq) =>
      get(`e2ee/backups/${enc(backupId)}/chunks/${seq}`),
    compact: (backupId, body) =>
      post(`e2ee/backups/${enc(backupId)}/compact`, body),
    deleteAll: () =>
      call(() =>
        commonApiDelete({ endpoint: "e2ee/backup", errorMode: "structured" })
      ),
  };
}
