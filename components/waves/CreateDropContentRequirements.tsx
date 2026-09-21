import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatList } from "@/i18n/format";
import { t } from "@/i18n/messages";

interface CreateDropContentRequirementsProps {
  readonly missingMedia: ApiWaveParticipationRequirement[];
  readonly missingMetadata: string[];
}

const CreateDropContentRequirements: React.FC<
  CreateDropContentRequirementsProps
> = ({ missingMedia, missingMetadata }) => {
  const locale = useBrowserLocale();
  const mediaActions: Record<ApiWaveParticipationRequirement, string> = {
    [ApiWaveParticipationRequirement.Image]: t(
      locale,
      "waves.requirements.addImage"
    ),
    [ApiWaveParticipationRequirement.Audio]: t(
      locale,
      "waves.requirements.addAudio"
    ),
    [ApiWaveParticipationRequirement.Video]: t(
      locale,
      "waves.requirements.addVideo"
    ),
  };
  const missingRequirementActions = missingMedia.map(
    (mediaType) => mediaActions[mediaType]
  );
  if (missingMetadata.length > 0) {
    missingRequirementActions.push(
      t(locale, "waves.requirements.completeMetadataDetails", {
        items: formatList(locale, missingMetadata),
      })
    );
  }

  if (missingRequirementActions.length === 0) return null;

  return (
    <p
      role="status"
      className="tw-mb-0 tw-mt-2 tw-flex tw-w-full tw-items-start tw-gap-1.5 tw-text-xs tw-leading-5 tw-text-amber-200"
    >
      <ExclamationCircleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-4 tw-shrink-0"
      />
      <span>
        {t(locale, "waves.requirements.missingSummary", {
          requirements: formatList(locale, missingRequirementActions),
        })}
      </span>
    </p>
  );
};

export default CreateDropContentRequirements;
