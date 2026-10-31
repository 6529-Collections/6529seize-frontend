import { notFound } from "next/navigation";
import { Suspense } from "react";
import E2eeMessagesRoute from "@/components/e2ee/routes/E2eeMessagesRoute";
import { getAppMetadata } from "@/components/providers/metadata";
import { isE2eeEnabled } from "@/config/e2eeEnv";

/** Group handles are 32 random bytes as 0x-prefixed hex (contract 1). */
const GROUP_HANDLE_PATTERN = /^0x[0-9a-f]{64}$/i;

export const metadata = getAppMetadata(
  { title: "Encrypted chat" },
  { robots: { index: false, follow: false } }
);

// Client-only: messages are decrypted on this device. The server only checks
// the handle's shape and fetches nothing for this route.
export default async function EncryptedConversationPage({
  params,
}: {
  readonly params: Promise<{ group: string }>;
}) {
  if (!isE2eeEnabled()) {
    notFound();
  }

  const { group } = await params;
  if (!GROUP_HANDLE_PATTERN.test(group)) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <E2eeMessagesRoute
        view={{ kind: "conversation", g: group.toLowerCase() }}
      />
    </Suspense>
  );
}
