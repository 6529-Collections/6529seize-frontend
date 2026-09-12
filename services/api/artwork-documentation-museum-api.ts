import type { ApiArtworkDossier } from "@/generated/models/ApiArtworkDossier";
import type { ApiArtworkDossierExport } from "@/generated/models/ApiArtworkDossierExport";
import type { ApiArtworkMuseumRecords } from "@/generated/models/ApiArtworkMuseumRecords";
import type { ApiArtworkMuseumRecord } from "@/generated/models/ApiArtworkMuseumRecord";
import type { ApiArtworkMuseumRecordInput } from "@/generated/models/ApiArtworkMuseumRecordInput";
import { commonApiFetch, commonApiPost } from "./common-api";
import {
  documentationContextPath,
  documentationHeaders,
} from "./artwork-documentation-api";

/** JSON uses unique arrays; the generated model represents these as runtime Sets. */
export type MuseumRecordInput = Omit<
  ApiArtworkMuseumRecordInput,
  "subject_ids" | "evidence_asset_ids"
> & { subject_ids: string[]; evidence_asset_ids: string[] };

export const getMuseumRecords = (
  id: string,
  cursor?: string,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiArtworkMuseumRecords>({
    endpoint: `${documentationContextPath(id)}/museum-records`,
    params: cursor ? { before: cursor } : {},
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const appendMuseumRecord = (
  id: string,
  version: number,
  body: MuseumRecordInput,
  key: string,
  signal?: AbortSignal
) =>
  commonApiPost<MuseumRecordInput, ApiArtworkMuseumRecord>({
    endpoint: `${documentationContextPath(id)}/museum-records`,
    body,
    headers: documentationHeaders(version, key),
    signal,
    errorMode: "structured",
  });
export const getArtworkDossier = (id: string, signal?: AbortSignal) =>
  commonApiFetch<ApiArtworkDossier>({
    endpoint: `${documentationContextPath(id)}/dossier`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const createArtworkDossierExport = (
  id: string,
  version: number,
  sourceHash: string,
  key: string,
  signal?: AbortSignal
) =>
  commonApiPost<{ source_sha256: string }, ApiArtworkDossierExport>({
    endpoint: `${documentationContextPath(id)}/dossier/exports`,
    body: { source_sha256: sourceHash },
    headers: documentationHeaders(version, key),
    signal,
    errorMode: "structured",
  });
export const getArtworkDossierExport = (
  id: string,
  exportId: string,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiArtworkDossierExport>({
    endpoint: `${documentationContextPath(id)}/dossier/exports/${encodeURIComponent(exportId)}`,
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
