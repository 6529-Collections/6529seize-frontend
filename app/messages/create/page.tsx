import MessagesCreatePageClient from "./page.client";
import { getAppMetadata } from "@/components/providers/metadata";

export const metadata = getAppMetadata({ title: "New Direct Message" });

export default function MessagesCreatePage() {
  return <MessagesCreatePageClient />;
}
