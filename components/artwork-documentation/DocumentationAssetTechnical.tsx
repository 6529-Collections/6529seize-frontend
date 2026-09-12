"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
import { getDocumentationUpload } from "@/services/api/artwork-documentation-assets-api";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { formatDate } from "@/i18n/format";
import {
  DocumentationButton,
  useDocumentationMessages,
} from "./DocumentationControls";
import DocumentationRecordValue from "./DocumentationRecordValue";
import { useDocumentationActor } from "./DocumentationAuthGate";

/** Measured file evidence is distinct from custody, authorship and archival suitability. */
export default function DocumentationAssetTechnical({
  contextId,
  asset,
  canReadReport,
  onReport,
}: {
  readonly contextId: string;
  readonly asset: ApiArtworkDocumentationAsset;
  readonly canReadReport: boolean;
  readonly onReport: () => void;
}) {
  const { msg, locale } = useDocumentationMessages();
  const { connectedProfile, actorKey } = useDocumentationActor();
  const [opened, setOpened] = useState(false);
  const detail = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      contextId,
      "file-evidence",
      actorKey,
      asset.id,
      asset.sha256 ?? ""
    ),
    queryFn: ({ signal }) =>
      getDocumentationUpload(contextId, asset.id, signal),
    enabled: opened && !asset.technical_metadata,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const technical =
    asset.technical_metadata ?? detail.data?.asset.technical_metadata;
  let status = "";
  if (opened && detail.isError) status = msg("museum.technicalUnavailable");
  else if (opened && !technical && detail.isPending) status = msg("loading");
  return (
    <details
      className="tw-mt-3 tw-text-sm tw-text-iron-400"
      onToggle={(event) => setOpened(event.currentTarget.open)}
    >
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
        {msg("editorial.fileIntegrity")}
      </summary>
      <p className="tw-break-all">
        {msg("fileHash")}: {asset.sha256}
      </p>
      <p
        role="status"
        aria-atomic="true"
        className={status ? "tw-leading-7" : "tw-sr-only"}
      >
        {status}
      </p>
      {opened && detail.isError && (
        <DocumentationButton
          secondary
          onClick={() => {
            void detail.refetch();
          }}
        >
          {msg("retry")}
        </DocumentationButton>
      )}
      {technical && (
        <div className="tw-max-w-prose tw-space-y-5 tw-py-3">
          <p className="tw-leading-7">{msg("museum.technicalHelp")}</p>
          <dl className="tw-space-y-4">
            <div>
              <dt>{msg("museum.characterization")}</dt>
              <dd className="tw-m-0 tw-text-iron-200">
                {documentationOptionLabel(technical.characterization)} ·{" "}
                {technical.detected_format}
              </dd>
            </div>
            <div>
              <dt>{msg("museum.measuredAt")}</dt>
              <dd className="tw-m-0 tw-text-iron-200">
                {formatDate(locale, technical.measured_at)}
              </dd>
            </div>
            <div>
              <dt>{msg("museum.formatIdentification")}</dt>
              <dd className="tw-m-0 tw-text-iron-200">
                {technical.format_registry.identifier
                  ? `${technical.format_registry.authority ?? ""} ${technical.format_registry.identifier}`
                  : msg("museum.formatUnidentified")}
              </dd>
            </div>
            <div>
              <dt>{msg("museum.contentCredentials")}</dt>
              <dd className="tw-m-0 tw-text-iron-200">
                {msg(`museum.c2pa.${technical.c2pa.status}`)}
              </dd>
            </div>
            {technical.c2pa.integrity !== undefined && (
              <div>
                <dt>{msg("museum.credentialIntegrity")}</dt>
                <dd className="tw-m-0 tw-text-iron-200">
                  {msg(`museum.integrity.${technical.c2pa.integrity}`)}
                </dd>
              </div>
            )}
          </dl>
          <p className="tw-leading-7">{msg("museum.credentialsTrust")}</p>
          {Object.keys(technical.properties).length > 0 && (
            <DocumentationRecordValue value={technical.properties} />
          )}
          {technical.warnings.length > 0 && (
            <ul className="tw-space-y-2">
              {technical.warnings.map((warning) => (
                <li key={warning}>{documentationOptionLabel(warning)}</li>
              ))}
            </ul>
          )}
          <details>
            <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3">
              {msg("museum.technicalMethod")}
            </summary>
            <DocumentationRecordValue
              value={{
                method: technical.method,
                format_registry: technical.format_registry,
                ...(technical.archive ? { archive: technical.archive } : {}),
              }}
            />
          </details>
        </div>
      )}
      {canReadReport && asset.has_validation_report && (
        <DocumentationButton secondary onClick={onReport}>
          {msg("museum.downloadCredentials")}
        </DocumentationButton>
      )}
    </details>
  );
}
