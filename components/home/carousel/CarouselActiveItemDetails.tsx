"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { WaveDropMetaRow } from "@/components/waves/drop/WaveDropMetaRow";

interface CarouselActiveItemDetailsProps {
  readonly drop: ExtendedDrop | null;
}

export default function CarouselActiveItemDetails({
  drop,
}: CarouselActiveItemDetailsProps) {
  if (!drop) {
    return null;
  }

  const { isWinner } = useDropInteractionRules(drop);
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ??
    drop.title ??
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ?? "";

  return (
    <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-3xl tw-flex-col tw-items-center">
      <div className="tw-mb-6 tw-text-center">
        <h1 className="tw-mb-4 tw-text-lg tw-font-bold tw-tracking-tight tw-text-white sm:tw-text-2xl">
          {title}
        </h1>
        {description && (
          <p className="tw-mb-0 tw-text-sm tw-text-white/60 lg:tw-text-md">
            {description}
          </p>
        )}
      </div>
      <WaveDropMetaRow drop={drop} isWinner={isWinner} />
    </div>
  );
}
