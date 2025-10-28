import { useMemo } from "react";
import { useWaveData } from "@/hooks/useWaveData";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import { useAuth } from "@/components/auth/Auth";
import { isGroupAuthor as computeIsGroupAuthor } from "@/components/waves/specs/groups/group/edit/buttons/utils/waveGroupEdit";
import { ApiWaveScope } from "@/generated/models/ApiWaveScope";
import { ApiGroup } from "@/generated/models/ApiGroup";
import { ApiWave } from "@/generated/models/ApiWave";
import { ApiIdentity } from "@/generated/models/ApiIdentity";

interface WaveScopeSummary {
  readonly hasGroup: boolean;
  readonly group: ApiGroup | null;
  readonly isGroupAuthor: boolean;
  /** Convenience flag: true when the user created the group or there is no group yet */
  readonly isGroupAuthorOrNoGroup: boolean;
}

interface UseWaveScopePermissionsResult {
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isWaveAdmin: boolean;
  readonly hasEligibility: boolean;
  readonly eligibilityUpdatedAt: number | null;
  readonly wave: ApiWave | undefined;
  readonly scopes: {
    readonly view: WaveScopeSummary;
    readonly drop: WaveScopeSummary;
    readonly vote: WaveScopeSummary;
    readonly chat: WaveScopeSummary;
  } | null;
}

const buildScopeSummary = (
  scope: ApiWaveScope,
  connectedProfile: ApiIdentity | null
): WaveScopeSummary => {
  const group = scope.group ?? null;
  const hasGroup = group !== null;
  const isGroupAuthor = computeIsGroupAuthor(group, connectedProfile);

  return {
    hasGroup,
    group,
    isGroupAuthor,
    isGroupAuthorOrNoGroup: isGroupAuthor || !hasGroup,
  };
};

export function useWaveScopePermissions(
  waveId: string | null | undefined = null
): UseWaveScopePermissionsResult {
  const { data: wave, isLoading, isFetching } = useWaveData({
    waveId: waveId ?? null,
  });
  const { getEligibility } = useWaveEligibility();
  const { connectedProfile } = useAuth();

  const eligibility = waveId ? getEligibility(waveId) : null;

  const scopes = useMemo(() => {
    if (!wave) {
      return null;
    }

    return {
      view: buildScopeSummary(
        wave.visibility.scope,
        connectedProfile
      ),
      drop: buildScopeSummary(
        wave.participation.scope,
        connectedProfile
      ),
      vote: buildScopeSummary(
        wave.voting.scope,
        connectedProfile
      ),
      chat: buildScopeSummary(
        wave.chat.scope,
        connectedProfile
      ),
    };
  }, [wave, connectedProfile, connectedProfile?.id, connectedProfile?.handle]);

  const isWaveAdmin = eligibility?.authenticated_user_admin ?? false;

  return {
    isLoading,
    isFetching,
    isWaveAdmin,
    hasEligibility: !!eligibility,
    eligibilityUpdatedAt: eligibility?.lastUpdated ?? null,
    wave,
    scopes,
  };
}

export default useWaveScopePermissions;
