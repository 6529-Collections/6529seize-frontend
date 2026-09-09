import { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import CreateWaveDropsType from "./CreateWaveDropsType";
import { ExtendedWaveParticipationRequirement } from "./CreateWaveDropsTypes.constants";

const REQUIRED_TYPE_LABEL_KEYS = {
  [ExtendedWaveParticipationRequirement.NONE]:
    "waves.create.drops.requiredType.none",
  [ExtendedWaveParticipationRequirement.IMAGE]:
    "waves.create.drops.requiredType.image",
  [ExtendedWaveParticipationRequirement.AUDIO]:
    "waves.create.drops.requiredType.audio",
  [ExtendedWaveParticipationRequirement.VIDEO]:
    "waves.create.drops.requiredType.video",
} satisfies Record<ExtendedWaveParticipationRequirement, MessageKey>;

export default function CreateWaveDropsTypes({
  requiredTypes,
  onRequiredTypeChange,
}: {
  readonly requiredTypes: ApiWaveParticipationRequirement[];
  readonly onRequiredTypeChange: (
    types: ApiWaveParticipationRequirement[]
  ) => void;
}) {
  const locale = useBrowserLocale();

  const checkIsChecked = (
    type: ExtendedWaveParticipationRequirement
  ): boolean => {
    switch (type) {
      case ExtendedWaveParticipationRequirement.NONE:
        return requiredTypes.length === 0;
      case ExtendedWaveParticipationRequirement.IMAGE:
        return requiredTypes.includes(ApiWaveParticipationRequirement.Image);
      case ExtendedWaveParticipationRequirement.AUDIO:
        return requiredTypes.includes(ApiWaveParticipationRequirement.Audio);
      case ExtendedWaveParticipationRequirement.VIDEO:
        return requiredTypes.includes(ApiWaveParticipationRequirement.Video);
      default:
        assertUnreachable(type);
        return false;
    }
  };

  const extendedTypeToWaveParticipationRequirement = (
    type: ExtendedWaveParticipationRequirement
  ): ApiWaveParticipationRequirement | null => {
    switch (type) {
      case ExtendedWaveParticipationRequirement.NONE:
        return null;
      case ExtendedWaveParticipationRequirement.IMAGE:
        return ApiWaveParticipationRequirement.Image;
      case ExtendedWaveParticipationRequirement.AUDIO:
        return ApiWaveParticipationRequirement.Audio;
      case ExtendedWaveParticipationRequirement.VIDEO:
        return ApiWaveParticipationRequirement.Video;
      default:
        assertUnreachable(type);
        return null;
    }
  };

  const onChange = (type: ExtendedWaveParticipationRequirement) => {
    const waveParticipationRequirement =
      extendedTypeToWaveParticipationRequirement(type);
    if (waveParticipationRequirement !== null) {
      onRequiredTypeChange([waveParticipationRequirement]);
    } else {
      onRequiredTypeChange([]);
    }
  };

  return (
    <fieldset className="tw-m-0 tw-border-0 tw-p-0">
      <legend className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
        {t(locale, "waves.create.drops.requiredTypesLegend")}
      </legend>
      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-4 sm:tw-gap-3">
        {Object.values(ExtendedWaveParticipationRequirement).map((type) => (
          <CreateWaveDropsType
            key={type}
            isChecked={checkIsChecked(type)}
            type={type}
            label={t(locale, REQUIRED_TYPE_LABEL_KEYS[type])}
            onRequiredTypeChange={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}
