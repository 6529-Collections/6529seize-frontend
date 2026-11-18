"use client";

import { useRouter } from "next/navigation";
import { v4 as createUuid } from "uuid";
import { useAuth } from "@/components/auth/Auth";
import { useE2eeContext } from "@/components/e2ee/E2eeContext";
import {
  PROFILE_MESSAGE_PREFILL_PARAM,
  setE2eeComposePrefill,
} from "@/components/e2ee/e2eeComposePrefill";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { NEW_MESSAGE_ROUTE } from "@/helpers/navigation.helpers";

export function useProfileDirectMessage(
  profile: ApiIdentity | null | undefined
) {
  const router = useRouter();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { requestEngine } = useE2eeContext();
  const ownerProfileId = connectedProfile?.id;

  if (
    !ownerProfileId ||
    !profile?.id ||
    profile.id === ownerProfileId ||
    (!profile.primary_wallet && (activeProfileProxy || !isE2eeEnabled()))
  ) {
    return undefined;
  }

  const person = {
    profileId: profile.id,
    handle: profile.handle,
    pfp: profile.pfp,
    wallet: profile.primary_wallet
      ? profile.primary_wallet.toLowerCase()
      : null,
  };

  return () => {
    const navigationId = createUuid();
    setE2eeComposePrefill({
      ownerProfileId,
      people: [person],
      source: "profile",
      navigationId,
    });
    requestEngine();
    router.push(
      `${NEW_MESSAGE_ROUTE}?${PROFILE_MESSAGE_PREFILL_PARAM}=${navigationId}`
    );
  };
}
