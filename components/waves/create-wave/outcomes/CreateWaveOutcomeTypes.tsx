import { CreateWaveOutcomeType } from "@/types/waves.types";
import CreateWaveOutcomeTypesItem from "./CreateWaveOutcomeTypesItem";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveOutcomeTypes({
  outcomeType,
  setOutcomeType,
}: {
  readonly outcomeType: CreateWaveOutcomeType | null;
  readonly setOutcomeType: (value: CreateWaveOutcomeType | null) => void;
}) {
  const locale = useBrowserLocale();
  const LABELS: Record<CreateWaveOutcomeType, string> = {
    [CreateWaveOutcomeType.MANUAL]: "Manual",
    [CreateWaveOutcomeType.REP]: "Rep",
    [CreateWaveOutcomeType.NIC]: "NIC",
  };
  return (
    <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
      <legend className="tw-sr-only">
        {t(locale, "waves.create.outcomes.chooseType")}
      </legend>
      <div className="tw-grid tw-grid-cols-3 tw-gap-2 sm:tw-gap-3">
        {Object.values(CreateWaveOutcomeType).map((type) => (
          <CreateWaveOutcomeTypesItem
            key={type}
            outcomeType={type}
            label={LABELS[type]}
            selectedOutcomeType={outcomeType}
            setOutcomeType={setOutcomeType}
          />
        ))}
      </div>
    </fieldset>
  );
}
