"use client";

import MessagesLayout from "@/components/messages/layout/MessagesLayout";
import { getEncryptedMessagesRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { E2eeConversationView } from "../conversation/E2eeConversationView";
import { E2eeDevicesPanel } from "../devices/E2eeDevicesPanel";
import { E2eeRouteGate } from "../gate/E2eeRouteGate";
import { E2eeConversationListPage } from "../list/E2eeConversationListPage";
import { E2eeNewConversation } from "../new/E2eeNewConversation";
import { E2eePageShell } from "../ui/E2eePageShell";

type E2eeRouteView =
  | { readonly kind: "list" }
  | { readonly kind: "new" }
  | { readonly kind: "devices" }
  | { readonly kind: "conversation"; readonly g: string };

function E2eeDevicesPage() {
  const locale = useBrowserLocale();
  return (
    <E2eePageShell
      title={t(locale, "e2ee.devices.title")}
      backHref={getEncryptedMessagesRoute()}
      backLabel={t(locale, "e2ee.conversation.back")}
    >
      <E2eeRouteGate>{() => <E2eeDevicesPanel />}</E2eeRouteGate>
    </E2eePageShell>
  );
}

function E2eeRouteContent({ view }: { readonly view: E2eeRouteView }) {
  switch (view.kind) {
    case "new":
      return <E2eeNewConversation />;
    case "devices":
      return <E2eeDevicesPage />;
    case "conversation":
      return <E2eeConversationView g={view.g} />;
    case "list":
      return <E2eeConversationListPage />;
  }
}

/**
 * Client-only shell for `/messages/encrypted/...` inside the existing
 * messages layout (side pane on web, messages shell in the app). All data
 * comes from the on-device engine; the server renders no user data here.
 */
export default function E2eeMessagesRoute({
  view,
}: {
  readonly view: E2eeRouteView;
}) {
  return (
    <MessagesLayout>
      <E2eeRouteContent view={view} />
    </MessagesLayout>
  );
}
