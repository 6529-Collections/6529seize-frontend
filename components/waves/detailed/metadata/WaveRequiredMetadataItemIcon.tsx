import Tippy from "@tippyjs/react";
import { WaveMetadataType } from "../../../../generated/models/WaveMetadataType";

export default function WaveRequiredMetadataItemIcon({
  type,
}: {
  readonly type: WaveMetadataType;
}) {
  const LABELS: Record<WaveMetadataType, string> = {
    [WaveMetadataType.Number]: "Number",
    [WaveMetadataType.String]: "Text",
  };

  const ICONS: Record<WaveMetadataType, JSX.Element> = {
    [WaveMetadataType.Number]: (
      <svg
        className="tw-size-4 tw-flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 512"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M160 64c0-11.8-6.5-22.6-16.9-28.2s-23-5-32.8 1.6l-96 64C-.5 111.2-4.4 131 5.4 145.8s29.7 18.7 44.4 8.9L96 123.8V416H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96 96c17.7 0 32-14.3 32-32s-14.3-32-32-32H160V64z"
        />
      </svg>
    ),
    [WaveMetadataType.String]: (
      <svg
        className="tw-size-4 tw-flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 7C4 6.06812 4 5.60218 4.15224 5.23463C4.35523 4.74458 4.74458 4.35523 5.23463 4.15224C5.60218 4 6.06812 4 7 4H17C17.9319 4 18.3978 4 18.7654 4.15224C19.2554 4.35523 19.6448 4.74458 19.8478 5.23463C20 5.60218 20 6.06812 20 7M9 20H15M12 4V20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return <Tippy content={LABELS[type]}>{ICONS[type]}</Tippy>;
}
