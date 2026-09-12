"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDossierExport } from "@/generated/models/ApiArtworkDossierExport";
import { ApiArtworkDossierExportStateEnum } from "@/generated/models/ApiArtworkDossierExport";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import {
  createArtworkDossierExport,
  getArtworkDossier,
  getArtworkDossierExport,
} from "@/services/api/artwork-documentation-museum-api";
import { formatNumber } from "@/i18n/format";
import {
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { createDossierRecoveryStore } from "@/lib/artwork-documentation/dossier-recovery";
import { useDocumentationActor } from "./DocumentationAuthGate";
import {
  DocumentationButton,
  DocumentationNotice,
  useDocumentationMessages,
} from "./DocumentationControls";

interface Props {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
  readonly active: boolean;
}
export default function DocumentationDossier(props: Props) {
  const { connectedProfile, actorKey } = useDocumentationActor();
  const recoveryKey = `6529:artwork-documentation:dossier:${actorKey}:${props.context.id}`;
  return (
    <DossierForActor
      key={recoveryKey}
      {...props}
      recoveryKey={recoveryKey}
      actorKey={actorKey}
      profileId={connectedProfile?.id ?? undefined}
    />
  );
}

function DossierForActor({
  context,
  controller,
  active,
  recoveryKey,
  actorKey,
  profileId,
}: Props & {
  readonly recoveryKey: string;
  readonly actorKey: string;
  readonly profileId: string | undefined;
}) {
  const { msg, locale } = useDocumentationMessages();
  const [job, setJob] = useState<ApiArtworkDossierExport | null>(null);
  const recoveryStore = useMemo(
    () => createDossierRecoveryStore(recoveryKey),
    [recoveryKey]
  );
  const recovery = useSyncExternalStore(
    recoveryStore.subscribe,
    recoveryStore.getSnapshot,
    () => null
  );
  const [unavailableJob, setUnavailableJob] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const remember = recoveryStore.update;
  useEffect(() => () => abort.current?.abort(), []);
  const dossier = useQuery({
    queryKey: documentationQueryKey(
      profileId,
      context.id,
      "dossier",
      actorKey,
      String(context.draft_version)
    ),
    queryFn: ({ signal }) => getArtworkDossier(context.id, signal),
    enabled: active,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const progress = useQuery({
    queryKey: documentationQueryKey(
      profileId,
      context.id,
      "dossier-export",
      actorKey,
      recovery?.jobId ?? "none"
    ),
    queryFn: async ({ signal }) => {
      const discardUnavailable = () => {
        remember(null);
        setJob(null);
        setUnavailableJob(true);
      };
      try {
        const result = await getArtworkDossierExport(
          context.id,
          recovery!.jobId!,
          signal
        );
        if (
          !signal.aborted &&
          result.state === ApiArtworkDossierExportStateEnum.Expired
        )
          discardUnavailable();
        return result;
      } catch (error) {
        if (!signal.aborted && getStructuredApiErrorStatus(error) === 404)
          discardUnavailable();
        throw error;
      }
    },
    enabled: !!recovery?.jobId,
    initialData: job?.id === recovery?.jobId ? (job ?? undefined) : undefined,
    refetchInterval: (query) =>
      ["queued", "processing"].includes(query.state.data?.state ?? "")
        ? 3000
        : false,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const currentJob = progress.data;
  const prepareLabel = recovery?.request
    ? "museum.retryExport"
    : "museum.exportDossier";
  const start = async () => {
    setFailed(false);
    setUnavailableJob(false);
    setBusy(true);
    const request = new AbortController();
    abort.current = request;
    try {
      let pending = recovery?.request;
      if (!pending) {
        if (!(await controller.flush())) return;
        const current = controller.snapshot().context;
        const manifest = await getArtworkDossier(current.id, request.signal);
        if (!manifest.can_export) {
          void dossier.refetch();
          return;
        }
        pending = {
          sourceHash: manifest.source_sha256,
          draftVersion: manifest.draft_version,
          key: crypto.randomUUID(),
        };
        remember({ jobId: null, request: pending });
      }
      const created = await createArtworkDossierExport(
        context.id,
        pending.draftVersion,
        pending.sourceHash,
        pending.key,
        request.signal
      );
      if (!request.signal.aborted) {
        setJob(created);
        remember({ jobId: created.id, request: null });
      }
    } catch (error) {
      if (!request.signal.aborted) {
        if (
          [
            "DRAFT_CONFLICT",
            "DOSSIER_SOURCE_CHANGED",
            "DOSSIER_VALIDATION_FAILED",
            "INVALID_DOSSIER_REQUEST",
            "DOSSIER_EXPORT_LIMIT",
          ].includes(getStructuredApiErrorCode(error) ?? "")
        )
          remember(null);
        setFailed(true);
      }
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  };
  return (
    <section
      className="tw-space-y-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
      aria-labelledby="documentation-dossier-title"
    >
      <h3
        id="documentation-dossier-title"
        className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal"
      >
        {msg("museum.dossierTitle")}
      </h3>
      <p className="tw-m-0 tw-max-w-prose tw-text-sm tw-leading-7 tw-text-iron-300">
        {msg("museum.dossierHelp")}
      </p>
      {recovery?.request && !busy && (
        <p role="status" className="tw-text-sm tw-leading-7 tw-text-iron-300">
          {msg("museum.exportInterrupted")}
        </p>
      )}
      {unavailableJob && (
        <p role="status" className="tw-text-sm tw-leading-7 tw-text-iron-300">
          {msg("museum.exportUnavailable")}
        </p>
      )}
      {dossier.isError && (
        <DocumentationNotice error>
          <p>{msg("museum.dossierUnavailable")}</p>
          <DocumentationButton
            secondary
            onClick={() => {
              void dossier.refetch();
            }}
          >
            {msg("retry")}
          </DocumentationButton>
        </DocumentationNotice>
      )}
      {!dossier.isError && !dossier.data && (
        <p role="status">{msg("loading")}</p>
      )}
      {!dossier.isError && dossier.data && (
        <>
          <p className="tw-m-0 tw-text-sm tw-text-iron-400">
            {msg(
              new Intl.PluralRules(locale).select(dossier.data.files.length) ===
                "one"
                ? "museum.dossierFiles.one"
                : "museum.dossierFiles.other",
              { count: formatNumber(locale, dossier.data.files.length) }
            )}
          </p>
          {dossier.data.issues.length > 0 && (
            <ul className="tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-7 tw-text-iron-300">
              {dossier.data.issues.map((issue, index) => (
                <li key={`${issue.code}-${issue.path}-${index}`}>
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
          <DocumentationButton
            secondary
            disabled={
              busy ||
              (!recovery?.request && !dossier.data.can_export) ||
              (!!recovery?.jobId &&
                (progress.isPending ||
                  progress.isFetching ||
                  progress.isError)) ||
              ["queued", "processing"].includes(currentJob?.state ?? "")
            }
            onClick={() => {
              void start();
            }}
          >
            {msg(busy ? "loading" : prepareLabel)}
          </DocumentationButton>
        </>
      )}
      {currentJob && (
        <div className="tw-space-y-3">
          <p
            role="status"
            className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
          >
            {msg(`museum.export.${currentJob.state}`)}
          </p>
          {currentJob.state === ApiArtworkDossierExportStateEnum.Ready &&
            currentJob.download_url &&
            /^https:\/\//i.test(currentJob.download_url) && (
              <a
                href={currentJob.download_url}
                download
                className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-primary-400"
              >
                {msg("museum.downloadDossier")}
              </a>
            )}
          {currentJob.sha256 && (
            <details className="tw-text-sm tw-text-iron-400">
              <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3">
                {msg("museum.packageIntegrity")}
              </summary>
              <p className="tw-break-all tw-font-mono tw-text-xs">
                SHA-256: {currentJob.sha256}
              </p>
            </details>
          )}
        </div>
      )}
      {(failed || progress.isError) && (
        <DocumentationNotice error>
          {msg("museum.dossierUnavailable")}
          {progress.isError && (
            <DocumentationButton
              secondary
              onClick={() => {
                void progress.refetch();
              }}
            >
              {msg("retry")}
            </DocumentationButton>
          )}
        </DocumentationNotice>
      )}
    </section>
  );
}
