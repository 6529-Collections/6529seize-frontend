"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import {
  PROFILE_MESSAGE_PREFILL_PARAM,
  useE2eeComposePrefill,
} from "@/components/e2ee/e2eeComposePrefill";
import MessagesLayout from "@/components/messages/layout/MessagesLayout";
import CreateDirectMessage from "@/components/waves/create-dm/CreateDirectMessage";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getMessagesBaseRoute } from "@/helpers/navigation.helpers";

function ProfileMessageComposer({
  profile,
  navigationId,
}: {
  readonly profile: ApiIdentity;
  readonly navigationId: string | null;
}) {
  const router = useRouter();
  const prefill = useE2eeComposePrefill("profile", navigationId);

  return (
    <CreateDirectMessage
      profile={profile}
      initialPerson={
        prefill?.ownerProfileId === profile.id ? prefill.people[0] : undefined
      }
      onBack={() => router.replace(getMessagesBaseRoute(true))}
    />
  );
}

function NewMessageComposer({ profile }: { readonly profile: ApiIdentity }) {
  const navigationId = useSearchParams().get(PROFILE_MESSAGE_PREFILL_PARAM);

  return (
    <ProfileMessageComposer
      key={JSON.stringify([profile.id, navigationId])}
      profile={profile}
      navigationId={navigationId}
    />
  );
}

export default function NewMessagePageClient() {
  const { connectedProfile } = useAuth();

  return (
    <MessagesLayout>
      {connectedProfile ? (
        <Suspense fallback={null}>
          <NewMessageComposer profile={connectedProfile} />
        </Suspense>
      ) : null}
    </MessagesLayout>
  );
}
