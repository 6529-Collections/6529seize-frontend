import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import { QuickTagsBackButton } from "@/components/user/mention-shortcuts/UserPageMentionShortcutsInlineViews";
import { getAvailableMentionIdentities } from "@/components/user/mention-shortcuts/userPageMentionShortcuts.helpers";
import type {
  MentionAlias,
  MentionAliasInput,
  MentionAliasMember,
} from "@/entities/IMentionAlias";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import {
  isReservedMentionAlias,
  normalizeMentionAlias,
} from "@/helpers/mentions/mention-aliases.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import {
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useRef, type ReactNode, type RefObject } from "react";

const MAX_MEMBERS = 25;
const MAX_SEARCH_RESULTS = 5;
const MIN_SEARCH_LENGTH = 3;
const LOADING_MESSAGE_KEY = "user.mentionShortcuts.loading";

export type AliasEditorDraft = {
  readonly alias: string;
  readonly members: MentionAliasMember[];
  readonly search: string;
};

export function getAliasEditorDraft(
  alias: MentionAlias | null,
  ownerProfileId: string | null
): AliasEditorDraft {
  return {
    alias: alias?.alias ?? "",
    members: (alias?.members ?? []).filter(
      (member) => member.profile_id !== ownerProfileId
    ),
    search: "",
  };
}

function getAliasErrorDescription(
  reserved: boolean,
  aliasIsValid: boolean,
  hasAlias: boolean
): string | undefined {
  if (reserved) return "mention-shortcut-reserved-error";
  if (!aliasIsValid && hasAlias) return "mention-shortcut-name-error";
  return undefined;
}

function getSearchStatus({
  isFetching,
  locale,
  searchIsReady,
  visibleResultCount,
}: {
  readonly isFetching: boolean;
  readonly locale: SupportedLocale;
  readonly searchIsReady: boolean;
  readonly visibleResultCount: number;
}): string {
  if (!searchIsReady) {
    return t(locale, "user.mentionShortcuts.searchPrompt");
  }
  if (isFetching) return t(locale, LOADING_MESSAGE_KEY);
  if (visibleResultCount === 1) {
    return t(locale, "user.mentionShortcuts.searchResult");
  }
  return t(locale, "user.mentionShortcuts.searchResults", {
    count: visibleResultCount,
  });
}

export function AliasEditor({
  backLabel,
  draft,
  headingRef,
  isEditing,
  isMobileSheet,
  isSaving,
  onCancel,
  onDraftChange,
  onSave,
  ownerProfileId,
}: {
  readonly backLabel: string;
  readonly draft: AliasEditorDraft;
  readonly headingRef?: RefObject<HTMLHeadingElement | null> | undefined;
  readonly isEditing: boolean;
  readonly isMobileSheet: boolean;
  readonly isSaving: boolean;
  readonly onCancel: () => void;
  readonly onDraftChange: (draft: AliasEditorDraft) => void;
  readonly onSave: (input: MentionAliasInput) => void;
  readonly ownerProfileId: string | null;
}) {
  const locale = useBrowserLocale();
  const editorContentRef = useRef<HTMLDivElement>(null);
  useKeyboardFocusScroll(editorContentRef);
  const { alias, members, search } = draft;
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
  const aliasErrorDescription = getAliasErrorDescription(
    reserved,
    aliasIsValid,
    alias.length > 0
  );
  const canSave = aliasIsValid && !reserved && members.length > 0;

  const fieldIdPrefix = isMobileSheet ? "quick-tag-sheet" : "mention-shortcut";
  const nameInputId = `${fieldIdPrefix}-name`;
  const nameErrorId = `${fieldIdPrefix}-name-error`;
  const reservedErrorId = `${fieldIdPrefix}-reserved-error`;
  const searchInputId = `${fieldIdPrefix}-profile-search`;
  const searchStatusId = `${fieldIdPrefix}-search-status`;
  let resolvedAliasErrorDescription: string | undefined;
  if (aliasErrorDescription === "mention-shortcut-name-error") {
    resolvedAliasErrorDescription = nameErrorId;
  } else if (aliasErrorDescription === "mention-shortcut-reserved-error") {
    resolvedAliasErrorDescription = reservedErrorId;
  }

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
  const searchStatus = getSearchStatus({
    isFetching: profileSearchQuery.isFetching,
    locale,
    searchIsReady,
    visibleResultCount: visibleIdentities.length,
  });

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
    onDraftChange({
      ...draft,
      members: [
        ...members,
        {
          profile_id: profileId,
          handle,
          pfp: identity.pfp ?? null,
        },
      ],
      search: "",
    });
  };

  const save = () => {
    if (!canSave || isSaving) return;
    onSave({
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
    onDraftChange({
      ...draft,
      members: members.filter((item) => item.profile_id !== profileId),
    });
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
    <div
      ref={editorContentRef}
      aria-labelledby={isMobileSheet ? undefined : "quick-tag-editor-title"}
    >
      {!isMobileSheet && (
        <div className="tw-flex tw-items-center tw-gap-2">
          <QuickTagsBackButton
            label={backLabel}
            onClick={onCancel}
            disabled={isSaving}
          />
          <h3
            ref={headingRef}
            id="quick-tag-editor-title"
            tabIndex={-1}
            className="tw-m-0 tw-text-sm tw-font-bold tw-tracking-wide tw-text-iron-50 focus:tw-outline-none"
          >
            {isEditing
              ? t(locale, "user.mentionShortcuts.edit")
              : t(locale, "user.mentionShortcuts.create")}
          </h3>
        </div>
      )}
      <p className="tw-mb-0 tw-mt-2 tw-max-w-lg tw-text-pretty tw-text-sm tw-leading-5 tw-text-iron-300">
        {t(locale, "user.mentionShortcuts.editorDescription")}
      </p>

      <div className="tw-mt-5 tw-space-y-5">
        <div>
          <label
            htmlFor={nameInputId}
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
                id={nameInputId}
                aria-label={t(locale, "user.mentionShortcuts.name")}
                aria-invalid={aliasHasError}
                aria-describedby={resolvedAliasErrorDescription}
                value={alias}
                onChange={(event) =>
                  onDraftChange({ ...draft, alias: event.target.value })
                }
                maxLength={15}
                autoComplete="off"
                className="tw-min-h-11 tw-w-full tw-border-0 tw-bg-transparent tw-px-1.5 tw-py-2.5 tw-text-sm tw-font-medium tw-text-white tw-outline-none placeholder:tw-text-iron-600"
              />
            </div>
          </label>
          {!reserved && !aliasIsValid && alias.length > 0 && (
            <p
              id={nameErrorId}
              role="alert"
              className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-error"
            >
              {t(locale, "user.mentionShortcuts.nameError")}
            </p>
          )}
          {reserved && (
            <p
              id={reservedErrorId}
              role="alert"
              className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-error"
            >
              {t(locale, "user.mentionShortcuts.reservedError")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={searchInputId}
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
                id={searchInputId}
                aria-label={t(locale, "user.mentionShortcuts.searchLabel")}
                aria-describedby={searchStatusId}
                value={search}
                onChange={(event) =>
                  onDraftChange({ ...draft, search: event.target.value })
                }
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
              <div
                className={`tw-z-20 tw-mt-2 tw-max-h-52 tw-overflow-y-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-1.5 tw-shadow-2xl ${
                  isMobileSheet
                    ? "tw-relative"
                    : "tw-absolute tw-left-0 tw-right-0 tw-top-full"
                }`}
              >
                {searchResultsContent}
              </div>
            )}
          </div>

          <p id={searchStatusId} aria-live="polite" className="tw-sr-only">
            {searchStatus}
          </p>
        </div>
      </div>

      <div className="tw-mt-5 tw-flex tw-flex-col-reverse tw-gap-2 sm:tw-flex-row sm:tw-justify-end">
        <Button
          variant="secondary"
          size="sm"
          disabled={isSaving}
          onClick={onCancel}
        >
          {t(locale, "user.mentionShortcuts.cancel")}
        </Button>
        <Button
          variant="action"
          size="sm"
          disabled={!canSave || isSaving}
          loading={isSaving}
          onClick={save}
        >
          {isSaving
            ? t(locale, "user.mentionShortcuts.saving")
            : t(locale, "user.mentionShortcuts.save")}
        </Button>
      </div>
    </div>
  );
}
