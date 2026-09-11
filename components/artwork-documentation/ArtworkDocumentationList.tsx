"use client";

import { ApiArtworkDocumentationCreateWorkStartModeEnum } from "@/generated/models/ApiArtworkDocumentationCreateWork";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  documentationQueryKey,
  useArtworkDocumentationAccess,
} from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import {
  createDocumentationWork,
  documentationWorkspacePath,
  documentationProfileKey,
  getDocumentationWorks,
  type DocumentationQueueFilters,
} from "@/services/api/artwork-documentation-api";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import DocumentationListRecord, {
  type DocumentationCatalogueItem,
} from "./DocumentationListRecord";
import DocumentationAuthGate, {
  useDocumentationActor,
} from "./DocumentationAuthGate";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function ArtworkDocumentationList({
  programId,
  sourceDropId,
}: {
  readonly programId?: string | undefined;
  readonly sourceDropId?: string | undefined;
}) {
  return (
    <DocumentationAuthGate>
      <DocumentationListContent
        programId={programId}
        sourceDropId={sourceDropId}
      />
    </DocumentationAuthGate>
  );
}

function DocumentationListContent({
  programId,
  sourceDropId,
}: {
  readonly programId?: string | undefined;
  readonly sourceDropId?: string | undefined;
}) {
  const { msg } = useDocumentationMessages();
  const queueOptionLabel = (key: string, option: string) => {
    if (key === "review_lane") return msg(`lane.${option}`);
    if (key === "outstanding_action") return msg(`action.${option}`);
    return documentationOptionLabel(option);
  };
  const { connectedProfile, actorKey } = useDocumentationActor();
  const access = useArtworkDocumentationAccess();
  const router = useRouter();
  const [profileId, setProfileId] = useState("");
  const [filter, setFilter] = useState("");
  const [queueFilters, setQueueFilters] = useState<DocumentationQueueFilters>(
    {}
  );
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(false);
  const createKey = useRef(crypto.randomUUID());
  const query = useInfiniteQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      "works",
      programId ?? "mine",
      actorKey,
      JSON.stringify(queueFilters)
    ),
    queryFn: ({ pageParam, signal }) =>
      getDocumentationWorks(pageParam, programId, signal, queueFilters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled: access.enabled,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const records: DocumentationCatalogueItem[] =
    query.data?.pages.flatMap((page) => page.data) ?? [];
  const sourceIds = [
    ...new Set(
      records.flatMap((record) =>
        record.source_submission ? [record.source_submission.drop_id] : []
      )
    ),
  ];
  const sourceQuery = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      "catalogue-submissions",
      programId ?? "mine",
      actorKey,
      sourceIds.join(",")
    ),
    queryFn: async ({ signal }) => {
      const drops: ApiDrop[] = [];
      for (let offset = 0; offset < sourceIds.length; offset += 100) {
        drops.push(
          ...(await fetchDropsV2ByIds({
            dropIds: sourceIds.slice(offset, offset + 100),
            signal,
          }))
        );
      }
      return drops;
    },
    enabled: access.enabled && sourceIds.length > 0,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const sourceDrops = new Map(sourceQuery.data?.map((drop) => [drop.id, drop]));
  const programIds = [
    ...new Set(
      records
        .map((record) => record.program_id)
        .filter((id): id is string => !!id)
    ),
  ];
  const selected =
    access.profiles.find(
      (profile) => documentationProfileKey(profile) === profileId
    ) ?? access.profiles[0];
  const start = async () => {
    if (!selected) return;
    setStarting(true);
    setError(false);
    try {
      const context = await createDocumentationWork(
        {
          profile_id: selected.profile_id,
          profile_version: selected.version,
          ...(selected.program_id ? { program_id: selected.program_id } : {}),
          ...(sourceDropId ? { source_drop_id: sourceDropId } : {}),
          start_mode: sourceDropId
            ? ApiArtworkDocumentationCreateWorkStartModeEnum.AfterSubmission
            : ApiArtworkDocumentationCreateWorkStartModeEnum.Standalone,
        },
        createKey.current
      );
      router.push(documentationWorkspacePath(context.work_id, context.id));
    } catch {
      setError(true);
    } finally {
      setStarting(false);
    }
  };
  return (
    <div className="tw-space-y-8">
      <header className="tw-grid tw-gap-8 tw-pb-4 lg:tw-grid-cols-[minmax(0,1fr)_20rem] lg:tw-gap-16">
        <div>
          <p className="tw-mb-6 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-iron-400">
            {programId === "6529NM-AP-01"
              ? msg("editorial.programEyebrow")
              : msg("title")}
          </p>
          <h1 className="tw-m-0 tw-max-w-3xl tw-font-serif tw-text-5xl tw-font-normal tw-leading-[1.05] tw-tracking-tight tw-text-iron-50 sm:tw-text-6xl">
            {programId === "6529NM-AP-01"
              ? msg("editorial.programTitle")
              : programId
                ? msg("editorial.records")
                : msg("editorial.personalTitle")}
          </h1>
        </div>
        <div className="lg:tw-pt-10">
          <p className="tw-m-0 tw-max-w-prose tw-text-base tw-leading-8 tw-text-iron-300">
            {msg(
              programId ? "editorial.programIntro" : "editorial.personalIntro"
            )}
          </p>
        </div>
      </header>
      {!programId && (
        <p className="tw-max-w-prose tw-text-sm tw-leading-7 tw-text-iron-400">
          {msg("editorial.preparationNote")}
        </p>
      )}
      {sourceDropId && (
        <DocumentationNotice>{msg("sourceHelp")}</DocumentationNotice>
      )}
      {access.isLoading && (
        <DocumentationNotice>{msg("loading")}</DocumentationNotice>
      )}
      {!access.isLoading && !access.enabled && (
        <DocumentationNotice>{msg("unavailable")}</DocumentationNotice>
      )}
      {(error || query.isError || access.isError) && (
        <DocumentationNotice error>
          <p>{msg("error")}</p>
          <DocumentationButton
            secondary
            onClick={() => {
              void access.refetch();
              void query.refetch();
            }}
          >
            {msg("retry")}
          </DocumentationButton>
        </DocumentationNotice>
      )}
      {access.enabled && (
        <>
          {!programId && (
            <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3">
              <label className="tw-grow tw-text-sm tw-text-iron-300">
                {msg("profile")}
                <select
                  className={`${inputClass} tw-mt-2`}
                  value={selected ? documentationProfileKey(selected) : ""}
                  onChange={(event) => {
                    setProfileId(event.target.value);
                    createKey.current = crypto.randomUUID();
                  }}
                >
                  {access.profiles.map((profile) => (
                    <option
                      key={documentationProfileKey(profile)}
                      value={documentationProfileKey(profile)}
                    >
                      {documentationOptionLabel(profile.profile_id)}
                      {profile.program_id
                        ? ` · ${documentationOptionLabel(profile.program_id)}`
                        : ""}{" "}
                      · v{profile.version}
                    </option>
                  ))}
                </select>
              </label>
              <DocumentationButton
                disabled={starting || !selected}
                onClick={() => {
                  void start();
                }}
              >
                {starting ? msg("loading") : msg("start")}
              </DocumentationButton>
            </div>
          )}
          {programId && (
            <details className="tw-border-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-2">
              <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                {msg("editorial.filterRecords")}
              </summary>
              <div className="tw-grid tw-gap-4 tw-pb-5 tw-pt-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
                {(
                  [
                    [
                      "confirmation_status",
                      ["unconfirmed", "current", "newer_draft"],
                    ],
                    ["review_lane", ["curatorial", "technical", "rights"]],
                    [
                      "outstanding_action",
                      ["artist_confirmation", "review", "changes_requested"],
                    ],
                  ] as const
                ).map(([key, options]) => (
                  <label key={key} className="tw-text-sm tw-text-iron-300">
                    {msg(`filter.${key}`)}
                    <select
                      className={`${inputClass} tw-mt-2`}
                      value={queueFilters[key] ?? ""}
                      onChange={(event) =>
                        setQueueFilters({
                          ...queueFilters,
                          [key]: event.target.value,
                        })
                      }
                    >
                      <option value="">{msg("all")}</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {queueOptionLabel(key, option)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="tw-text-sm tw-text-iron-300">
                  {msg("profile")}
                  <select
                    className={`${inputClass} tw-mt-2`}
                    value={queueFilters.profile_id ?? ""}
                    onChange={(event) =>
                      setQueueFilters({
                        ...queueFilters,
                        profile_id: event.target.value,
                      })
                    }
                  >
                    <option value="">{msg("all")}</option>
                    {[
                      ...new Map(
                        access.profiles.map((profile) => [
                          profile.profile_id,
                          profile,
                        ])
                      ).values(),
                    ].map((profile) => (
                      <option
                        key={profile.profile_id}
                        value={profile.profile_id}
                      >
                        {documentationOptionLabel(profile.profile_id)}
                        {profile.program_id
                          ? ` · ${documentationOptionLabel(profile.program_id)}`
                          : ""}{" "}
                        · v{profile.version}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="tw-text-sm tw-text-iron-300">
                  {msg("profileVersion")}
                  <input
                    className={`${inputClass} tw-mt-2`}
                    type="number"
                    min={1}
                    step={1}
                    value={queueFilters.profile_version ?? ""}
                    onChange={(event) =>
                      setQueueFilters({
                        ...queueFilters,
                        profile_version: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </details>
          )}
          {programIds.length > 1 && (
            <label className="tw-block tw-text-sm tw-text-iron-300">
              {msg("program")}
              <select
                className={`${inputClass} tw-mt-2`}
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="">{msg("allPrograms")}</option>
                {programIds.map((id) => (
                  <option key={id} value={id}>
                    {documentationOptionLabel(id)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {query.isLoading && (
            <DocumentationNotice>{msg("loading")}</DocumentationNotice>
          )}
          {!query.isLoading && records.length === 0 && (
            <div className={panelClass}>
              <p className="tw-m-0 tw-text-iron-300">{msg("empty")}</p>
            </div>
          )}
          <div className="tw-grid tw-gap-x-12 lg:tw-grid-cols-2">
            {records
              .filter((record) => !filter || record.program_id === filter)
              .map((record) => (
                <DocumentationListRecord
                  key={record.id}
                  record={record}
                  sourceDrop={
                    record.source_submission
                      ? sourceDrops.get(record.source_submission.drop_id)
                      : undefined
                  }
                />
              ))}
          </div>
          {query.hasNextPage && (
            <DocumentationButton
              secondary
              disabled={query.isFetchingNextPage}
              onClick={() => {
                void query.fetchNextPage();
              }}
            >
              {msg("more")}
            </DocumentationButton>
          )}
        </>
      )}
    </div>
  );
}
