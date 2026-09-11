import { Period } from "@/helpers/Types";
import CreateWaveDropdown from "../utils/CreateWaveDropdown";

interface DecisionPointDropdownProps {
  readonly value: Period;
  readonly onChange: (value: Period) => void;
}

export default function DecisionPointDropdown({
  value,
  onChange,
}: DecisionPointDropdownProps) {
  const options = [
    { value: Period.WEEKS, label: "Weeks" },
    { value: Period.DAYS, label: "Days" },
    { value: Period.HOURS, label: "Hours" },
  ] as const;

  return (
    <CreateWaveDropdown
      value={value}
      options={options}
      ariaLabel="Decision interval unit"
      rounding="right"
      onChange={onChange}
    />
  );
}
