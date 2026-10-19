"use client";

import { MemeCollaborationManageDialog } from "./MemeCollaborationManageDialog";
import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";
import type { ApiMemeCollaborationInviteRequest } from "@/generated/models/ApiMemeCollaborationInviteRequest";
import { useState } from "react";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useMemeCollaborationRealtime } from "./useMemeCollaborationRealtime";
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

const RECIPIENT_STATUS_MESSAGES = {
  PENDING: "memes.collaborations.pending",
  ACCEPTED: "memes.collaborations.accepted",
  DECLINED: "memes.collaborations.recipientDeclined",
  CANCELLED: "memes.collaborations.recipientCancelled",
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
  const [managing, setManaging] = useState(false);
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
  useMemeCollaborationRealtime(dropId, connectedProfile?.id ?? undefined);
  const reviewVersion = data
    ? `${connectedProfile?.id ?? ""}:${dropId}:${data.artwork_hash}:${data.terms_version}`
    : null;
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<ApiMemeCollaboratorProfile[]>([]);
  const invite = async (profiles = selected) => {
    if (!data?.can_invite || saving || !profiles.length) return;
    setSaving(true);
    try {
      const { success } = await requestAuth();
      if (!success) return;
      const updated = await commonApiPost<
        ApiMemeCollaborationInviteRequest,
        ApiMemeCollaborationState
      >({
        endpoint: `drops/${dropId}/collaborations`,
        body: { collaborator_ids: profiles.map((profile) => profile.id) },
      });
      queryClient.setQueryData(queryKey, updated);
      setSelected((current) =>
        current.filter(
          (item) => !profiles.some((profile) => profile.id === item.id)
        )
      );
      setToast({
        message: t(locale, "memes.collaborations.invited"),
        type: "success",
      });
    } catch (invitationError) {
      void refetch();
      setToast({
        message:
          getToastErrorDetails(invitationError) ??
          t(locale, "memes.collaborations.saveError"),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };
  const respond = async (
    invitation: ApiMemeCollaborationInvitation,
    action: ApiMemeCollaborationResponseRequestActionEnum,
    consent?: {
      artwork_hash: string;
      terms_version: string;
      artist_name: string;
    }
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
          ...(action === ApiMemeCollaborationResponseRequestActionEnum.Accept &&
          consent
            ? { artist_name: consent.artist_name }
            : {}),
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
    <div className="tailwind-scope tw-mt-6 tw-space-y-3">
      {isAuthor ? (
        <>
          <Button
            variant="secondary"
            size={null}
            className="tw-h-auto tw-min-h-9 tw-max-w-full tw-whitespace-normal tw-px-3 tw-py-2 tw-text-sm !tw-font-normal"
            aria-haspopup="dialog"
            onClick={() => setManaging(true)}
          >
            {t(locale, "memes.collaborations.manage")}
            {!!pendingCount && (
              <span className="tw-text-iron-400">
                ·{" "}
                {t(locale, "memes.collaborations.pendingCount", {
                  count: pendingCount,
                })}
              </span>
            )}
          </Button>
          {managing && (
            <MemeCollaborationManageDialog
              state={data}
              canInvite={canInvite}
              saving={saving}
              selected={selected}
              onSelectionChange={setSelected}
              onClose={() => setManaging(false)}
              onInvite={() => {
                void invite();
              }}
              onReinvite={(profile) => {
                void invite([profile]);
              }}
              onCancel={(invitation) => {
                void respond(
                  invitation,
                  ApiMemeCollaborationResponseRequestActionEnum.Cancel
                );
              }}
            />
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
                {t(locale, RECIPIENT_STATUS_MESSAGES[ownInvitation.status])}
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
          initialArtistName={connectedProfile.handle ?? ""}
          onClose={() => setReviewingId(null)}
          onAccept={(artistName) => {
            void respond(
              ownInvitation,
              ApiMemeCollaborationResponseRequestActionEnum.Accept,
              {
                artwork_hash: data.artwork_hash,
                terms_version: data.terms_version,
                artist_name: artistName,
              }
            );
          }}
        />
      )}
    </div>
  );
}
