"use client";

import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type {
  MentionAlias,
  MentionAliasInput,
  MentionAliasMember,
} from "@/entities/IMentionAlias";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  isReservedMentionAlias,
  normalizeMentionAlias,
} from "@/helpers/mentions/mention-aliases.helpers";
import { useIdentitiesSearch } from "@/hooks/useIdentitiesSearch";
import { useMentionAliases } from "@/hooks/useMentionAliases";
import {
  createMentionAlias,
  deleteMentionAlias,
  updateMentionAlias,
} from "@/services/api/mention-aliases-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext, useMemo, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const MAX_MEMBERS = 25;

const getAvailableIdentities = (
  identities: ApiIdentity[],
  members: MentionAliasMember[]
) => {
  const selectedProfileIds = new Set(
    members.map((member) => member.profile_id)
  );
  return identities.filter(
    (identity) =>
      !!identity.id && !!identity.handle && !selectedProfileIds.has(identity.id)
  );
};

function DeleteShortcutDialog({
  alias,
  isPending,
  onCancel,
  onConfirm,
}: {
  readonly alias: MentionAlias;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <dialog
      open
      aria-labelledby="delete-mention-shortcut-title"
      onCancel={onCancel}
      className="tw-fixed tw-inset-0 tw-z-[1100] tw-m-0 tw-flex tw-h-full tw-max-h-none tw-w-full tw-max-w-none tw-items-center tw-justify-center tw-border-0 tw-bg-black/70 tw-p-4"
    >
      <div className="tw-w-full tw-max-w-md tw-rounded-xl tw-bg-iron-900 tw-p-5 tw-shadow-xl tw-ring-1 tw-ring-iron-700">
        <h2
          id="delete-mention-shortcut-title"
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white"
        >
          {t(locale, "user.mentionShortcuts.deleteTitle", {
            alias: alias.alias,
          })}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
          {t(locale, "user.mentionShortcuts.deleteWarning")}
        </p>
        <div className="tw-mt-5 tw-flex tw-justify-end tw-gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white"
          >
            {t(locale, "user.mentionShortcuts.cancel")}
          </button>
          <button
            type="button"
            disabled={isPending}
            aria-busy={isPending}
            onClick={onConfirm}
            className="tw-rounded-lg tw-border-0 tw-bg-red tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white disabled:tw-opacity-50"
          >
            {t(locale, "user.mentionShortcuts.delete")}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function AliasEditor({
  initialAlias,
  onClose,
}: {
  readonly initialAlias: MentionAlias | null;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const { setToast } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [alias, setAlias] = useState(initialAlias?.alias ?? "");
  const [members, setMembers] = useState<MentionAliasMember[]>(
    initialAlias?.members ?? []
  );
  const [search, setSearch] = useState("");
  const { identities } = useIdentitiesSearch({ handle: search, waveId: null });
  const normalizedAlias = normalizeMentionAlias(alias);
  const aliasIsValid = /^\w{3,15}$/.test(normalizedAlias);
  const reserved = isReservedMentionAlias(normalizedAlias);
  const aliasHasError = alias.length > 0 && (!aliasIsValid || reserved);
  const aliasErrorDescription = reserved
    ? "mention-shortcut-reserved-error"
    : !aliasIsValid && alias.length > 0
      ? "mention-shortcut-name-error"
      : undefined;
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
      onClose();
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

  const availableIdentities = getAvailableIdentities(identities, members);
  let searchStatus = t(locale, "user.mentionShortcuts.searchPrompt");
  if (search.length >= 3) {
    searchStatus =
      availableIdentities.length === 1
        ? t(locale, "user.mentionShortcuts.searchResult")
        : t(locale, "user.mentionShortcuts.searchResults", {
            count: availableIdentities.length,
          });
  }

  const addMember = (identity: ApiIdentity) => {
    const { id, handle } = identity;
    if (!id || !handle || members.length >= MAX_MEMBERS) return;
    setMembers((current) => [
      ...current,
      {
        profile_id: id,
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
      member_profile_ids: members.map((member) => member.profile_id),
    });
  };

  const removeMember = (profileId: string) => {
    setMembers((current) =>
      current.filter((item) => item.profile_id !== profileId)
    );
  };

  return (
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 sm:tw-p-5">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div>
          <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white">
            {initialAlias
              ? t(locale, "user.mentionShortcuts.edit")
              : t(locale, "user.mentionShortcuts.create")}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            {t(locale, "user.mentionShortcuts.editorDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200"
        >
          {t(locale, "user.mentionShortcuts.cancel")}
        </button>
      </div>

      <label
        htmlFor="mention-shortcut-name"
        className="tw-mt-5 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
      >
        <span>{t(locale, "user.mentionShortcuts.name")}</span>
        <div className="tw-mt-2 tw-flex tw-items-center tw-rounded-lg tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus-within:tw-ring-primary-400">
          <span aria-hidden="true" className="tw-pl-3 tw-text-iron-500">
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
            className="tw-w-full tw-border-0 tw-bg-transparent tw-px-1 tw-py-2.5 tw-text-sm tw-text-white tw-outline-none"
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

      <label
        htmlFor="mention-shortcut-profile-search"
        className="tw-mt-5 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
      >
        <span>
          {t(locale, "user.mentionShortcuts.addProfiles", {
            count: members.length,
            max: MAX_MEMBERS,
          })}
        </span>
        <input
          id="mention-shortcut-profile-search"
          aria-label={t(locale, "user.mentionShortcuts.searchLabel")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t(locale, "user.mentionShortcuts.searchPlaceholder")}
          autoComplete="off"
          className="tw-mt-2 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-text-sm tw-text-white tw-outline-none tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-ring-primary-400"
        />
      </label>
      <p aria-live="polite" className="tw-sr-only">
        {searchStatus}
      </p>
      {search.length >= 3 && availableIdentities.length > 0 && (
        <ul className="tw-mx-0 tw-mt-2 tw-list-none tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-iron-700">
          {availableIdentities.slice(0, 5).map((identity) => (
            <li key={identity.id}>
              <button
                type="button"
                onClick={() => addMember(identity)}
                className="tw-w-full tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-white desktop-hover:hover:tw-bg-iron-800"
              >
                @{identity.handle}
                {identity.display && (
                  <span className="tw-ml-2 tw-text-iron-500">
                    {identity.display}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2">
        {members.map((member) => (
          <button
            type="button"
            key={member.profile_id}
            onClick={() => removeMember(member.profile_id)}
            aria-label={t(locale, "user.mentionShortcuts.removeProfile", {
              handle: member.handle,
            })}
            className="tw-rounded-full tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800 tw-px-3 tw-py-1.5 tw-text-sm tw-text-iron-100"
          >
            @{member.handle} <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!canSave || mutation.isPending}
        onClick={save}
        className="tw-mt-5 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      >
        {mutation.isPending
          ? t(locale, "user.mentionShortcuts.saving")
          : t(locale, "user.mentionShortcuts.save")}
      </button>
    </section>
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
  const queryClient = useQueryClient();
  const { aliases, isPending, isError } = useMentionAliases();
  const [editorAlias, setEditorAlias] = useState<
    MentionAlias | null | undefined
  >();
  const [aliasToDelete, setAliasToDelete] = useState<MentionAlias | null>(null);
  const isOwner =
    !!profile.id && connectedProfile?.id === profile.id && !activeProfileProxy;

  const deleteMutation = useMutation({
    mutationFn: deleteMentionAlias,
    onSuccess: async (_, deletedId) => {
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.MENTION_ALIASES],
      });
      setToast({
        type: "success",
        message: t(locale, "user.mentionShortcuts.deleted"),
      });
      setAliasToDelete(null);
      setEditorAlias((current) =>
        current?.id === deletedId ? undefined : current
      );
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

  if (!isOwner) {
    return (
      <div className="tailwind-scope tw-py-8 tw-text-center tw-text-iron-400">
        {t(locale, "user.mentionShortcuts.private")}
      </div>
    );
  }

  return (
    <div className="tailwind-scope tw-mx-auto tw-max-w-3xl tw-py-6">
      {aliasToDelete && (
        <DeleteShortcutDialog
          alias={aliasToDelete}
          isPending={deleteMutation.isPending}
          onCancel={() => setAliasToDelete(null)}
          onConfirm={() => deleteMutation.mutate(aliasToDelete.id)}
        />
      )}
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div>
          <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white">
            {t(locale, "user.mentionShortcuts.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-2 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "user.mentionShortcuts.description")}
          </p>
        </div>
        {editorAlias === undefined && (
          <button
            type="button"
            onClick={() => setEditorAlias(null)}
            className="tw-shrink-0 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white"
          >
            {t(locale, "user.mentionShortcuts.new")}
          </button>
        )}
      </div>

      {editorAlias !== undefined && (
        <div className="tw-mt-6">
          <AliasEditor
            key={editorAlias?.id ?? "new"}
            initialAlias={editorAlias}
            onClose={() => setEditorAlias(undefined)}
          />
        </div>
      )}

      <div className="tw-mt-6 tw-space-y-3">
        <p aria-live="polite" className="tw-sr-only">
          {deleteMutation.isPending
            ? t(locale, "user.mentionShortcuts.deleting")
            : ""}
        </p>
        {isPending && (
          <p className="tw-text-sm tw-text-iron-400">
            {t(locale, "user.mentionShortcuts.loading")}
          </p>
        )}
        {isError && (
          <p role="alert" className="tw-text-sm tw-text-error">
            {t(locale, "user.mentionShortcuts.loadError")}
          </p>
        )}
        {!isPending && !isError && sortedAliases.length === 0 && (
          <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-8 tw-text-center tw-text-sm tw-text-iron-400">
            {t(locale, "user.mentionShortcuts.empty")}
          </div>
        )}
        {sortedAliases.map((item) => (
          <article
            key={item.id}
            className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4"
          >
            <div className="tw-min-w-0">
              <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-primary-300">
                @{item.alias}
              </h2>
              <p className="tw-mb-0 tw-mt-1 tw-truncate tw-text-sm tw-text-iron-400">
                {item.members.map((member) => `@${member.handle}`).join(" · ")}
              </p>
            </div>
            <div className="tw-flex tw-shrink-0 tw-gap-2">
              <button
                type="button"
                onClick={() => setEditorAlias(item)}
                className="tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100"
              >
                {t(locale, "user.mentionShortcuts.editAction")}
              </button>
              <button
                type="button"
                onClick={() => setAliasToDelete(item)}
                disabled={deleteMutation.isPending}
                aria-busy={deleteMutation.isPending}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-red/40 tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-red disabled:tw-opacity-50"
              >
                {t(locale, "user.mentionShortcuts.deleteAction")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
