import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import AcceptConnectionSharingPageClient from "./page.client";

export default function AcceptConnectionSharingPage() {
  return <AcceptConnectionSharingPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Accept Connection Sharing" });
}
