"use client";

import ProgressChart from "@/components/levels/ProgressChart";
import TableOfLevels from "@/components/levels/TableOfLevels";
import { useSetTitle } from "@/contexts/TitleContext";

export default function LevelsClient() {
  useSetTitle("Levels | Network");

  return (
    <div className="tailwind-scope">
      <div className="tw-pt-12 tw-pb-12">
        <div className="tw-px-6 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <h1>Levels</h1>
          <div className="tw-my-6 tw-flex tw-flex-col">
            <ProgressChart />
            <ul className="tw-ml-4 tw-pl-0">
              <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
                Levels are our integrated metric of TDH and Rep.
              </li>
              <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
                TDH and rep are added together and the level is determined by
                the table below. It is our most integrated measure of trust in
                our ecosystem.
              </li>
              <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
                Levels start at zero and are currently capped at 100 (for
                25,000,000 TDH).
              </li>
              <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
                Levels are determined by the table below.
              </li>
              <li className="tw-text-justify tw-mb-0 tw-mt-2 tw-font-normal tw-text-base tw-text-neutral-100">
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
