import NextGenAdminPageClient from "./NextGenAdminPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "NextGen Admin" });
}

export default function NextGenAdminPage() {
  return <NextGenAdminPageClient />;
}
