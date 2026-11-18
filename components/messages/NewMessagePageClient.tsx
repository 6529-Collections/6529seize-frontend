"use client";

import { useE2eeComposePrefill } from "@/components/e2ee/e2eeComposePrefill";
import MessagesLayout from "@/components/messages/layout/MessagesLayout";
import CreateDirectMessage from "@/components/waves/create-dm/CreateDirectMessage";
import { useAuth } from "@/components/auth/Auth";
import { getMessagesBaseRoute } from "@/helpers/navigation.helpers";
import { useRouter } from "next/navigation";

export default function NewMessagePageClient() {
  const router = useRouter();
  const { connectedProfile } = useAuth();
  const prefill = useE2eeComposePrefill("profile");
  const initialPerson =
    prefill && prefill.ownerProfileId === connectedProfile?.id
      ? prefill.people[0]
      : undefined;

  return (
    <MessagesLayout>
      {connectedProfile ? (
        <CreateDirectMessage
          key={connectedProfile.id}
          profile={connectedProfile}
          initialPerson={initialPerson}
          onBack={() => router.replace(getMessagesBaseRoute(true))}
        />
      ) : null}
    </MessagesLayout>
  );
}
