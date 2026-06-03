import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";

interface WaveDetailsLike {
  readonly chat?:
    | {
        readonly scope?:
          | {
              readonly group?:
                | {
                    readonly is_direct_message?: boolean | undefined;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | undefined;
  readonly visibility?:
    | {
        readonly scope?:
          | {
              readonly group?:
                | { readonly id?: string | undefined }
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | undefined;
}

interface MinimalWaveLike {
  readonly id: string;
}

export interface ApiWaveMinWithChatLinkSettings extends ApiWaveMin {
  readonly links_disabled?: boolean | undefined;
  readonly wave_author_handle?: string | null | undefined;
}

export const normalizeOptionalWaveId = (
  waveId: string | null | undefined
): string | null => {
  const normalizedWaveId = waveId?.trim() ?? null;
  return normalizedWaveId === "" ? null : normalizedWaveId;
};

export const isWaveDirectMessage = (
  waveId: string,
  waveDetails?: WaveDetailsLike,
  directMessageWaves: ReadonlyArray<MinimalWaveLike> = []
): boolean => {
  if (directMessageWaves.some((wave) => wave.id === waveId)) {
    return true;
  }

  return waveDetails?.chat?.scope?.group?.is_direct_message ?? false;
};

export const isPublicNonDirectMessageWave = (
  wave?: WaveDetailsLike | null
): boolean =>
  Boolean(
    wave &&
    !wave.chat?.scope?.group?.is_direct_message &&
    !wave.visibility?.scope?.group?.id
  );

export const toApiWaveMin = (wave: ApiWave): ApiWaveMin => {
  const waveMin: ApiWaveMinWithChatLinkSettings = {
    id: wave.id,
    name: wave.name,
    picture: wave.picture,
    description_drop_id: wave.description_drop.id,
    last_drop_time: wave.last_drop_time,
    authenticated_user_eligible_to_vote:
      wave.voting.authenticated_user_eligible,
    authenticated_user_eligible_to_participate:
      wave.participation.authenticated_user_eligible,
    authenticated_user_eligible_to_chat: wave.chat.authenticated_user_eligible,
    authenticated_user_admin: wave.wave.authenticated_user_eligible_for_admin,
    visibility_group_id: wave.visibility.scope.group?.id ?? null,
    participation_group_id: wave.participation.scope.group?.id ?? null,
    chat_group_id: wave.chat.scope.group?.id ?? null,
    voting_group_id: wave.voting.scope.group?.id ?? null,
    admin_group_id: wave.wave.admin_group.group?.id ?? null,
    voting_period_start: wave.voting.period?.min ?? null,
    voting_period_end: wave.voting.period?.max ?? null,
    voting_credit_type: wave.voting.credit_type,
    admin_drop_deletion_enabled: wave.wave.admin_drop_deletion_enabled,
    forbid_negative_votes: wave.voting.forbid_negative_votes,
    pinned: wave.pinned,
    identity_wave: wave.identity_wave,
    submission_type: wave.participation.submission_strategy?.type ?? null,
    voting_credit_nfts: wave.voting.credit_nfts,
    links_disabled: wave.chat.links_disabled,
    wave_author_handle: wave.author.handle ?? null,
    voting_credit_scope: wave.voting.credit_scope,
  };

  return waveMin;
};
