import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "@heroicons/react/24/solid";
import type { RepDirection } from "./UserPageRep.helpers";

const REP_DIRECTION_ITEMS: CommonSelectItem<RepDirection>[] = [
  { label: "Received", value: "received", key: "received" },
  { label: "Given", value: "given", key: "given" },
];

export default function RepDirectionToggle({
  repDirection,
  onRepDirectionChange,
  variant = "text",
  fill = false,
}: {
  readonly repDirection: RepDirection;
  readonly onRepDirectionChange: (direction: RepDirection) => void;
  readonly variant?: "text" | "tabs";
  readonly fill?: boolean;
}) {
  if (variant === "text") {
    return (
      <div className="tw-flex tw-items-center tw-gap-4">
        <button
          type="button"
          aria-pressed={repDirection === "received"}
          onClick={() => onRepDirectionChange("received")}
          className={`tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-medium tw-transition-colors tw-duration-200 ${
            repDirection === "received"
              ? "tw-text-iron-100"
              : "tw-text-iron-500 hover:tw-text-iron-300"
          }`}
        >
          <ArrowDownLeftIcon
            className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0"
            aria-hidden="true"
          />
          Received
        </button>
        <button
          type="button"
          aria-pressed={repDirection === "given"}
          onClick={() => onRepDirectionChange("given")}
          className={`tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-medium tw-transition-colors tw-duration-200 ${
            repDirection === "given"
              ? "tw-text-iron-100"
              : "tw-text-iron-500 hover:tw-text-iron-300"
          }`}
        >
          <ArrowUpRightIcon
            className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0"
            aria-hidden="true"
          />
          Given
        </button>
      </div>
    );
  }

  return (
    <CommonTabs
      items={REP_DIRECTION_ITEMS}
      activeItem={repDirection}
      filterLabel="REP direction"
      setSelected={onRepDirectionChange}
      size="sm"
      fill={fill}
    />
  );
}
