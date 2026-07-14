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

const MAX_MEMBERS = 25;

function AliasEditor({
  initialAlias,
  onClose,
}: {
  readonly initialAlias: MentionAlias | null;
  readonly onClose: () => void;
}) {
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
  const canSave = aliasIsValid && !reserved && members.length > 0;

  const mutation = useMutation({
    mutationFn: async (input: MentionAliasInput) =>
      initialAlias
        ? updateMentionAlias(initialAlias.id, input)
        : createMentionAlias(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QueryKey.MENTION_ALIASES] });
      setToast({
        type: "success",
        message: initialAlias
          ? "Mention shortcut updated."
          : "Mention shortcut created.",
      });
      onClose();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't save mention shortcut.",
        details: getToastErrorDetails(error, "Unable to save mention shortcut"),
      });
    },
  });

  const availableIdentities = identities.filter(
    (identity) =>
      !!identity.id &&
      !!identity.handle &&
      !members.some((member) => member.profile_id === identity.id)
  );

  const addMember = (identity: ApiIdentity) => {
    if (!identity.id || !identity.handle || members.length >= MAX_MEMBERS) return;
    setMembers((current) => [
      ...current,
      {
        profile_id: identity.id!,
        handle: identity.handle!,
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

  return (
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 sm:tw-p-5">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div>
          <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white">
            {initialAlias ? "Edit shortcut" : "Create shortcut"}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            It expands into ordinary profile mentions before a message is sent.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200"
        >
          Cancel
        </button>
      </div>

      <label className="tw-mt-5 tw-block tw-text-sm tw-font-medium tw-text-iron-200">
        Shortcut name
        <div className="tw-mt-2 tw-flex tw-items-center tw-rounded-lg tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus-within:tw-ring-primary-400">
          <span className="tw-pl-3 tw-text-iron-500">@</span>
          <input
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            maxLength={15}
            autoComplete="off"
            className="tw-w-full tw-border-0 tw-bg-transparent tw-px-1 tw-py-2.5 tw-text-sm tw-text-white tw-outline-none"
          />
        </div>
      </label>
      {!aliasIsValid && alias.length > 0 && (
        <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-error">
          Use 3–15 letters, numbers, or underscores.
        </p>
      )}
      {reserved && (
        <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-error">
          @{normalizedAlias} is reserved for a global mention.
        </p>
      )}

      <label className="tw-mt-5 tw-block tw-text-sm tw-font-medium tw-text-iron-200">
        Add profiles ({members.length}/{MAX_MEMBERS})
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by handle"
          autoComplete="off"
          className="tw-mt-2 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-text-sm tw-text-white tw-outline-none tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-ring-primary-400"
        />
      </label>
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
            onClick={() =>
              setMembers((current) =>
                current.filter((item) => item.profile_id !== member.profile_id)
              )
            }
            aria-label={`Remove @${member.handle}`}
            className="tw-rounded-full tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800 tw-px-3 tw-py-1.5 tw-text-sm tw-text-iron-100"
          >
            @{member.handle} ×
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!canSave || mutation.isPending}
        onClick={save}
        className="tw-mt-5 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      >
        {mutation.isPending ? "Saving…" : "Save shortcut"}
      </button>
    </section>
  );
}

export default function UserPageMentionShortcuts({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);
  const queryClient = useQueryClient();
  const { aliases, isPending, isError } = useMentionAliases();
  const [editorAlias, setEditorAlias] = useState<MentionAlias | null | undefined>();
  const isOwner =
    !!profile.id && connectedProfile?.id === profile.id && !activeProfileProxy;

  const deleteMutation = useMutation({
    mutationFn: deleteMentionAlias,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QueryKey.MENTION_ALIASES] });
      setToast({ type: "success", message: "Mention shortcut deleted." });
    },
    onError: (error) =>
      setToast({
        type: "error",
        title: "Couldn't delete mention shortcut.",
        details: getToastErrorDetails(error, "Unable to delete mention shortcut"),
      }),
  });

  const sortedAliases = useMemo(
    () => [...aliases].sort((a, b) => a.alias.localeCompare(b.alias)),
    [aliases]
  );

  if (!isOwner) {
    return (
      <div className="tailwind-scope tw-py-8 tw-text-center tw-text-iron-400">
        Mention shortcuts are private to their profile owner.
      </div>
    );
  }

  return (
    <div className="tailwind-scope tw-mx-auto tw-max-w-3xl tw-py-6">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div>
          <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white">
            Mention shortcuts
          </h1>
          <p className="tw-mb-0 tw-mt-2 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-iron-400">
            Create private shortcuts such as @frens. In a composer, the shortcut
            expands inline into the selected profile handles.
          </p>
        </div>
        {editorAlias === undefined && (
          <button
            type="button"
            onClick={() => setEditorAlias(null)}
            className="tw-shrink-0 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white"
          >
            New shortcut
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
        {isPending && <p className="tw-text-sm tw-text-iron-400">Loading…</p>}
        {isError && (
          <p role="alert" className="tw-text-sm tw-text-error">
            Mention shortcuts could not be loaded.
          </p>
        )}
        {!isPending && !isError && sortedAliases.length === 0 && (
          <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-8 tw-text-center tw-text-sm tw-text-iron-400">
            You have no mention shortcuts yet.
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
                Edit
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-red/40 tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-red disabled:tw-opacity-50"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
