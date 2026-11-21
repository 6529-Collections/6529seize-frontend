import { notFound } from "next/navigation";
import { Suspense } from "react";
import E2eeMessagesRoute from "@/components/e2ee/routes/E2eeMessagesRoute";
import { getAppMetadata } from "@/components/providers/metadata";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import MessagesRouteLoading from "@/components/messages/MessagesRouteLoading";

export const metadata = getAppMetadata(
  {
    title: "Encrypted messages",
    description: "End-to-end encrypted messages",
  },
  { robots: { index: false, follow: false } }
);

// Client-only: the encrypted list comes from this device's engine. The server
// fetches nothing and never uses the viewer's token for this route.
export default function EncryptedMessagesPage() {
  if (!isE2eeEnabled()) {
    notFound();
  }

  return (
    <Suspense fallback={<MessagesRouteLoading encrypted />}>
      <E2eeMessagesRoute view={{ kind: "list" }} />
    </Suspense>
  );
}
