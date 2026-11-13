import NewMessagePageClient from "@/components/messages/NewMessagePageClient";
import { getAppMetadata } from "@/components/providers/metadata";

export const metadata = getAppMetadata(
  { title: "New message" },
  { robots: { index: false, follow: true } }
);

export default function NewMessagePage() {
  return <NewMessagePageClient />;
}
