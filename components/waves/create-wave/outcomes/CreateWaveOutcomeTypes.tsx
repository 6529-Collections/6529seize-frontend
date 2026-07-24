import { CreateWaveOutcomeType } from "@/types/waves.types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import CreateWaveOutcomeTypesItem from "./CreateWaveOutcomeTypesItem";

export default function CreateWaveOutcomeTypes({
  outcomeType,
  setOutcomeType,
}: {
  readonly outcomeType: CreateWaveOutcomeType | null;
  readonly setOutcomeType: (value: CreateWaveOutcomeType | null) => void;
}) {
  const OPTIONS: Record<
    CreateWaveOutcomeType,
    { readonly label: string; readonly description: string }
  > = {
    [CreateWaveOutcomeType.MANUAL]: {
      label: t(DEFAULT_LOCALE, "waves.create.outcomes.type.manual.label"),
      description: t(
        DEFAULT_LOCALE,
        "waves.create.outcomes.type.manual.description"
      ),
    },
    [CreateWaveOutcomeType.REP]: {
      label: t(DEFAULT_LOCALE, "waves.create.outcomes.type.rep.label"),
      description: t(
        DEFAULT_LOCALE,
        "waves.create.outcomes.type.rep.description"
      ),
    },
    [CreateWaveOutcomeType.NIC]: {
      label: t(DEFAULT_LOCALE, "waves.create.outcomes.type.nic.label"),
      description: t(
        DEFAULT_LOCALE,
        "waves.create.outcomes.type.nic.description"
      ),
    },
  };
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3">
      {Object.values(CreateWaveOutcomeType).map((type) => (
        <CreateWaveOutcomeTypesItem
          key={type}
          outcomeType={type}
          label={OPTIONS[type].label}
          description={OPTIONS[type].description}
          selectedOutcomeType={outcomeType}
          setOutcomeType={setOutcomeType}
        />
      ))}
    </div>
  );
}
