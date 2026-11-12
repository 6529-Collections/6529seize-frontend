import { redirect } from "next/navigation";
import NewMessagePageClient from "@/components/messages/NewMessagePageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { NEW_MESSAGE_ROUTE } from "@/helpers/navigation.helpers";

export const metadata = getAppMetadata(
  { title: "New Direct Message" },
  { robots: { index: false, follow: true } }
);

export default function MessagesCreatePage() {
  if (isE2eeEnabled()) redirect(NEW_MESSAGE_ROUTE);
  return <NewMessagePageClient />;
}
