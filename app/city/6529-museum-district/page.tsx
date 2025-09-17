import { redirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function CityMuseumRedirectPage() {
  redirect("/om/6529-museum-district/");
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Redirecting..." });
}
