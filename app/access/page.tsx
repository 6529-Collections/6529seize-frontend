import AccessPageClient from "./page.client";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function AccessPage() {
  return <AccessPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Access Page" });
}
