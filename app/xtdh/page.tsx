import XtdhPage from "@/components/xtdh/XtdhPage";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "xTDH Allocations",
    description:
      "Explore xTDH allocations across the entire ecosystem, discover active grantors, and manage your own grants.",
  });
}

export default function Page(): ReactElement {
  return (
    <main className="tw-mx-auto tw-w-full tw-max-w-6xl tw-px-4 tw-py-8 lg:tw-px-0">
      <XtdhPage />
    </main>
  );
}
