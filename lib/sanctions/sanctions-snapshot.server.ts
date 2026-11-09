import "server-only";

import { canonicalJson } from "@/lib/sanctions/canonical-json";
import { rawBlockCid, sha256Hex } from "@/lib/sanctions/content-address.server";
import {
  SANCTIONS_LIST_SCHEMA,
  type SanctionsListV1,
} from "@/lib/sanctions/sanctions-list.types";
import snapshotPayload from "@/lib/sanctions/snapshot/sanctions-list.v1.json";

/**
 * A preview snapshot of `6529.sanctions-list.v1`, built from the official
 * sources on 2026-11-06 with the backend builder (`6529 run sanctions:list`).
 * It stands in until the daily job publishes signed releases; its hash is
 * pinned here and re-checked from the parsed data on every render.
 */
const SANCTIONS_SNAPSHOT_BUILT_ON = "2026-11-06";
export const SANCTIONS_SNAPSHOT_SHA256 =
  "aa88e6edee3eb57f93953cbb7fc7d90e6e3f3ffd262d3dfbfbedb01ef59d6778";
export const SANCTIONS_SNAPSHOT_CID =
  "bafkreifkrdto33r6wv7zhfj4xn74pwiony7t77jgfu67x67nwapplhlhpa";

interface LoadedSanctionsList {
  readonly list: SanctionsListV1;
  /** The canonical payload, exactly as published (UTF-8 when encoded). */
  readonly json: string;
  readonly bytes: Uint8Array;
  readonly sha256: string;
  readonly cid: string;
  readonly builtOn: string;
  /** True for the preview snapshot; false once signed releases are read. */
  readonly preview: boolean;
}

/**
 * Loads the snapshot and proves it is the pinned file: the parsed object is
 * re-serialized canonically (RFC 8785), which reproduces the published bytes,
 * and its sha256 and CID must match the pinned values.
 */
export function loadSanctionsSnapshot(): LoadedSanctionsList {
  const list = snapshotPayload as unknown as SanctionsListV1;
  const schema: string = list.schema;
  if (schema !== SANCTIONS_LIST_SCHEMA) {
    throw new Error("Sanctions snapshot has an unexpected schema");
  }
  const json = canonicalJson(list);
  const bytes = new TextEncoder().encode(json);
  const sha256 = sha256Hex(bytes);
  const cid = rawBlockCid(bytes);
  if (sha256 !== SANCTIONS_SNAPSHOT_SHA256 || cid !== SANCTIONS_SNAPSHOT_CID) {
    throw new Error("Sanctions snapshot does not match its pinned hash");
  }
  return {
    list,
    json,
    bytes,
    sha256,
    cid,
    builtOn: SANCTIONS_SNAPSHOT_BUILT_ON,
    preview: true,
  };
}
