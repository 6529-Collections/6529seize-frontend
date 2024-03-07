import { useState } from "react";
import CommonInput from "../utils/input/CommonInput";

export default function FilterBuilderTargetLevel({
  minLevel,
  maxLevel,
  setMinLevel,
  setMaxLevel,
}: {
  readonly minLevel: number | null;
  readonly maxLevel: number | null;
  readonly setMinLevel: (newV: number | null) => void;
  readonly setMaxLevel: (newV: number | null) => void;
}) {
  return (
    <div>
      <CommonInput
        inputType="number"
        placeholder="Min Level"
        value={minLevel?.toString() ?? ""}
        onChange={(newV) => setMinLevel(newV === null ? null : +newV)}
      />
      <CommonInput
        inputType="number"
        placeholder="Max Level"
        value={maxLevel?.toString() ?? ""}
        onChange={(newV) => setMaxLevel(newV === null ? null : +newV)}
      />
    </div>
  );
}
