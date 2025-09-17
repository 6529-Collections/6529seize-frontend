import { redirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function GMRedirectPage() {
  redirect("https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4");
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Redirecting..." });
}
