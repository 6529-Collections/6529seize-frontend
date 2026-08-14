"use client";

import { AuthContext } from "@/components/auth/Auth";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import {
  QuickTagsBackButton,
  QuickTagsDeleteConfirmation,
  QuickTagsLoadError,
} from "@/components/user/mention-shortcuts/UserPageMentionShortcutsInlineViews";
import { getAvailableMentionIdentities } from "@/components/user/mention-shortcuts/userPageMentionShortcuts.helpers";
import type {
  MentionAlias,
  MentionAliasInput,
  MentionAliasMember,
} from "@/entities/IMentionAlias";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  isReservedMentionAlias,
  normalizeMentionAlias,
} from "@/helpers/mentions/mention-aliases.helpers";
import { useMentionAliases } from "@/hooks/useMentionAliases";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  createMentionAlias,
  deleteMentionAlias,
  updateMentionAlias,
} from "@/services/api/mention-aliases-api";
import { commonApiFetch } from "@/services/api/common-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode, RefObject } from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const MAX_MEMBERS = 25;
const MAX_SEARCH_RESULTS = 5;
const MIN_SEARCH_LENGTH = 3;
const VISIBLE_QUICK_TAGS = 3;
const LOADING_MESSAGE_KEY = "user.mentionShortcuts.loading";

type QuickTagsView = "summary" | "manage" | "editor";

function AliasEditor({
  backLabel,
  headingRef,
  initialAlias,
  onCancel,
  onSaved,
}: {
  readonly backLabel: string;
  readonly headingRef: RefObject<HTMLHeadingElement | null>;
  readonly initialAlias: MentionAlias | null;
  readonly onCancel: () => void;
  readonly onSaved: () => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, setToast } = useContext(AuthContext);
  const ownerProfileId = connectedProfile?.id ?? null;
  const queryClient = useQueryClient();
  const [alias, setAlias] = useState(initialAlias?.alias ?? "");
  const [members, setMembers] = useState<MentionAliasMember[]>(() =>
    (initialAlias?.members ?? []).filter(
      (member) => member.profile_id !== ownerProfileId
    )
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const profileSearchQuery = useQuery<CommunityMemberMinimal[]>({
    queryKey: [
      QueryKey.PROFILE_SEARCH,
      { param: debouncedSearch, only_profile_owners: "true" },
    ],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: {
          param: debouncedSearch,
          only_profile_owners: "true",
        },
      }),
    enabled:
      debouncedSearch.length >= MIN_SEARCH_LENGTH && debouncedSearch === search,
  });
  const identities = profileSearchQuery.data ?? [];
  const normalizedAlias = normalizeMentionAlias(alias);
  const aliasIsValid = /^\w{3,15}$/.test(normalizedAlias);
  const reserved = isReservedMentionAlias(normalizedAlias);
  const aliasHasError = alias.length > 0 && (!aliasIsValid || reserved);
  let aliasErrorDescription: string | undefined;
  if (reserved) {
    aliasErrorDescription = "mention-shortcut-reserved-error";
  } else if (!aliasIsValid && alias.length > 0) {
    aliasErrorDescription = "mention-shortcut-name-error";
  }
  const canSave = aliasIsValid && !reserved && members.length > 0;

  const mutation = useMutation({
    mutationFn: async (input: MentionAliasInput) =>
      initialAlias
        ? updateMentionAlias(initialAlias.id, input)
        : createMentionAlias(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.MENTION_ALIASES],
      });
      setToast({
        type: "success",
        message: initialAlias
          ? t(locale, "user.mentionShortcuts.updated")
          : t(locale, "user.mentionShortcuts.created"),
      });
      onSaved();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "user.mentionShortcuts.saveErrorTitle"),
        details: getToastErrorDetails(
          error,
          t(locale, "user.mentionShortcuts.saveErrorDetails")
        ),
      });
    },
  });

  const availableIdentities = getAvailableMentionIdentities(
    identities,
    members,
    ownerProfileId
  );
  const visibleIdentities = availableIdentities.slice(0, MAX_SEARCH_RESULTS);
  const searchIsReady =
    members.length < MAX_MEMBERS &&
    search.length >= MIN_SEARCH_LENGTH &&
    debouncedSearch === search;
  let searchStatus = t(locale, "user.mentionShortcuts.searchPrompt");
  if (searchIsReady && profileSearchQuery.isFetching) {
    searchStatus = t(locale, LOADING_MESSAGE_KEY);
  } else if (searchIsReady) {
    searchStatus =
      visibleIdentities.length === 1
        ? t(locale, "user.mentionShortcuts.searchResult")
        : t(locale, "user.mentionShortcuts.searchResults", {
            count: visibleIdentities.length,
          });
  }

  const addMember = (identity: CommunityMemberMinimal) => {
    const { profile_id: profileId, handle } = identity;
    if (
      !profileId ||
      !handle ||
      profileId === ownerProfileId ||
      members.length >= MAX_MEMBERS
    ) {
      return;
    }
    setMembers((current) => [
      ...current,
      {
        profile_id: profileId,
        handle,
        pfp: identity.pfp ?? null,
      },
    ]);
    setSearch("");
  };

  const save = () => {
    if (!canSave || mutation.isPending) return;
    mutation.mutate({
      alias: normalizedAlias,
      member_profile_ids: [
        ...new Set(
          members
            .map((member) => member.profile_id)
            .filter((profileId) => profileId !== ownerProfileId)
        ),
      ],
    });
  };

  const removeMember = (profileId: string) => {
    setMembers((current) =>
      current.filter((item) => item.profile_id !== profileId)
    );
  };

  let searchResultsContent: ReactNode = (
    <p className="tw-m-0 tw-px-3 tw-py-3 tw-text-sm tw-text-iron-400">
      {t(locale, "user.mentionShortcuts.searchResults", { count: 0 })}
    </p>
  );
  if (profileSearchQuery.isFetching) {
    searchResultsContent = (
      <p className="tw-m-0 tw-px-3 tw-py-3 tw-text-sm tw-text-iron-400">
        {t(locale, LOADING_MESSAGE_KEY)}
      </p>
    );
  } else if (visibleIdentities.length > 0) {
    searchResultsContent = (
      <ul className="tw-m-0 tw-list-none tw-p-0">
        {visibleIdentities.map((identity) => (
          <li key={identity.profile_id}>
            <button
              type="button"
              onClick={() => addMember(identity)}
              className="group tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-white"
            >
              <span className="tw-min-w-0 tw-truncate">
                @{identity.handle}
                {identity.display && (
                  <span className="tw-ml-2 tw-text-iron-500">
                    {identity.display}
                  </span>
                )}
              </span>
              <PlusIcon
                aria-hidden="true"
                className="tw-size-4 tw-flex-none tw-text-iron-600 tw-transition-colors group-hover:tw-text-primary-300"
              />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div aria-labelledby="quick-tag-editor-title">
      <div className="tw-flex tw-items-center tw-gap-2">
        <QuickTagsBackButton
          label={backLabel}
          onClick={onCancel}
          disabled={mutation.isPending}
        />
        <h3
          ref={headingRef}
          id="quick-tag-editor-title"
          tabIndex={-1}
          className="tw-m-0 tw-text-sm tw-font-bold tw-tracking-wide tw-text-iron-50 focus:tw-outline-none"
        >
          {initialAlias
            ? t(locale, "user.mentionShortcuts.edit")
            : t(locale, "user.mentionShortcuts.create")}
        </h3>
      </div>
      <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-400">
        {t(locale, "user.mentionShortcuts.editorDescription")}
      </p>

      <div className="tw-mt-5 tw-space-y-5">
        <div>
          <label
            htmlFor="mention-shortcut-name"
            className="tw-block tw-text-xs tw-font-semibold tw-text-iron-400"
          >
            <span>{t(locale, "user.mentionShortcuts.name")}</span>
            <div
              className={`tw-mt-1 tw-flex tw-items-center tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-bg-transparent tw-transition-colors focus-within:tw-border-primary-400 ${
                aliasHasError ? "tw-border-error" : "tw-border-white/10"
              }`}
            >
              <span
                aria-hidden="true"
                className="tw-text-sm tw-font-semibold tw-text-iron-500"
              >
                @
              </span>
              <input
                id="mention-shortcut-name"
                aria-label={t(locale, "user.mentionShortcuts.name")}
                aria-invalid={aliasHasError}
                aria-describedby={aliasErrorDescription}
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                maxLength={15}
                autoComplete="off"
                className="tw-min-h-11 tw-w-full tw-border-0 tw-bg-transparent tw-px-1.5 tw-py-2.5 tw-text-sm tw-font-medium tw-text-white tw-outline-none placeholder:tw-text-iron-600"
              />
            </div>
          </label>
          {!reserved && !aliasIsValid && alias.length > 0 && (
            <p
              id="mention-shortcut-name-error"
              role="alert"
              className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-error"
            >
              {t(locale, "user.mentionShortcuts.nameError")}
            </p>
          )}
          {reserved && (
            <p
              id="mention-shortcut-reserved-error"
              role="alert"
              className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-error"
            >
              {t(locale, "user.mentionShortcuts.reservedError")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="mention-shortcut-profile-search"
            className="tw-block tw-text-xs tw-font-semibold tw-text-iron-400"
          >
            {t(locale, "user.mentionShortcuts.addProfiles", {
              count: members.length,
              max: MAX_MEMBERS,
            })}
          </label>

          <GroupCreateIdentitySelectedItems
            selectedIdentities={members.map((member) => ({
              wallet: member.profile_id,
              handle: member.handle,
              pfp: member.pfp,
            }))}
            onRemove={removeMember}
            variant="quickTag"
            handlePrefix="@"
            getRemoveLabel={(identity) =>
              t(locale, "user.mentionShortcuts.removeProfile", {
                handle: identity.handle ?? "",
              })
            }
          />

          <div className="tw-relative tw-mt-2">
            <div className="tw-flex tw-items-center tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-transition-colors focus-within:tw-border-primary-400">
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="tw-size-4 tw-flex-none tw-text-iron-600"
              />
              <input
                id="mention-shortcut-profile-search"
                aria-label={t(locale, "user.mentionShortcuts.searchLabel")}
                aria-describedby="mention-shortcut-search-status"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t(
                  locale,
                  "user.mentionShortcuts.searchPlaceholder"
                )}
                disabled={members.length >= MAX_MEMBERS}
                autoComplete="off"
                className="tw-min-h-11 tw-w-full tw-border-0 tw-bg-transparent tw-px-2 tw-py-2.5 tw-text-sm tw-text-white tw-outline-none placeholder:tw-text-iron-600 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
              />
            </div>

            {searchIsReady && (
              <div className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-z-20 tw-mt-2 tw-max-h-52 tw-overflow-y-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-1.5 tw-shadow-2xl">
                {searchResultsContent}
              </div>
            )}
          </div>

          <p
            id="mention-shortcut-search-status"
            aria-live="polite"
            className="tw-sr-only"
          >
            {searchStatus}
          </p>
        </div>
      </div>

      <div className="tw-mt-5 tw-flex tw-flex-col-reverse tw-gap-2 sm:tw-flex-row sm:tw-justify-end">
        <Button
          variant="secondary"
          size="sm"
          disabled={mutation.isPending}
          onClick={onCancel}
        >
          {t(locale, "user.mentionShortcuts.cancel")}
        </Button>
        <Button
          variant="action"
          size="sm"
          disabled={!canSave}
          loading={mutation.isPending}
          onClick={save}
        >
          {mutation.isPending
            ? t(locale, "user.mentionShortcuts.saving")
            : t(locale, "user.mentionShortcuts.save")}
        </Button>
      </div>
    </div>
  );
}

export default function UserPageMentionShortcuts({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);
  const isOwner =
    !!profile.id && connectedProfile?.id === profile.id && !activeProfileProxy;
  const queryClient = useQueryClient();
  const { aliases, isPending, isError, refetch } = useMentionAliases({
    enabled: isOwner,
  });
  const [view, setView] = useState<QuickTagsView>("summary");
  const [editorAlias, setEditorAlias] = useState<MentionAlias | null>(null);
  const [editorReturnView, setEditorReturnView] =
    useState<Exclude<QuickTagsView, "editor">>("manage");
  const [aliasToDelete, setAliasToDelete] = useState<MentionAlias | null>(null);
  const viewHeadingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusViewHeadingRef = useRef(false);

  useEffect(() => {
    if (!shouldFocusViewHeadingRef.current) return;
    shouldFocusViewHeadingRef.current = false;
    viewHeadingRef.current?.focus();
  }, [aliasToDelete, view]);

  const requestViewHeadingFocus = () => {
    shouldFocusViewHeadingRef.current = true;
  };

  const changeView = (nextView: QuickTagsView) => {
    requestViewHeadingFocus();
    setAliasToDelete(null);
    setView(nextView);
  };

  const cancelDeletion = () => {
    requestViewHeadingFocus();
    setAliasToDelete(null);
  };

  const startDeleting = (alias: MentionAlias) => {
    requestViewHeadingFocus();
    setAliasToDelete(alias);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteMentionAlias,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.MENTION_ALIASES],
      });
      setToast({
        type: "success",
        message: t(locale, "user.mentionShortcuts.deleted"),
      });
      requestViewHeadingFocus();
      setAliasToDelete(null);
      setEditorAlias(null);
    },
    onError: (error) =>
      setToast({
        type: "error",
        title: t(locale, "user.mentionShortcuts.deleteErrorTitle"),
        details: getToastErrorDetails(
          error,
          t(locale, "user.mentionShortcuts.deleteErrorDetails")
        ),
      }),
  });

  const sortedAliases = useMemo(
    () => [...aliases].sort((a, b) => a.alias.localeCompare(b.alias)),
    [aliases]
  );
  const visibleAliases = sortedAliases.slice(0, VISIBLE_QUICK_TAGS);
  const hiddenAliasCount = sortedAliases.length - visibleAliases.length;

  const getMemberCountLabel = (count: number) =>
    count === 1
      ? t(locale, "user.mentionShortcuts.memberCount", { count })
      : t(locale, "user.mentionShortcuts.memberCountMany", { count });

  const startEditing = (
    alias: MentionAlias | null,
    returnView: Exclude<QuickTagsView, "editor">
  ) => {
    setEditorAlias(alias);
    setEditorReturnView(returnView);
    changeView("editor");
  };

  const showSummary = () => {
    setAliasToDelete(null);
    setEditorAlias(null);
    changeView("summary");
  };

  if (!isOwner) {
    return null;
  }

  let labelledBy = "quick-tags-heading";
  if (view === "manage" && aliasToDelete) {
    labelledBy = "delete-mention-shortcut-title";
  } else if (view === "manage") {
    labelledBy = "quick-tags-manager-title";
  } else if (view === "editor") {
    labelledBy = "quick-tag-editor-title";
  }

  let content: ReactNode;
  if (view === "manage" && aliasToDelete) {
    content = (
      <QuickTagsDeleteConfirmation
        alias={aliasToDelete}
        headingRef={viewHeadingRef}
        isPending={deleteMutation.isPending}
        onCancel={cancelDeletion}
        onConfirm={() => deleteMutation.mutate(aliasToDelete.id)}
      />
    );
  } else if (view === "summary") {
    content = (
      <div>
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
          <div className="tw-min-w-0">
            <h3
              ref={viewHeadingRef}
              id="quick-tags-heading"
              tabIndex={-1}
              className="tw-m-0 tw-text-sm tw-font-bold tw-tracking-wide tw-text-iron-50 focus:tw-outline-none"
            >
              {t(locale, "user.mentionShortcuts.title")}
            </h3>
            <p className="tw-mb-0 tw-mt-0.5 tw-max-w-2xl tw-text-sm tw-leading-5 tw-text-iron-400">
              {t(locale, "user.mentionShortcuts.summaryDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => changeView("manage")}
            className="tw-min-h-11 tw-shrink-0 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-400 sm:tw-min-h-6 sm:tw-py-0"
          >
            {t(locale, "user.mentionShortcuts.manage")}
          </button>
        </div>

        <div className="tw-mt-2 tw-flex tw-min-w-0 tw-flex-wrap tw-gap-2">
          {isPending && (
            <p
              aria-live="polite"
              className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400"
            >
              {t(locale, LOADING_MESSAGE_KEY)}
            </p>
          )}
          {isError && <QuickTagsLoadError onRetry={() => void refetch()} />}
          {!isPending && !isError && sortedAliases.length === 0 && (
            <button
              type="button"
              onClick={() => startEditing(null, "summary")}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-white/5 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/10 sm:tw-min-h-9 sm:tw-py-2"
            >
              <PlusIcon aria-hidden="true" className="tw-size-4" />
              {t(locale, "user.mentionShortcuts.new")}
            </button>
          )}
          {!isPending &&
            !isError &&
            visibleAliases.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => startEditing(item, "summary")}
                className="group tw-inline-flex tw-min-h-11 tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-100 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-iron-900 sm:tw-min-h-9 sm:tw-max-w-[18rem] sm:tw-py-1.5"
              >
                <span className="tw-min-w-0 tw-truncate tw-text-primary-300">
                  @{item.alias}
                </span>
                {item.members.length > 0 && (
                  <span className="tw-inline-flex tw-shrink-0">
                    <OverlappingAvatars
                      items={item.members.map((member) => ({
                        key: member.profile_id,
                        pfpUrl: member.pfp,
                        ariaLabel: member.handle,
                        fallback: member.handle.charAt(0).toUpperCase(),
                        title: member.handle,
                      }))}
                      size="xs"
                      maxCount={5}
                    />
                  </span>
                )}
                <span className="tw-shrink-0 tw-whitespace-nowrap tw-text-iron-400">
                  {getMemberCountLabel(item.members.length)}
                </span>
              </button>
            ))}
          {!isPending && !isError && hiddenAliasCount > 0 && (
            <button
              type="button"
              onClick={() => changeView("manage")}
              className="tw-min-h-11 tw-shrink-0 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white sm:tw-min-h-9"
            >
              {t(locale, "user.mentionShortcuts.more", {
                count: hiddenAliasCount,
              })}
            </button>
          )}
        </div>
      </div>
    );
  } else if (view === "manage") {
    content = (
      <div data-testid="quick-tags-manager">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <QuickTagsBackButton
              label={t(locale, "user.mentionShortcuts.back")}
              onClick={showSummary}
            />
            <h3
              ref={viewHeadingRef}
              id="quick-tags-manager-title"
              tabIndex={-1}
              className="tw-m-0 tw-truncate tw-text-sm tw-font-bold tw-tracking-wide tw-text-iron-50 focus:tw-outline-none"
            >
              {t(locale, "user.mentionShortcuts.title")}
            </h3>
          </div>
          <button
            type="button"
            aria-label={t(locale, "user.mentionShortcuts.new")}
            onClick={() => startEditing(null, "manage")}
            className="tw-min-h-11 tw-shrink-0 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-400 sm:tw-min-h-9"
          >
            {t(locale, "user.mentionShortcuts.newShort")}
          </button>
        </div>
        <p className="tw-mb-0 tw-mt-1 tw-max-w-2xl tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "user.mentionShortcuts.description")}
        </p>

        <div
          className="tw-mt-3 tw-max-h-80 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-2 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-500"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="tw-space-y-1">
            {isPending && (
              <p
                aria-live="polite"
                className="tw-m-0 tw-py-3 tw-text-sm tw-text-iron-400"
              >
                {t(locale, LOADING_MESSAGE_KEY)}
              </p>
            )}
            {isError && <QuickTagsLoadError onRetry={() => void refetch()} />}
            {!isPending && !isError && sortedAliases.length === 0 && (
              <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-white/10 tw-p-4 tw-text-center tw-text-sm tw-text-iron-400">
                {t(locale, "user.mentionShortcuts.empty")}
              </div>
            )}
            {sortedAliases.map((item) => (
              <article
                key={item.id}
                className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-3 last:tw-border-b-0"
              >
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                  <h3
                    id={`quick-tag-${item.id}`}
                    className="tw-m-0 tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-text-primary-300"
                  >
                    @{item.alias}
                  </h3>
                  <div className="tw-flex tw-flex-none tw-items-center tw-gap-1">
                    <button
                      type="button"
                      aria-label={t(locale, "user.mentionShortcuts.editAction")}
                      aria-describedby={`quick-tag-${item.id}`}
                      onClick={() => startEditing(item, "manage")}
                      className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-primary-300 sm:tw-size-9"
                    >
                      <PencilSquareIcon
                        aria-hidden="true"
                        className="tw-size-4"
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={t(
                        locale,
                        "user.mentionShortcuts.deleteAction"
                      )}
                      aria-describedby={`quick-tag-${item.id}`}
                      onClick={() => startDeleting(item)}
                      disabled={deleteMutation.isPending}
                      aria-busy={deleteMutation.isPending}
                      className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red disabled:tw-opacity-50 desktop-hover:hover:tw-bg-red/10 desktop-hover:hover:tw-text-red sm:tw-size-9"
                    >
                      <TrashIcon aria-hidden="true" className="tw-size-4" />
                    </button>
                  </div>
                </div>

                <GroupCreateIdentitySelectedItems
                  selectedIdentities={item.members.map((member) => ({
                    wallet: member.profile_id,
                    handle: member.handle,
                    pfp: member.pfp,
                  }))}
                  variant="quickTag"
                  handlePrefix="@"
                />
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    content = (
      <AliasEditor
        key={editorAlias?.id ?? "new"}
        backLabel={t(locale, "user.mentionShortcuts.back")}
        headingRef={viewHeadingRef}
        initialAlias={editorAlias}
        onCancel={() => {
          setEditorAlias(null);
          changeView(editorReturnView);
        }}
        onSaved={() => {
          setEditorAlias(null);
          changeView("manage");
        }}
      />
    );
  }

  return (
    <section
      aria-labelledby={labelledBy}
      className="tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-white/15 tw-bg-black tw-px-4 tw-py-3 tw-shadow-2xl"
      data-testid="quick-tags-section"
    >
      {content}
    </section>
  );
}
