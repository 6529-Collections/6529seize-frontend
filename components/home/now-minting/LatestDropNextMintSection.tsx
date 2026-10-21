import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import LatestDropNextMintPanel from "./LatestDropNextMintPanel";

interface LatestDropNextMintSectionProps {
  readonly drop: ApiDropV2View;
}

export default function LatestDropNextMintSection({
  drop,
}: LatestDropNextMintSectionProps) {
  return (
    <section
      data-home-section="Next drop"
      className="tw-relative tw-z-50 tw-px-4 tw-pb-4 tw-pt-14 md:tw-px-6 md:tw-pb-8 md:tw-pt-10 lg:tw-px-8"
    >
      <span className="tw-mb-5 tw-block tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-[-0.03em] tw-text-iron-50 md:tw-text-[22px] lg:tw-text-2xl">
        Next Drop
      </span>

      <LatestDropNextMintPanel drop={drop} />
    </section>
  );
}
