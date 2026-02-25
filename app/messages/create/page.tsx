import { getAppMetadata } from "@/components/providers/metadata";

import MessagesCreatePageClient from "./page.client";

export const metadata = getAppMetadata({ title: "New Direct Message" });

export default function MessagesCreatePage() {
  return <MessagesCreatePageClient />;
}
