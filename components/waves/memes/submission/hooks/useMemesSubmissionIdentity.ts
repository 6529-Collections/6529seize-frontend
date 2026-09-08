"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWave, SubmissionStatus } from "@/hooks/useWave";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

export type MemesSubmissionIdentityStatus =
  | "disconnected"
  | "connecting"
  | "loading-profile"
  | "needs-profile"
  | "needs-auth"
  | "verifying-profile"
  | "checking-eligibility"
  | "eligibility-error"
  | "ineligible"
  | "limit-reached"
  | "not-started"
  | "ended"
  | "eligible";

export interface MemesSubmissionIdentity {
  readonly status: MemesSubmissionIdentityStatus;
  readonly profileStatus: MemesSubmissionIdentityStatus;
  readonly profile: ApiIdentity | null;
  readonly address: string | null;
  readonly walletName: string | null;
  readonly canSubmit: boolean;
  readonly connectWallet: () => Promise<void>;
  readonly verifyProfile: () => Promise<void>;
  readonly retryEligibility: () => Promise<void>;
}

const getProfileIdentityKey = (
  profile: ApiIdentity | null | undefined
): string | null => {
  const key =
    profile?.id ??
    profile?.consolidation_key ??
    profile?.normalised_handle ??
    profile?.handle;
  const normalizedKey = key?.trim().toLowerCase();
  if (normalizedKey === undefined || normalizedKey.length === 0) {
    return null;
  }
  return normalizedKey;
};

const getEligibilityRequestStatus = ({
  requiresFreshEligibility,
  isFetchingEligibility,
  hasEligibilityError,
}: {
  readonly requiresFreshEligibility: boolean;
  readonly isFetchingEligibility: boolean;
  readonly hasEligibilityError: boolean;
}): MemesSubmissionIdentityStatus | null => {
  if (!requiresFreshEligibility) return null;
  if (isFetchingEligibility) return "checking-eligibility";
  if (hasEligibilityError) return "eligibility-error";
  return null;
};

const getProfileStatus = ({
  fetchingProfile,
  hasProfile,
  isAuthenticated,
  isVerifyingProfile,
  requiresFreshEligibility,
  isFetchingEligibility,
  hasEligibilityError,
  hasEligibilityWave,
  isEligible,
  hasReachedLimit,
  submissionStatus,
  canSubmitNow,
}: {
  readonly fetchingProfile: boolean;
  readonly hasProfile: boolean;
  readonly isAuthenticated: boolean | undefined;
  readonly isVerifyingProfile: boolean;
  readonly requiresFreshEligibility: boolean;
  readonly isFetchingEligibility: boolean;
  readonly hasEligibilityError: boolean;
  readonly hasEligibilityWave: boolean;
  readonly isEligible: boolean;
  readonly hasReachedLimit: boolean;
  readonly submissionStatus: SubmissionStatus;
  readonly canSubmitNow: boolean;
}): MemesSubmissionIdentityStatus => {
  if (fetchingProfile) return "loading-profile";
  if (!hasProfile) return "needs-profile";
  if (isVerifyingProfile) return "verifying-profile";
  if (!isAuthenticated) return "needs-auth";
  const eligibilityRequestStatus = getEligibilityRequestStatus({
    requiresFreshEligibility,
    isFetchingEligibility,
    hasEligibilityError,
  });
  if (eligibilityRequestStatus) return eligibilityRequestStatus;
  if (!hasEligibilityWave) return "checking-eligibility";
  if (!isEligible) return "ineligible";
  if (hasReachedLimit) return "limit-reached";
  if (submissionStatus === SubmissionStatus.NOT_STARTED) return "not-started";
  if (submissionStatus === SubmissionStatus.ENDED) return "ended";
  return canSubmitNow ? "eligible" : "ineligible";
};

export function useMemesSubmissionIdentity(
  wave: ApiWave
): MemesSubmissionIdentity {
  const {
    connectedProfile,
    fetchingProfile,
    isAuthenticated,
    requestAuth,
    setToast,
  } = useAuth();
  const {
    address,
    walletName,
    canSignActiveWallet,
    seizeConnectFresh,
    seizeConnectOpen,
    connectionState,
  } = useSeizeConnectContext();
  const locale = useBrowserLocale();
  const [isStartingConnection, setIsStartingConnection] = useState(false);
  const [isVerifyingProfile, setIsVerifyingProfile] = useState(false);
  const [initialProfileKey] = useState(() =>
    getProfileIdentityKey(connectedProfile)
  );
  const lastProfileKeyRef = useRef(getProfileIdentityKey(connectedProfile));
  const [hasChangedProfile, setHasChangedProfile] = useState(false);
  const profileKey = getProfileIdentityKey(connectedProfile);

  useEffect(() => {
    if (profileKey === lastProfileKeyRef.current) {
      return;
    }
    lastProfileKeyRef.current = profileKey;
    setHasChangedProfile(true);
  }, [profileKey]);

  const isLiveProfileReady = Boolean(
    canSignActiveWallet &&
    address &&
    connectedProfile?.handle &&
    isAuthenticated
  );
  const requiresFreshEligibility = Boolean(
    profileKey && (hasChangedProfile || profileKey !== initialProfileKey)
  );

  const {
    data: refreshedEligibilityWave,
    isFetching: isFetchingEligibility,
    isError: hasEligibilityError,
    refetch: refetchEligibility,
  } = useQuery<ApiWave>({
    queryKey: [
      QueryKey.MEMES_SUBMISSION_ELIGIBILITY,
      { wave_id: wave.id, profile: profileKey, signer: address?.toLowerCase() },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({ endpoint: `waves/${wave.id}` }),
    enabled: isLiveProfileReady && requiresFreshEligibility,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const eligibilityWave = requiresFreshEligibility
    ? refreshedEligibilityWave
    : wave;
  const { participation } = useWave(eligibilityWave ?? wave);

  const connectWallet = useCallback(async () => {
    if (isStartingConnection || seizeConnectOpen) {
      return;
    }
    setIsStartingConnection(true);
    try {
      await seizeConnectFresh();
    } catch (error) {
      setToast({
        type: "error",
        title: t(locale, "memes.submission.identity.connectErrorTitle"),
        description: t(
          locale,
          "memes.submission.identity.connectErrorDescription"
        ),
        details: getToastErrorDetails(error),
      });
    } finally {
      setIsStartingConnection(false);
    }
  }, [
    isStartingConnection,
    locale,
    seizeConnectFresh,
    seizeConnectOpen,
    setToast,
  ]);

  const verifyProfile = useCallback(async () => {
    if (isVerifyingProfile) {
      return;
    }
    setIsVerifyingProfile(true);
    try {
      await requestAuth();
    } finally {
      setIsVerifyingProfile(false);
    }
  }, [isVerifyingProfile, requestAuth]);

  const retryEligibility = useCallback(async () => {
    await refetchEligibility();
  }, [refetchEligibility]);

  const profileStatus = getProfileStatus({
    fetchingProfile,
    hasProfile: Boolean(connectedProfile?.handle),
    isAuthenticated,
    isVerifyingProfile,
    requiresFreshEligibility,
    isFetchingEligibility,
    hasEligibilityError,
    hasEligibilityWave: Boolean(eligibilityWave),
    isEligible: participation.isEligible,
    hasReachedLimit: participation.hasReachedLimit,
    submissionStatus: participation.status,
    canSubmitNow: participation.canSubmitNow,
  });
  const status = (() => {
    if (
      isStartingConnection ||
      seizeConnectOpen ||
      connectionState === "connecting"
    )
      return "connecting";
    if (!canSignActiveWallet || !address) return "disconnected";
    return profileStatus;
  })();

  return {
    status,
    profileStatus,
    profile: connectedProfile ?? null,
    address: canSignActiveWallet ? (address ?? null) : null,
    walletName: canSignActiveWallet ? (walletName ?? null) : null,
    canSubmit: status === "eligible",
    connectWallet,
    verifyProfile,
    retryEligibility,
  };
}
