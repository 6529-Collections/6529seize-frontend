"use client";

import Link from "next/link";
import { ApiArtworkDocumentationCreateWorkStartModeEnum } from "@/generated/models/ApiArtworkDocumentationCreateWork";
import { useInfiniteQuery } from "@tanstack/react-query";
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
import { formatDate } from "@/i18n/format";
import { isPublicationOnly } from "@/lib/artwork-documentation/intake";
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
  const { msg, locale } = useDocumentationMessages();
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
  const records = query.data?.pages.flatMap((page) => page.data) ?? [];
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
      <header>
        <p className="tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-widest tw-text-iron-400">
          {msg("title")}
        </p>
        <h1 className="tw-max-w-3xl tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
          {programId ? msg("reviewQueue") : msg("intro")}
        </h1>
        <p className="tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-relaxed tw-text-iron-300">
          {msg("description")}
        </p>
        <p className="tw-max-w-3xl tw-text-sm tw-leading-relaxed tw-text-iron-400">
          {msg("stages")}
        </p>
      </header>
      <DocumentationNotice>
        {msg(
          selected && isPublicationOnly(selected)
            ? "publication.help"
            : "privacy"
        )}
      </DocumentationNotice>
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
            <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
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
                    <option key={profile.profile_id} value={profile.profile_id}>
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
          <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
            {records
              .filter((record) => !filter || record.program_id === filter)
              .map((record) => (
                <article
                  key={record.id}
                  className={`${panelClass} tw-flex tw-flex-col tw-gap-3`}
                >
                  <p className="tw-m-0 tw-text-xs tw-text-iron-400">
                    {documentationOptionLabel(
                      record.program_id ?? record.profile_id
                    )}
                  </p>
                  <h2 className="tw-m-0 tw-break-words tw-text-xl tw-font-semibold tw-text-iron-100">
                    {record.title ?? msg("untitled")}
                  </h2>
                  <div className="tw-flex tw-flex-wrap tw-gap-3 tw-text-xs tw-text-iron-400">
                    <span>
                      {documentationOptionLabel(record.confirmation_status)}
                    </span>
                    {record.lifecycle === "archived" && (
                      <span>{msg("archived")}</span>
                    )}
                    <span>
                      {msg("savedAt", {
                        date: formatDate(locale, record.updated_at),
                      })}
                    </span>
                  </div>
                  {programId && (
                    <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0 tw-text-xs tw-text-iron-300">
                      {record.reviews.map((review) => (
                        <li key={review.lane}>
                          {msg(`lane.${review.lane}`)}:{" "}
                          {msg(`review.${review.status}`)}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={documentationWorkspacePath(record.work_id, record.id)}
                    className="hover:tw-text-primary-200 tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2"
                  >
                    {msg("continue")}
                  </Link>
                </article>
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
