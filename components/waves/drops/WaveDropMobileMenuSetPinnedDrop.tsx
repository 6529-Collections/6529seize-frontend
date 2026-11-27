"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import WaveDropActionsSetPinnedDrop from "./WaveDropActionsSetPinnedDrop";

interface WaveDropMobileMenuSetPinnedDropProps {
  readonly drop: ApiDrop;
  readonly onPinnedDropSet: () => void;
}

export default function WaveDropMobileMenuSetPinnedDrop({
  drop,
  onPinnedDropSet,
}: WaveDropMobileMenuSetPinnedDropProps) {
  return (
    <WaveDropActionsSetPinnedDrop
      drop={drop}
      onPinnedDropSet={onPinnedDropSet}
      variant="mobile"
    />
  );
}
