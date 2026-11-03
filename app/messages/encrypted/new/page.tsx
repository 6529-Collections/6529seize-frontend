import { notFound } from "next/navigation";
import { Suspense } from "react";
import E2eeMessagesRoute from "@/components/e2ee/routes/E2eeMessagesRoute";
import { getAppMetadata } from "@/components/providers/metadata";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { t } from "@/i18n/messages";

export const metadata = getAppMetadata(
  { title: t("en-US", "e2ee.new.title") },
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
