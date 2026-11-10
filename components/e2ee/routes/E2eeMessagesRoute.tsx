"use client";

import MessagesLayout from "@/components/messages/layout/MessagesLayout";
import { E2eeConversationView } from "../conversation/E2eeConversationView";
import { E2eeConversationListPage } from "../list/E2eeConversationListPage";
import { E2eeNewConversation } from "../new/E2eeNewConversation";

type E2eeRouteView =
  | { readonly kind: "list" }
  | { readonly kind: "new" }
  | { readonly kind: "conversation"; readonly g: string };

function E2eeRouteContent({ view }: { readonly view: E2eeRouteView }) {
  switch (view.kind) {
    case "new":
      return <E2eeNewConversation />;
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
