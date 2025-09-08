import { getAppMetadata } from "@/components/providers/metadata";
import NotificationsPageClient from "./page.client";
import { Metadata } from "next";

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Notifications",
    description: "Your notifications and updates",
  });
}