import { redirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function ElementSectionsRedirectPage() {
  redirect("/");
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Redirecting..." });
}
