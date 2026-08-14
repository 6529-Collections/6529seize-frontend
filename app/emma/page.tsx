import { ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME } from "@/components/about/AboutLayout";
import DistributionPlanToolConnect from "@/components/distribution-plan-tool/connect/distribution-plan-tool-connect";
import DistributionPlanToolWrapper from "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function DistributionPlanTool() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-h-full tw-min-h-screen tw-overflow-x-hidden tw-bg-iron-900">
        <div
          className={`tw-grid tw-h-full tw-w-full tw-grid-cols-1 lg:tw-min-h-screen lg:tw-grid-cols-2 xl:tw-grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME}`}
        >
          <div className="tw-min-w-0 tw-py-8 sm:tw-py-12 lg:tw-py-14 lg:tw-pr-8 xl:tw-pr-12 2xl:tw-pr-16">
            <div className="tw-w-full lg:tw-max-w-xl">
              <div className="tw-flex tw-flex-col">
                <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-white md:tw-text-lg">
                  Meet EMMA - The Editor for Managing Multiphase Allowlists: The
                  first reference implementation of Janus.
                </p>
                <p className="tw-mb-0 tw-mt-2 tw-block tw-text-left tw-text-base tw-font-light tw-leading-[1.6] tw-text-iron-400 md:tw-mt-4">
                  The Memes and the Allowlist Research Institute have built what
                  may be the world's deepest expertise in complex allowlist
                  management across 150+ NFT drops (and counting). These efforts
                  lead to the creation of {""}
                  <a
                    className="tw-font-semibold tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
                    href="https://github.com/6529-Collections/Janus"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Janus
                  </a>
                  {""}, a domain-specific language for deeply customized
                  allowlist management.
                </p>
                <p className="tw-mb-0 tw-mt-2 tw-block tw-text-left tw-text-base tw-font-light tw-leading-[1.6] tw-text-iron-400 md:tw-mt-4">
                  EMMA was created as the internal team tool so that The Memes
                  team can smoothly manage multiple complex weekly NFT drops. We
                  are making this tool available for any member of The Memes
                  community who wants to use it for their own drops.
                </p>
                <p className="tw-mb-0 tw-mt-2 tw-block tw-text-left tw-text-base tw-font-light tw-leading-[1.6] tw-text-iron-400 md:tw-mt-4">
                  Please note: Since the tool can use significant computational
                  resources for complex allowlists, we have some mild anti-spam
                  measures currently in place to protect system performance.
                  Specifically, we use our community&apos;s &quot;proof of
                  humanity&quot; or anti-Sybil measure (TDH) as a lightweight
                  rate-limiter on allowlist creation. We will reevaluate and
                  increase or decrease the limits over time. As always, we
                  reserve the right to change access to this free tool,
                  including sunsetting it altogether.
                </p>
                <p className="tw-mb-0 tw-mt-2 tw-block tw-text-left tw-text-base tw-font-light tw-leading-[1.6] tw-text-iron-400 md:tw-mt-4">
                  Users with TDH &lt; 25,000 (but at least 1) will be limited to
                  3 allowlists per day.
                  <br /> Users with TDH &gt; 25,000 can create unlimited
                  allowlists per day.
                </p>
              </div>
            </div>
          </div>

          <div className="tw-min-w-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-py-8 sm:tw-py-12 lg:tw-border-l lg:tw-border-t-0 lg:tw-py-14 lg:tw-pl-8 xl:tw-pl-12 2xl:tw-pl-16">
            <DistributionPlanToolConnect />
          </div>
        </div>
      </div>
    </DistributionPlanToolWrapper>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "EMMA | Tools", description: "Tools" });
}
