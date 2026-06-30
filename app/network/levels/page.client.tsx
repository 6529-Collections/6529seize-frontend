"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import ProgressChart from "@/components/levels/ProgressChart";
import TableOfLevels from "@/components/levels/TableOfLevels";
import { useSetTitle } from "@/contexts/TitleContext";

export default function LevelsClient() {
  useSetTitle("Levels | Network");

  return (
    <div className="tailwind-scope">
      <div className="tw-pb-12 tw-pt-12">
        <div className="tw-mx-auto tw-px-2 lg:tw-px-6 xl:tw-px-8">
          <AboutContentsDropdown currentHref="/network/levels" />
          <h1 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
            Levels
          </h1>
          <div className="tw-my-6 tw-flex tw-flex-col">
            <ProgressChart />
            <ul className="tw-ml-4 tw-pl-0">
              <li className="tw-mb-0 tw-mt-2 tw-text-justify tw-text-base tw-font-normal tw-text-iron-100">
                Levels are our integrated metric of TDH and Rep.
              </li>
              <li className="tw-mb-0 tw-mt-2 tw-text-justify tw-text-base tw-font-normal tw-text-iron-100">
                TDH and rep are added together and the level is determined by
                the table below. It is our most integrated measure of trust in
                our ecosystem.
              </li>
              <li className="tw-mb-0 tw-mt-2 tw-text-justify tw-text-base tw-font-normal tw-text-iron-100">
                Levels start at zero and are currently capped at 100 (for
                25,000,000 TDH).
              </li>
              <li className="tw-mb-0 tw-mt-2 tw-text-justify tw-text-base tw-font-normal tw-text-iron-100">
                Levels are determined by the table below.
              </li>
              <li className="tw-mb-0 tw-mt-2 tw-text-justify tw-text-base tw-font-normal tw-text-iron-100">
                As with all metrics, they may be adjusted to better meet their
                objectives.
              </li>
            </ul>
          </div>
          <TableOfLevels />
        </div>
      </div>
    </div>
  );
}
