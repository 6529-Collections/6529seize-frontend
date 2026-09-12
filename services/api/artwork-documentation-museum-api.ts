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

export const getMuseumRecords = (
  id: string,
  cursor?: string,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiArtworkMuseumRecords>({
    endpoint: `${documentationContextPath(id)}/museum-records`,
    params: cursor ? { cursor } : {},
    signal,
    errorMode: "structured",
    cache: "no-store",
  });
export const appendMuseumRecord = (
  id: string,
  version: number,
  body: ApiArtworkMuseumRecordInput,
  key: string,
  signal?: AbortSignal
) =>
  commonApiPost<ApiArtworkMuseumRecordInput, ApiArtworkMuseumRecord>({
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
