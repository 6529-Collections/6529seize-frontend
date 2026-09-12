"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkMuseumRecordDefinition } from "@/generated/models/ApiArtworkMuseumRecordDefinition";
import type { ApiArtworkMuseumRecordInput } from "@/generated/models/ApiArtworkMuseumRecordInput";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  editorForSchema,
  documentationReferences,
} from "@/lib/artwork-documentation/catalogue";
import {
  initialValue,
  recordValue,
  type FieldValue,
  type ValueEditor,
} from "@/lib/artwork-documentation/registry";
import { matchesDocumentationSchema } from "@/lib/artwork-documentation/validation";
import { canReferenceDocumentationAssetLink } from "@/lib/artwork-documentation/capabilities";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import {
  appendMuseumRecord,
  getMuseumRecords,
} from "@/services/api/artwork-documentation-museum-api";
import { getDocumentationContext } from "@/services/api/artwork-documentation-api";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { useDocumentationActor } from "./DocumentationAuthGate";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";
import DocumentationValueEditor from "./DocumentationValueEditor";
import DocumentationRecordValue from "./DocumentationRecordValue";
import DocumentationJournalAttribution from "./DocumentationJournalAttribution";
import DocumentationCatalogueValue, {
  documentationVisibleLabels,
} from "./DocumentationCatalogueValue";

export default function DocumentationMuseumJournal({
  context,
  controller,
  active,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
  readonly active: boolean;
}) {
  const { msg } = useDocumentationMessages();
  const { connectedProfile, actorKey } = useDocumentationActor();
  const query = useInfiniteQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "museum-records",
      actorKey
    ),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getMuseumRecords(context.id, pageParam, signal),
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled: active,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const definitions = query.data?.pages[0]?.definitions ?? [];
  const allowed = query.data?.pages[0]?.allowed_kinds ?? [];
  const records = query.data?.pages.flatMap((page) => page.records) ?? [];
  return (
    <section
      hidden={!active}
      className="tw-space-y-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
      aria-labelledby="documentation-journal-title"
    >
      <h2
        id="documentation-journal-title"
        className="tw-m-0 tw-font-serif tw-text-3xl tw-font-normal"
      >
        {msg("museum.journalTitle")}
      </h2>
      <p className="tw-m-0 tw-max-w-prose tw-text-base tw-leading-7 tw-text-iron-300">
        {msg("museum.journalHelp")}
      </p>
      {query.isError && (
        <DocumentationNotice error>
          <p>{msg("unavailable")}</p>
          <DocumentationButton
            secondary
            onClick={() => {
              void query.refetch();
            }}
          >
            {msg("retry")}
          </DocumentationButton>
        </DocumentationNotice>
      )}
      {!query.data && query.isPending && <p role="status">{msg("loading")}</p>}
      {query.data && records.length === 0 && (
        <p className="tw-m-0 tw-text-sm tw-leading-7 tw-text-iron-400">
          {msg("museum.noJournal")}
        </p>
      )}
      <ol className="tw-m-0 tw-list-none tw-space-y-8 tw-p-0">
        {records.map((record) => (
          <li
            key={record.id}
            className="tw-min-w-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6"
          >
            <p className="tw-mb-2 tw-mt-0 tw-text-xs tw-text-iron-400">
              {definitions.find(
                (definition) => definition.kind === record.payload.kind
              )?.label ?? documentationOptionLabel(record.payload.kind)}{" "}
              · {documentationOptionLabel(record.payload.event_status)}
            </p>
            <h3 className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal">
              {record.payload.title}
            </h3>
            <p className="tw-mb-4 tw-mt-2 tw-text-xs tw-leading-6 tw-text-iron-400">
              <DocumentationJournalAttribution
                profileId={record.actor_profile_id}
                createdAt={record.created_at}
                active={active}
              />
            </p>
            {record.payload.statement && (
              <p
                className="tw-max-w-prose tw-whitespace-pre-wrap tw-font-serif tw-text-lg tw-leading-8 tw-text-iron-200"
                dir="auto"
              >
                {record.payload.statement}
              </p>
            )}
            <details className="tw-text-sm tw-text-iron-400">
              <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 focus-visible:tw-outline focus-visible:tw-outline-primary-400">
                {msg("museum.journalDetails")}
              </summary>
              <div className="tw-max-w-prose tw-py-4">
                {definitions.find(
                  (definition) => definition.kind === record.payload.kind
                ) ? (
                  <DocumentationCatalogueValue
                    value={record.payload.details}
                    editor={editorForSchema(
                      definitions.find(
                        (definition) => definition.kind === record.payload.kind
                      )!.value_schema,
                      "details"
                    )}
                    labels={documentationVisibleLabels(
                      context.modules,
                      context.assets,
                      context.work_id
                    )}
                  />
                ) : (
                  <DocumentationRecordValue value={record.payload.details} />
                )}
                <DocumentationRecordValue
                  value={{
                    ...(record.payload.effective_date
                      ? { effective_date: record.payload.effective_date }
                      : {}),
                    subjects: record.payload.subject_ids.map(
                      (id) =>
                        documentationReferences(context).find(
                          (item) => item.id === id
                        )?.label ?? id
                    ),
                    evidence: record.payload.evidence.map((item) => ({
                      filename:
                        context.assets.find(
                          (asset) => asset.id === item.asset_id
                        )?.filename ?? item.asset_id,
                      sha256: item.sha256,
                      size_bytes: item.size_bytes,
                    })),
                  }}
                />
              </div>
              <p className="tw-break-all tw-text-xs">
                SHA-256: {record.sha256}
              </p>
              {record.payload.supersedes_id && (
                <p className="tw-break-words tw-text-xs">
                  {msg("museum.supersedes", {
                    id: record.payload.supersedes_id,
                  })}
                </p>
              )}
            </details>
          </li>
        ))}
      </ol>
      {query.hasNextPage && (
        <DocumentationButton
          secondary
          disabled={query.isFetchingNextPage}
          onClick={() => {
            void query.fetchNextPage();
          }}
        >
          {msg("museum.moreJournal")}
        </DocumentationButton>
      )}
      {allowed.length > 0 && (
        <MuseumJournalComposer
          context={context}
          controller={controller}
          definitions={definitions.filter((definition) =>
            allowed.includes(definition.kind)
          )}
          onSaved={() => {
            void query.refetch();
          }}
        />
      )}
    </section>
  );
}

function MuseumJournalComposer({
  context,
  controller,
  definitions,
  onSaved,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
  readonly definitions: readonly ApiArtworkMuseumRecordDefinition[];
  readonly onSaved: () => void;
}) {
  const { msg } = useDocumentationMessages();
  const [kind, setKind] = useState("");
  const [drafts, setDrafts] = useState<Record<string, FieldValue>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const key = useRef({ payload: "", value: crypto.randomUUID() });
  const definition = definitions.find((item) => item.kind === kind);
  const value = recordValue(drafts[kind]);
  const details = definition
    ? editorForSchema(definition.value_schema, "details")
    : undefined;
  const valid =
    !!definition &&
    typeof value["title"] === "string" &&
    !!value["title"].trim() &&
    typeof value["event_status"] === "string" &&
    ["planned", "completed", "cancelled", "unknown"].includes(
      value["event_status"]
    ) &&
    matchesDocumentationSchema(value["details"], definition.value_schema);
  const changed = Object.keys(drafts).length > 0;
  useEffect(() => {
    if (!changed) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    globalThis.addEventListener("beforeunload", beforeUnload);
    const beforeLink = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        link &&
        link.getAttribute("target") !== "_blank" &&
        // eslint-disable-next-line no-alert -- Protect a deliberate journal draft on navigation, matching the artist draft's existing leave guard.
        !globalThis.confirm(msg("museum.leaveJournal"))
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", beforeLink, true);
    return () => {
      globalThis.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", beforeLink, true);
    };
  }, [changed, msg]);
  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setFailed(false);
    const payload = {
      ...value,
      kind,
      subject_ids: value["subject_ids"] ?? [context.work_id],
      evidence_asset_ids: value["evidence_asset_ids"] ?? [],
      event_status: value["event_status"] ?? "unknown",
    } as unknown as ApiArtworkMuseumRecordInput;
    const signature = JSON.stringify(payload);
    if (key.current.payload !== signature)
      key.current = { payload: signature, value: crypto.randomUUID() };
    const success = await controller.mutate(async (current, signal) => {
      await appendMuseumRecord(
        current.id,
        current.draft_version,
        payload,
        key.current.value,
        signal
      );
      return getDocumentationContext(current.id, signal);
    });
    if (success) {
      setDrafts((previous) =>
        Object.fromEntries(
          Object.entries(previous).filter(([id]) => id !== kind)
        )
      );
      setKind("");
      onSaved();
    } else setFailed(true);
    setBusy(false);
  };
  const editor: ValueEditor | undefined = details && {
    kind: "object",
    required: ["title", "event_status", "details"],
    fields: {
      title: { kind: "text", max: 1000 },
      event_status: {
        kind: "choice",
        options: ["planned", "completed", "cancelled", "unknown"],
      },
      effective_date: {
        kind: "text",
        max: 10,
        guidance: msg("museum.partialDateHelp"),
      },
      statement: { kind: "text", multiline: true, max: 50000 },
      subject_ids: { kind: "reference", multiple: true, target: "all" },
      evidence_asset_ids: { kind: "asset", multiple: true },
      details,
    },
  };
  return (
    <details className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-4">
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-base tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-primary-400">
        {msg("museum.addJournal")}
      </summary>
      <div className="tw-space-y-6 tw-py-5">
        <p className="tw-m-0 tw-max-w-prose tw-text-sm tw-leading-7 tw-text-iron-300">
          {msg("museum.journalComposeHelp")}
        </p>
        {changed && (
          <p role="status" className="tw-text-sm tw-text-amber-200">
            {msg("museum.journalUnsaved")}
          </p>
        )}
        <label className="tw-block tw-text-sm tw-text-iron-300">
          {msg("museum.journalKind")}
          <select
            className={`${inputClass} tw-mt-2`}
            value={kind}
            disabled={busy}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="">{msg("choose")}</option>
            {definitions.map((item) => (
              <option key={item.kind} value={item.kind}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {definition && editor && (
          <>
            <p className="tw-max-w-prose tw-text-sm tw-leading-7 tw-text-iron-300">
              {definition.description}
            </p>
            <DocumentationValueEditor
              key={kind}
              id="museum-journal-entry"
              label={definition.label}
              editor={editor}
              value={drafts[kind] ?? initialValue(editor)}
              onChange={(next) =>
                setDrafts((previous) => ({ ...previous, [kind]: next }))
              }
              disabled={busy}
              references={documentationReferences(context)}
              assets={context.assets
                .filter(
                  (asset) =>
                    asset.state === "ready" &&
                    context.asset_links.some(
                      (link) =>
                        link.asset_id === asset.id &&
                        canReferenceDocumentationAssetLink(context, link)
                    )
                )
                .map((asset) => ({ id: asset.id, label: asset.filename }))}
            />
            <DocumentationButton
              disabled={!valid || busy}
              onClick={() => {
                void submit();
              }}
            >
              {msg(busy ? "loading" : "museum.saveJournal")}
            </DocumentationButton>
          </>
        )}
        {failed && (
          <DocumentationNotice error>
            {msg("museum.journalSaveFailed")}
          </DocumentationNotice>
        )}
      </div>
    </details>
  );
}
