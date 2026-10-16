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
import Button from "@/components/utils/button/Button";
import { MemeCollaborationReviewDialog } from "./MemeCollaborationReviewDialog";

const STATUS_MESSAGES = {
  PENDING: "memes.collaborations.pending",
  ACCEPTED: "memes.collaborations.accepted",
  DECLINED: "memes.collaborations.declined",
  CANCELLED: "memes.collaborations.cancelled",
  CLOSED: "memes.collaborations.closed",
} as const;
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
  const invitationsId = useId();
  const [expanded, setExpanded] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
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
      setExpanded(true);
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
    action: ApiMemeCollaborationResponseRequestActionEnum,
    consent?: { artwork_hash: string; terms_version: string }
  ) => {
    if (
      !data ||
      saving ||
      (action === ApiMemeCollaborationResponseRequestActionEnum.Accept &&
        (consent?.artwork_hash !== data.artwork_hash ||
          consent.terms_version !== data.terms_version))
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
      setReviewingId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QueryKey.DROP] }),
        queryClient.invalidateQueries({ queryKey: [QueryKey.PROFILE] }),
      ]);
      setToast({
        message: t(locale, "memes.collaborations.saved"),
        type: "success",
      });
    } catch {
      setReviewingId(null);
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
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void refetch();
          }}
        >
          {t(locale, "memes.collaborations.retry")}
        </Button>
      </div>
    );
  const isAuthor = connectedProfile.id === authorId;
  if (!data) return null;
  const ownInvitation = data.invitations.find(
    (item) => item.profile.id === connectedProfile.id
  );
  const ownPending =
    ownInvitation?.status ===
      ApiMemeCollaborationInvitationStatusEnum.Pending && !data.closed;
  const canInvite = isAuthor && !!data.can_invite && !data.closed;
  if (isAuthor && !canInvite && !data.invitations.length) return null;
  if (
    !isAuthor &&
    (!ownInvitation ||
      ownInvitation.status ===
        ApiMemeCollaborationInvitationStatusEnum.Accepted)
  )
    return null;
  const pendingCount = data.invitations.filter(
    (item) => item.status === ApiMemeCollaborationInvitationStatusEnum.Pending
  ).length;
  return (
    <div className="tw-mt-4 tw-space-y-3">
      {isAuthor ? (
        <>
          {!!data.invitations.length && (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={expanded}
              aria-controls={invitationsId}
              onClick={() => setExpanded((value) => !value)}
            >
              {t(locale, "memes.collaborations.manage", {
                count: data.invitations.length,
              })}
              {!!pendingCount && (
                <span className="tw-text-iron-400">
                  {t(locale, "memes.collaborations.pendingCount", {
                    count: pendingCount,
                  })}
                </span>
              )}
            </Button>
          )}
          <div id={invitationsId} hidden={!expanded}>
            <ul
              aria-label={t(locale, "memes.collaborations.invitations")}
              className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0"
            >
              {data.invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-sm"
                >
                  <span className="tw-text-iron-100">
                    @{invitation.profile.handle}
                  </span>
                  <output
                    aria-live="polite"
                    aria-atomic="true"
                    className="tw-text-iron-400"
                  >
                    <span className="tw-sr-only">
                      @{invitation.profile.handle}:{" "}
                    </span>
                    {t(locale, STATUS_MESSAGES[invitation.status])}
                  </output>
                  {!data.closed &&
                    invitation.status ===
                      ApiMemeCollaborationInvitationStatusEnum.Pending && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={saving}
                        onClick={() => {
                          void respond(
                            invitation,
                            ApiMemeCollaborationResponseRequestActionEnum.Cancel
                          );
                        }}
                      >
                        {t(locale, "memes.collaborations.cancel")}
                      </Button>
                    )}
                </li>
              ))}
            </ul>
          </div>
          {canInvite && (
            <div className="tw-space-y-3">
              <MemeCollaboratorPicker
                collaborators={selected}
                onChange={setSelected}
                excludedIds={data.invitations.map((item) => item.profile.id)}
                disabled={saving}
              />
              {!!selected.length && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  onClick={() => {
                    void invite();
                  }}
                >
                  {t(locale, "memes.collaborations.sendInvitations")}
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-text-sm">
          {ownPending ? (
            <>
              <span className="tw-text-iron-300">
                {t(locale, "memes.collaborations.invitedYou")}
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={saving}
                onClick={() => setReviewingId(ownInvitation.id)}
              >
                {t(locale, "memes.collaborations.review")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={saving}
                onClick={() => {
                  void respond(
                    ownInvitation,
                    ApiMemeCollaborationResponseRequestActionEnum.Decline
                  );
                }}
              >
                {t(locale, "memes.collaborations.decline")}
              </Button>
            </>
          ) : (
            ownInvitation && (
              <output className="tw-text-iron-400">
                {t(locale, STATUS_MESSAGES[ownInvitation.status])}
              </output>
            )
          )}
        </div>
      )}
      {ownPending && ownInvitation.id === reviewingId && (
        <MemeCollaborationReviewDialog
          key={reviewVersion}
          state={data}
          saving={saving}
          onClose={() => setReviewingId(null)}
          onAccept={() => {
            void respond(
              ownInvitation,
              ApiMemeCollaborationResponseRequestActionEnum.Accept,
              {
                artwork_hash: data.artwork_hash,
                terms_version: data.terms_version,
              }
            );
          }}
        />
      )}
    </div>
  );
}
