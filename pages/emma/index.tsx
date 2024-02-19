import DistributionPlanToolWrapper from "../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import DistributionPlanToolConnect from "../../components/distribution-plan-tool/connect/distributipn-plan-tool-connect";

export default function DistributionPlanTool() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-h-full tw-min-h-screen tw-overflow-x-hidden tw-bg-neutral-900">
        <div className="tw-flex tw-flex-wrap tw-h-full tw-w-full lg:tw-min-h-screen tw-px-8 xl:tw-px-14 tw-space-y-8 lg:tw-space-y-0">
          <div className="lg:tw-w-1/2 xl:tw-w-[40%] 2xl:tw-w-1/2 tw-pt-8 md:tw-pt-14 lg:tw-pb-12">
            <div className="2xl:tw-max-w-xl tw-mx-auto lg:tw-pr-10 xl:tw-pr-16 2xl:tw-pr-0">
              <div className="tw-flex tw-flex-col">
                <p className="tw-text-white tw-font-semibold tw-mb-0 tw-text-base md:tw-text-lg">
                  Meet EMMA - The Editor for Managing Multiphase Allowlists: The
                  first reference implementation of Janus.
                </p>
                <p className="tw-text-justify tw-mb-0 tw-mt-2 md:tw-mt-4 tw-block tw-font-light tw-text-base tw-leading-[1.6] tw-text-neutral-400">
                  The Memes and the Allowlist Research Institute have built what
                  may be the world&apos;s deepest expertise in complex allowlist
                  management across 150+ NFT drops (and counting). These efforts
                  lead to the creation of {""}
                  <a
                    className="tw-font-semibold hover:tw-text-neutral-300 tw-transition tw-duration-300 tw-ease-out"
                    href="https://github.com/6529-Collections/Janus"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Janus
                  </a>{""}
                  , a domain-specific language for deeply customized allowlist
                  management.
                </p>
                <p className="tw-text-justify tw-mb-0 tw-mt-2 md:tw-mt-4 tw-block tw-font-light tw-text-base tw-leading-[1.6] tw-text-neutral-400">
                  EMMA was created as the internal team tool so that The Memes
                  team can smoothly manage multiple complex weekly NFT drops. We
                  are making this tool available for any member of The Memes
                  community who wants to use it for their own drops.
                </p>
                <p className="tw-text-justify tw-mb-0 tw-mt-2 md:tw-mt-4 tw-block tw-font-light tw-text-base tw-leading-[1.6] tw-text-neutral-400">
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
                <p className="tw-text-justify tw-mb-0 tw-mt-2 md:tw-mt-4 tw-block tw-font-light tw-text-base tw-leading-[1.6] tw-text-neutral-400">
                  Users with TDH &lt; 25,000 (but at least 1) will be limited to
                  3 allowlists per day.
                  <br /> Users with TDH &gt; 25,000 can create unlimited
                  allowlists per day.
                </p>
                <p className="tw-text-justify tw-mb-0 tw-mt-2 md:tw-mt-4 tw-block tw-font-light tw-text-base tw-leading-[1.6] tw-text-neutral-400"></p>
              </div>
            </div>
          </div>

          <div className="lg:tw-w-1/2 xl:tw-w-[60%] 2xl:tw-w-1/2 tw-pt-8 lg:tw-pt-12 tw-pb-12 lg:tw-pb-0 tw-border-l-0 lg:tw-border-l tw-border-solid tw-border-r-0 tw-border-t-1 lg:tw-border-t-0 tw-border-b-0 tw-border-neutral-700">
            <DistributionPlanToolConnect />
          </div>
        </div>
      </div>
    </DistributionPlanToolWrapper>
  );
}
