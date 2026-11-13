"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEncryptedMessagesRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  clearE2eeComposePrefill,
  peekE2eeComposePrefill,
} from "../e2eeComposePrefill";
import { E2eeRouteGate } from "../gate/E2eeRouteGate";
import { E2eePageShell } from "../ui/E2eePageShell";
import { NewMessageForm } from "./NewMessageForm";

/** Compatibility route, including the explicit handoff from a legacy chat. */
export function E2eeNewConversation() {
  const locale = useBrowserLocale();
  const router = useRouter();
  const [prefill] = useState(() => peekE2eeComposePrefill());

  useEffect(() => {
    clearE2eeComposePrefill();
  }, []);

  return (
    <E2eePageShell
      title={t(locale, "quickDm.createModalTitle")}
      backHref={getEncryptedMessagesRoute()}
      backLabel={t(locale, "e2ee.conversation.back")}
    >
      <E2eeRouteGate>
        {(e2ee) => {
          const handoff =
            prefill?.ownerProfileId === e2ee.profileId ? prefill : null;
          return (
            <NewMessageForm
              key={e2ee.profileId}
              e2ee={e2ee}
              initialPeople={handoff?.people}
              fromLegacyChat={handoff?.source === "dm"}
              onCancel={() => router.push(getEncryptedMessagesRoute())}
            />
          );
        }}
      </E2eeRouteGate>
    </E2eePageShell>
  );
}
