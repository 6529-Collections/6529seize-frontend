import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WAVE_LABELS } from "@/helpers/waves/waves.constants";
import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";

// Not a real ApiWaveType: passed to the radios when nothing is selected yet so
// none render as checked (the shared radio's `selected` prop is non-nullable).
const NO_SELECTION = "" as ApiWaveType;

export default function CreateWaveTypeInputs({
  selected,
  onChange,
}: {
  readonly selected: ApiWaveType | null;
  readonly onChange: (type: ApiWaveType) => void;
}) {
  const waveTypes: ApiWaveType[] = [
    ApiWaveType.Chat,
    ApiWaveType.Rank,
    ApiWaveType.Approve,
  ];
  const waveTypeDescriptions: Record<ApiWaveType, string> = {
    [ApiWaveType.Chat]: "Create a social hub for community discussions.",
    [ApiWaveType.Rank]:
      "Rank submissions by votes — scheduled winners or a perpetual leaderboard.",
    [ApiWaveType.Approve]: "Submissions win once they reach a vote threshold.",
  };

  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3 [&>div]:tw-rounded-xl [&>div]:tw-px-3 [&>div]:tw-py-3 [&>div]:tw-shadow-none [&_input]:tw-h-4 [&_input]:tw-w-4">
      {waveTypes.map((waveType) => {
        const isSelected = selected === waveType;
        let titleColorClass = "tw-text-iron-300 group-hover:tw-text-white";
        let descriptionColorClass = "tw-text-iron-500";
        if (isSelected) {
          titleColorClass = "tw-text-white";
          descriptionColorClass = "tw-text-iron-300";
        }

        return (
          <CommonBorderedRadioButton
            key={waveType}
            type={waveType}
            selected={selected ?? NO_SELECTION}
            variant="subtle"
            onChange={onChange}
          >
            <div className="tw-min-w-0 tw-whitespace-normal">
              <span
                className={`tw-flex tw-min-h-4 tw-items-center tw-text-sm tw-font-semibold ${titleColorClass}`}
              >
                {WAVE_LABELS[waveType]}
              </span>
              <p
                className={`tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-leading-4 ${descriptionColorClass}`}
              >
                {waveTypeDescriptions[waveType]}
              </p>
            </div>
          </CommonBorderedRadioButton>
        );
      })}
    </div>
  );
}
