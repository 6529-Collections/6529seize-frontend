import { notFound } from "next/navigation";
import { Suspense } from "react";
import E2eeMessagesRoute from "@/components/e2ee/routes/E2eeMessagesRoute";
import { getAppMetadata } from "@/components/providers/metadata";
import { isE2eeEnabled } from "@/config/e2eeEnv";

export const metadata = getAppMetadata(
  { title: "New encrypted chat" },
  { robots: { index: false, follow: false } }
);

export default function NewEncryptedChatPage() {
  if (!isE2eeEnabled()) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <E2eeMessagesRoute view={{ kind: "new" }} />
    </Suspense>
  );
}
