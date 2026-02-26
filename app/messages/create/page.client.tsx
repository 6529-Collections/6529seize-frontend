"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/Auth";
import MessagesLayout from "@/components/messages/layout/MessagesLayout";
import CreateDirectMessage from "@/components/waves/create-dm/CreateDirectMessage";
import { getMessagesBaseRoute } from "@/helpers/navigation.helpers";


export default function MessagesCreatePageClient() {
  const router = useRouter();
  const { connectedProfile } = useAuth();

  return (
    <MessagesLayout>
      {connectedProfile ? (
        <CreateDirectMessage
          profile={connectedProfile}
          onBack={() => router.replace(getMessagesBaseRoute(true))}
        />
      ) : null}
    </MessagesLayout>
  );
}
