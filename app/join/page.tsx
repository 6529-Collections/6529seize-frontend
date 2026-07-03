import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = getAppMetadata({
  title: "Join 6529",
  description: "Join 6529",
});

export default function JoinPage() {
  return (
    <main className="tailwind-scope tw-min-h-dvh tw-bg-black tw-px-4 tw-py-12 tw-text-iron-50 sm:tw-px-6 lg:tw-px-8">
      <section className="tw-mx-auto tw-flex tw-max-w-3xl tw-flex-col tw-gap-4">
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-400">
          6529
        </p>
        <h1 className="tw-m-0 tw-text-4xl tw-font-semibold tw-tracking-normal tw-text-white sm:tw-text-5xl">
          Join 6529
        </h1>
        {/* TODO: Replace this placeholder with the approved Join 6529 page in a separate acquisition/onboarding task. */}
        <p className="tw-m-0 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
          Join 6529 details are coming soon.
        </p>
      </section>
    </main>
  );
}
