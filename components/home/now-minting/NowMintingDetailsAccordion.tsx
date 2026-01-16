import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { printMintDate } from "@/helpers/Helpers";

interface NowMintingDetailsAccordionProps {
  readonly mintDate: Date | undefined;
  readonly fileType: string;
  readonly dimensions: string;
  readonly collection: string;
  readonly season: number;
}

export default function NowMintingDetailsAccordion({
  mintDate,
  fileType,
  dimensions,
  collection,
  season,
}: NowMintingDetailsAccordionProps) {
  const details = [
    { label: "Mint date", value: printMintDate(mintDate) },
    { label: "File type", value: fileType },
    { label: "Dimensions", value: dimensions },
    { label: "Collection", value: collection },
    { label: "Season", value: `SZN${season}` },
  ];

  return (
    <details className="tw-group tw-border-b tw-border-solid tw-border-x-0 tw-border-t tw-border-iron-800 tw-pb-6 tw-pt-6">
      <summary className="tw-flex tw-cursor-pointer tw-items-center tw-justify-between tw-gap-2 tw-font-medium tw-text-sm tw-text-iron-400 desktop-hover:hover:tw-text-iron-50 tw-transition-colors tw-duration-300">
        <span>Edition Details</span>
        <ChevronRightIcon className="tw-size-4 tw-transition-transform group-open:tw-rotate-90" />
      </summary>
      <div className="tw-mt-4 tw-pb-4">
        <div className="tw-space-y-3 tw-text-sm">
          {details.map(({ label, value }) => (
            <div key={label} className="tw-flex tw-justify-between">
              <span className="tw-text-iron-500">{label}</span>
              <span className="tw-text-iron-100">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
