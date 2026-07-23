import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Quick Tags",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page({
  params,
}: {
  readonly params: Promise<{ user: string }>;
}) {
  const { user } = await params;
  permanentRedirect(`/${encodeURIComponent(user)}/brain`);
}
