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
      data-home-next-drop
      data-home-drop
      className="tw-group/home-next-drop tw-group/home-drop tw-relative tw-z-50 tw-px-4 tw-pb-4 tw-pt-8 md:tw-px-6 md:tw-pb-8 md:tw-pt-10 lg:tw-px-8"
    >
      <span className="tw-mb-7 tw-mt-0 tw-block tw-text-[28px] tw-font-semibold tw-leading-[1.17] tw-tracking-[-0.04em] tw-text-iron-50 md:tw-mb-8 md:tw-text-[38px] md:tw-leading-[1.14]">
        Next Drop
      </span>

      <LatestDropNextMintPanel drop={drop} />
    </section>
  );
}
