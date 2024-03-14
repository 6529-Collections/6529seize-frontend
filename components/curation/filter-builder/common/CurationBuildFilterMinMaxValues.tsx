import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";
import CommonInput from "../../../utils/input/CommonInput";

export default function CurationBuildFilterMinMaxValues({
  min,
  max,
  minPlaceholder,
  maxPlaceholder,
  setMin,
  setMax,
}: {
  readonly min: number | null;
  readonly max: number | null;
  readonly minPlaceholder: string;
  readonly maxPlaceholder: string;
  readonly setMin: (value: number | null) => void;
  readonly setMax: (value: number | null) => void;
}) {
  return (
    <div>
      <CommonInput
        inputType="number"
        value={typeof min === "number" ? min.toString() : ""}
        onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
        placeholder={minPlaceholder}
      />
      <CommonInput
        inputType="number"
        value={typeof max === "number" ? max.toString() : ""}
        onChange={(value) => setMax(convertStringOrNullToNumberOrNull(value))}
        placeholder={maxPlaceholder}
      />
    </div>
  );
}
