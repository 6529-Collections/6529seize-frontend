"use client";

import { useState } from "react";

import { NftPicker } from "@/components/nft-picker/NftPicker";
import type { NftPickerSelection } from "@/components/nft-picker/NftPicker.types";

const stringifySelection = (value: unknown) =>
  JSON.stringify(
    value,
    (_, nestedValue) => (typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue),
    2,
  );

export default function DemoNftPicker() {
  const [selection, setSelection] = useState<NftPickerSelection | null>(null);

  return (
    <div className="tw-@container tw-mx-auto tw-flex tw-max-w-3xl tw-flex-col tw-gap-4 tw-p-6">
      <NftPicker onChange={setSelection} allowAll allowRanges hideSpam className="tw-shadow-lg" />
    </div>
  );
}
