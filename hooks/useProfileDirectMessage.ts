"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { setE2eeComposePrefill } from "@/components/e2ee/e2eeComposePrefill";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { NEW_MESSAGE_ROUTE } from "@/helpers/navigation.helpers";

export function useProfileDirectMessage(
  profile: ApiIdentity | null | undefined
) {
  const router = useRouter();
  const { connectedProfile } = useAuth();
  const ownerProfileId = connectedProfile?.id;

  if (!ownerProfileId || !profile?.id || profile.id === ownerProfileId) {
    return undefined;
  }

  const person = {
    profileId: profile.id,
    handle: profile.handle,
    pfp: profile.pfp,
    wallet: profile.primary_wallet?.toLowerCase() || null,
  };

  return () => {
    setE2eeComposePrefill({
      ownerProfileId,
      people: [person],
      source: "profile",
    });
    router.push(NEW_MESSAGE_ROUTE);
  };
}
