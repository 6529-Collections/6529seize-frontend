"use client";

import MessagesLayout from "@/components/messages/layout/MessagesLayout";
import MessagesView from "@/components/messages/MessagesView";

export default function MessagesPageClient() {
  return (
    <MessagesLayout>
      <MessagesView />
    </MessagesLayout>
  );
}