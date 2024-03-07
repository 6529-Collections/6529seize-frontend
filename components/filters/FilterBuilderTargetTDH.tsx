import CommonInput from "../utils/input/CommonInput";

export default function FilterBuilderTargetTDH({
  minTDH,
  maxTDH,
  setMinTDH,
  setMaxTDH,
}: {
  readonly minTDH: number | null;
  readonly maxTDH: number | null;
  readonly setMinTDH: (newV: number | null) => void;
  readonly setMaxTDH: (newV: number | null) => void;
}) {
  return (
    <div className="tw-w-full tw-inline-flex tw-space-x-4">
      <CommonInput
        inputType="number"
        placeholder="Min TDH"
        value={minTDH?.toString() ?? ""}
        onChange={(newV) => setMinTDH(newV === null ? null : +newV)}
      />
      <CommonInput
        inputType="number"
        placeholder="Max TDH"
        value={maxTDH?.toString() ?? ""}
        onChange={(newV) => setMaxTDH(newV === null ? null : +newV)}
      />
    </div>
  );
}
