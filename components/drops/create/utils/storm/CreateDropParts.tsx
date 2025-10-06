import { formatNumberWithCommas } from "@/helpers/Helpers";

export default function CreateDropParts({
  partsCount,
  currentPartCount,
  charsCount,
  isStormMode,
}: {
  readonly partsCount: number;
  readonly currentPartCount: number;
  readonly charsCount: number;
  readonly isStormMode: boolean;
}) {
  return (
    <div className="tw-flex tw-w-full tw-justify-between tw-items-center tw-gap-x-6 tw-text-xs tw-font-medium tw-text-iron-400">
      {!!partsCount && isStormMode && (
        <p className="tw-mb-0 tw-mt-1.5 tw-pb-2">
          <span className="tw-font-semibold tw-text-iron-500">
            Part: <span className="tw-text-iron-50">{currentPartCount}</span>,
          </span>
          <span className={`${charsCount > 240 && "tw-text-error"} tw-pl-1`}>
            length: {formatNumberWithCommas(charsCount)}
          </span>
        </p>
      )}
    </div>
  );
}
