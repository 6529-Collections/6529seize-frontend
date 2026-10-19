"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Button from "@/components/utils/button/Button";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import type { ApiMemeCollaborationState } from "@/generated/models/ApiMemeCollaborationState";
import {
  ApiMemeCollaborationInvitationStatusEnum,
  type ApiMemeCollaborationInvitation,
} from "@/generated/models/ApiMemeCollaborationInvitation";
import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { MemeCollaboratorPicker } from "./MemeCollaboratorPicker";

const STATUS_MESSAGES = {
  PENDING: "memes.collaborations.pending",
  ACCEPTED: "memes.collaborations.accepted",
  DECLINED: "memes.collaborations.declined",
  CANCELLED: "memes.collaborations.cancelled",
  CLOSED: "memes.collaborations.closed",
} as const;

export function MemeCollaborationManageDialog({
  state,
  canInvite,
  saving,
  selected,
  onSelectionChange,
  onClose,
  onInvite,
  onCancel,
  onReinvite,
}: {
  readonly state: ApiMemeCollaborationState;
  readonly canInvite: boolean;
  readonly saving: boolean;
  readonly selected: ApiMemeCollaboratorProfile[];
  readonly onSelectionChange: (profiles: ApiMemeCollaboratorProfile[]) => void;
  readonly onClose: () => void;
  readonly onInvite: () => void;
  readonly onReinvite: (profile: ApiMemeCollaboratorProfile) => void;
  readonly onCancel: (invitation: ApiMemeCollaborationInvitation) => void;
}) {
  const occupiedCount = state.invitations.filter(
    (item) =>
      item.status === ApiMemeCollaborationInvitationStatusEnum.Pending ||
      item.status === ApiMemeCollaborationInvitationStatusEnum.Accepted
  ).length;
  const locale = useBrowserLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  return (
    <Dialog
      open
      initialFocus={headingRef}
      onClose={() => {
        if (!saving) onClose();
      }}
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000001]"
    >
      <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-600/60 tw-backdrop-blur-[1px]" />
      <div className="tw-fixed tw-inset-0 tw-flex tw-items-end tw-justify-center tw-overflow-hidden tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:tw-items-center sm:tw-p-4">
        <DialogPanel className="tw-flex tw-max-h-full tw-w-full tw-max-w-xl tw-flex-col tw-overflow-hidden tw-rounded-t-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-2xl sm:tw-max-h-[calc(100dvh-2rem)] sm:tw-rounded-xl">
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-p-5">
            <div className="tw-min-w-0">
              <DialogTitle
                ref={headingRef}
                tabIndex={-1}
                className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100"
              >
                {t(locale, "memes.collaborations.manage")}
              </DialogTitle>
              {state.artwork && (
                <p className="tw-mb-0 tw-mt-1 tw-break-words tw-text-sm tw-text-iron-400">
                  {state.artwork.name}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size={null}
              className="tw-size-11"
              disabled={saving}
              aria-label={t(locale, "memes.collaborations.closeManage")}
              onClick={onClose}
            >
              <XMarkIcon aria-hidden="true" className="tw-size-5" />
            </Button>
          </div>
          <div className="tw-min-h-0 tw-space-y-5 tw-overflow-y-auto tw-overscroll-contain tw-p-5">
            {state.invitations.length ? (
              <ul
                aria-label={t(locale, "memes.collaborations.invitations")}
                className="tw-m-0 tw-list-none tw-space-y-4 tw-p-0"
              >
                {state.invitations.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-text-sm"
                  >
                    <ProfileAvatar
                      pfpUrl={invitation.profile.pfp}
                      size={ProfileBadgeSize.SMALL}
                      alt=""
                    />
                    <div className="tw-min-w-0 tw-flex-1">
                      <span className="tw-break-all tw-font-semibold tw-text-iron-100">
                        @{invitation.profile.handle}
                      </span>
                      <output
                        aria-live="polite"
                        aria-atomic="true"
                        className="tw-block tw-text-iron-400"
                      >
                        <span className="tw-sr-only">
                          @{invitation.profile.handle}:{" "}
                        </span>
                        {t(locale, STATUS_MESSAGES[invitation.status])}
                      </output>
                    </div>
                    {canInvite &&
                      invitation.status ===
                        ApiMemeCollaborationInvitationStatusEnum.Cancelled && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={
                            saving ||
                            selected.length + occupiedCount >= 5 ||
                            selected.some(
                              (item) => item.id === invitation.profile.id
                            )
                          }
                          onClick={() => onReinvite(invitation.profile)}
                        >
                          {t(locale, "memes.collaborations.inviteAgain")}
                        </Button>
                      )}
                    {!state.closed &&
                      invitation.status ===
                        ApiMemeCollaborationInvitationStatusEnum.Pending && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={saving}
                          onClick={() => onCancel(invitation)}
                        >
                          {t(locale, "memes.collaborations.cancel")}
                        </Button>
                      )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tw-m-0 tw-text-sm tw-text-iron-400">
                {t(locale, "memes.collaborations.emptyInvitations")}
              </p>
            )}
            {canInvite && (
              <div className="tw-space-y-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5">
                <MemeCollaboratorPicker
                  collaborators={selected}
                  onChange={onSelectionChange}
                  excludedIds={state.invitations
                    .filter(
                      (item) =>
                        item.status !==
                        ApiMemeCollaborationInvitationStatusEnum.Cancelled
                    )
                    .map((item) => item.profile.id)}
                  declinedIds={state.invitations
                    .filter(
                      (item) =>
                        item.status ===
                        ApiMemeCollaborationInvitationStatusEnum.Declined
                    )
                    .map((item) => item.profile.id)}
                  occupiedCount={occupiedCount}
                  disabled={saving}
                  compact
                />
                {!!selected.length && (
                  <Button
                    variant="primary"
                    size="md"
                    loading={saving}
                    onClick={onInvite}
                  >
                    {t(locale, "memes.collaborations.sendInvitations")}
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="tw-flex tw-shrink-0 tw-justify-end tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-px-5 tw-pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] tw-pt-4 sm:tw-pb-4">
            <Button
              variant="secondary"
              size="md"
              disabled={saving}
              onClick={onClose}
            >
              {t(locale, "memes.collaborations.done")}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
