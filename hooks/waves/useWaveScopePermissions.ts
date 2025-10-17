import { useMemo } from "react";
import { useWaveData } from "@/hooks/useWaveData";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import { useAuth } from "@/components/auth/Auth";
import { ApiWaveScope } from "@/generated/models/ApiWaveScope";
import { ApiGroup } from "@/generated/models/ApiGroup";
import { ApiWave } from "@/generated/models/ApiWave";

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
  currentProfileId: string | number | null,
  currentProfileHandle: string | null
): WaveScopeSummary => {
  const group = scope.group ?? null;
  const hasGroup = group !== null;
  const matchesId =
    hasGroup &&
    group.author?.id !== undefined &&
    group.author?.id !== null &&
    currentProfileId !== null &&
    String(group.author.id) === String(currentProfileId);
  const matchesHandle =
    hasGroup &&
    !!currentProfileHandle &&
    !!group.author?.handle &&
    group.author.handle === currentProfileHandle;
  const isGroupAuthor = hasGroup ? matchesId || matchesHandle : false;

  return {
    hasGroup,
    group,
    isGroupAuthor,
    isGroupAuthorOrNoGroup: isGroupAuthor || !hasGroup,
  };
};

export function useWaveScopePermissions(
  waveId: string | null | undefined
): UseWaveScopePermissionsResult {
  const normalizedWaveId = waveId ?? null;
  const { data: wave, isLoading, isFetching } = useWaveData({
    waveId: normalizedWaveId,
  });
  const { getEligibility } = useWaveEligibility();
  const { connectedProfile } = useAuth();

  const eligibility = normalizedWaveId
    ? getEligibility(normalizedWaveId)
    : null;
  const currentProfileId = connectedProfile?.id ?? null;
  const currentProfileHandle = connectedProfile?.handle ?? null;

  const scopes = useMemo(() => {
    if (!wave) {
      return null;
    }

    return {
      view: buildScopeSummary(
        wave.visibility.scope,
        currentProfileId,
        currentProfileHandle
      ),
      drop: buildScopeSummary(
        wave.participation.scope,
        currentProfileId,
        currentProfileHandle
      ),
      vote: buildScopeSummary(
        wave.voting.scope,
        currentProfileId,
        currentProfileHandle
      ),
      chat: buildScopeSummary(
        wave.chat.scope,
        currentProfileId,
        currentProfileHandle
      ),
    };
  }, [wave, currentProfileId, currentProfileHandle]);

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
