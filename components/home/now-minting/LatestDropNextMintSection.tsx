import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import LatestDropNextMintPanel from "./LatestDropNextMintPanel";

interface LatestDropNextMintSectionProps {
  readonly drop: ApiDropV2View;
}

export default function LatestDropNextMintSection({
  drop,
}: LatestDropNextMintSectionProps) {
  return (
    <section className="tw-relative tw-z-50 tw-px-4 tw-pb-4 tw-pt-6 md:tw-px-6 md:tw-pb-8 md:tw-pt-10 lg:tw-px-8">
      <span className="tw-mb-3 tw-block tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 md:tw-mb-4 md:tw-text-2xl">
        Next Drop
      </span>

      <LatestDropNextMintPanel drop={drop} />
    </section>
  );
}
