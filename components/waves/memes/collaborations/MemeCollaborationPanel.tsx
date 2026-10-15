"use client";

import { MemeCollaboratorPicker } from "./MemeCollaboratorPicker";
import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";
import type { ApiMemeCollaborationInviteRequest } from "@/generated/models/ApiMemeCollaborationInviteRequest";
import { useId, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiMemeCollaborationState } from "@/generated/models/ApiMemeCollaborationState";
import {
  ApiMemeCollaborationResponseRequestActionEnum,
  type ApiMemeCollaborationResponseRequest,
} from "@/generated/models/ApiMemeCollaborationResponseRequest";
import {
  ApiMemeCollaborationInvitationStatusEnum,
  type ApiMemeCollaborationInvitation,
} from "@/generated/models/ApiMemeCollaborationInvitation";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

const STATUS_MESSAGES = {
  PENDING: "memes.collaborations.pending",
  ACCEPTED: "memes.collaborations.accepted",
  DECLINED: "memes.collaborations.declined",
  CANCELLED: "memes.collaborations.cancelled",
  CLOSED: "memes.collaborations.closed",
} as const;
const BUTTON_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border tw-border-iron-600 tw-bg-iron-800 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 disabled:tw-opacity-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

function reviewMediaUrls(state: ApiMemeCollaborationState): string[] {
  return [state.artwork?.image_url, state.artwork?.animation_url]
    .filter((url): url is string => !!url)
    .map(resolveIpfsUrlSync)
    .filter((url) => {
      try {
        return ["https:", "http:"].includes(
          new URL(url, "https://6529.io").protocol
        );
      } catch {
        return false;
      }
    });
}

export function MemeCollaborationPanel({
  dropId,
  authorId,
}: {
  readonly dropId: string;
  readonly authorId: string;
}) {
  const { connectedProfile, requestAuth, setToast } = useAuth();
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const headingId = useId();
  const queryKey = [
    QueryKey.DROP,
    "collaborations",
    dropId,
    connectedProfile?.id,
  ];
  const { data, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      commonApiFetch<ApiMemeCollaborationState>({
        endpoint: `drops/${dropId}/collaborations`,
      }),
    enabled: !!connectedProfile?.id,
  });
  const reviewVersion = data
    ? `${connectedProfile?.id ?? ""}:${dropId}:${data.artwork_hash}:${data.terms_version}`
    : null;
  const [confirmedVersion, setConfirmedVersion] = useState<string | null>(null);
  const confirmed =
    reviewVersion !== null && confirmedVersion === reviewVersion;
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<ApiMemeCollaboratorProfile[]>([]);
  const invite = async () => {
    if (!data?.can_invite || saving || !selected.length) return;
    setSaving(true);
    try {
      const { success } = await requestAuth();
      if (!success) return;
      const updated = await commonApiPost<
        ApiMemeCollaborationInviteRequest,
        ApiMemeCollaborationState
      >({
        endpoint: `drops/${dropId}/collaborations`,
        body: { collaborator_ids: selected.map((profile) => profile.id) },
      });
      queryClient.setQueryData(queryKey, updated);
      setSelected([]);
      setToast({
        message: t(locale, "memes.collaborations.invited"),
        type: "success",
      });
    } catch {
      void refetch();
      setToast({
        message: t(locale, "memes.collaborations.saveError"),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };
  const respond = async (
    invitation: ApiMemeCollaborationInvitation,
    action: ApiMemeCollaborationResponseRequestActionEnum
  ) => {
    if (
      !data ||
      saving ||
      (action === ApiMemeCollaborationResponseRequestActionEnum.Accept &&
        !confirmed)
    )
      return;
    setSaving(true);
    try {
      const { success } = await requestAuth();
      if (!success) return;
      const updated = await commonApiPost<
        ApiMemeCollaborationResponseRequest,
        ApiMemeCollaborationState
      >({
        endpoint: `drops/${dropId}/collaborations/${invitation.id}/response`,
        body: {
          action,
          artwork_hash: data.artwork_hash,
          terms_version: data.terms_version,
        },
      });
      queryClient.setQueryData(queryKey, updated);
      setConfirmedVersion(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QueryKey.DROP] }),
        queryClient.invalidateQueries({ queryKey: [QueryKey.PROFILE] }),
      ]);
      setToast({
        message: t(locale, "memes.collaborations.saved"),
        type: "success",
      });
    } catch {
      setConfirmedVersion(null);
      void refetch();
      setToast({
        message: t(locale, "memes.collaborations.saveError"),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };
  if (!connectedProfile) return null;
  if (error)
    return (
      <div role="alert" className="tw-mt-4 tw-space-y-2">
        <p>{t(locale, "memes.collaborations.loadError")}</p>
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => {
            void refetch();
          }}
        >
          {t(locale, "memes.collaborations.retry")}
        </button>
      </div>
    );
  if (
    !data ||
    (!data.can_invite && (!data.managed || !data.invitations.length))
  )
    return null;
  const isAuthor = connectedProfile.id === authorId;
  const ownPending =
    data.invitations.some(
      (item) =>
        item.profile.id === connectedProfile.id &&
        item.status === ApiMemeCollaborationInvitationStatusEnum.Pending
    ) && !data.closed;
  return (
    <section
      aria-labelledby={headingId}
      className="tw-mt-5 tw-space-y-3 tw-rounded-lg tw-border tw-border-iron-700 tw-p-4"
    >
      <h2
        id={headingId}
        className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
      >
        {t(locale, "memes.collaborations.invitations")}
      </h2>
      {isAuthor && data.can_invite && !data.closed && (
        <div className="tw-space-y-3">
          <MemeCollaboratorPicker
            collaborators={selected}
            onChange={setSelected}
            excludedIds={data.invitations.map((item) => item.profile.id)}
            disabled={saving}
          />
          <button
            type="button"
            className={BUTTON_CLASS}
            disabled={saving || !selected.length}
            onClick={() => {
              void invite();
            }}
          >
            {t(locale, "memes.collaborations.sendInvitations")}
          </button>
        </div>
      )}
      {ownPending && (
        <>
          {data.artwork && (
            <div className="tw-space-y-2 tw-text-sm tw-text-iron-200">
              <p className="tw-font-semibold">{data.artwork.name}</p>
              <p className="tw-whitespace-pre-wrap">
                {data.artwork.description}
              </p>
              {reviewMediaUrls(data).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-block tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                >
                  {t(locale, "memes.collaborations.reviewMedia")}
                </a>
              ))}
            </div>
          )}
          <p className="tw-text-sm tw-text-iron-200">{data.acceptance_copy}</p>
          <p className="tw-text-sm tw-text-iron-200">
            {t(locale, "memes.collaborations.final")}
          </p>
          {data.terms && (
            <details>
              <summary className="tw-cursor-pointer tw-text-sm tw-text-iron-100">
                {t(locale, "memes.collaborations.terms")}
              </summary>
              <p className="tw-whitespace-pre-wrap tw-text-sm tw-text-iron-200">
                {data.terms}
              </p>
            </details>
          )}
          <label className="tw-flex tw-min-h-11 tw-items-start tw-gap-3 tw-text-sm tw-text-iron-100">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) =>
                setConfirmedVersion(event.target.checked ? reviewVersion : null)
              }
              className="tw-mt-1"
            />
            {t(locale, "memes.collaborations.confirm")}
          </label>
        </>
      )}
      <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
        {data.invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="tw-flex tw-flex-wrap tw-items-center tw-gap-3"
          >
            <span className="tw-text-sm tw-text-iron-100">
              @{invitation.profile.handle}
            </span>
            <span
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="tw-text-sm tw-text-iron-300"
            >
              <span className="tw-sr-only">@{invitation.profile.handle}: </span>
              {t(locale, STATUS_MESSAGES[invitation.status])}
            </span>
            {!data.closed &&
              invitation.status ===
                ApiMemeCollaborationInvitationStatusEnum.Pending &&
              isAuthor && (
                <button
                  type="button"
                  className={BUTTON_CLASS}
                  disabled={saving}
                  onClick={() => {
                    void respond(
                      invitation,
                      ApiMemeCollaborationResponseRequestActionEnum.Cancel
                    );
                  }}
                >
                  {t(locale, "memes.collaborations.cancel")}
                </button>
              )}
            {!data.closed &&
              invitation.status ===
                ApiMemeCollaborationInvitationStatusEnum.Pending &&
              !isAuthor &&
              invitation.profile.id === connectedProfile.id && (
                <>
                  <button
                    type="button"
                    className={BUTTON_CLASS}
                    disabled={saving || !confirmed}
                    onClick={() => {
                      void respond(
                        invitation,
                        ApiMemeCollaborationResponseRequestActionEnum.Accept
                      );
                    }}
                  >
                    {t(locale, "memes.collaborations.accept")}
                  </button>
                  <button
                    type="button"
                    className={BUTTON_CLASS}
                    disabled={saving}
                    onClick={() => {
                      void respond(
                        invitation,
                        ApiMemeCollaborationResponseRequestActionEnum.Decline
                      );
                    }}
                  >
                    {t(locale, "memes.collaborations.decline")}
                  </button>
                </>
              )}
          </li>
        ))}
      </ul>
    </section>
  );
}
