import Link from "next/link";
import { FallbackImage } from "@/components/common/FallbackImage";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import WaveProfileTooltipWrapper from "@/components/utils/tooltip/WaveProfileTooltipWrapper";

export default function DropListItemContentWaveMention({
  wave,
}: {
  readonly wave: ApiMentionedWave;
}) {
  const wavePicture = wave.wave?.picture ?? null;
  return (
    <WaveProfileTooltipWrapper
      waveId={wave.wave_id}
      initialWave={wave.wave ?? null}
      fallbackName={wave.wave_name_in_content}
    >
      <Link
        onClick={(e) => e.stopPropagation()}
        href={`/waves?wave=${wave.wave_id}`}
        className="tw-inline-flex tw-items-center tw-gap-1 tw-align-middle tw-font-medium tw-text-primary-400 tw-no-underline tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-underline"
      >
        <span>#</span>
        {wavePicture && (
          <span className="tw-inline-flex tw-h-3 tw-w-3 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-leading-none">
            <FallbackImage
              primarySrc={getScaledImageUri(
                wavePicture,
                ImageScale.W_AUTO_H_50
              )}
              fallbackSrc={wavePicture}
              alt={`Wave ${wave.wave_name_in_content} avatar`}
              width={12}
              height={12}
              sizes="12px"
              className="tw-h-3 tw-w-3 tw-rounded-full tw-object-cover"
            />
          </span>
        )}
        <span>{wave.wave_name_in_content}</span>
      </Link>
    </WaveProfileTooltipWrapper>
  );
}
