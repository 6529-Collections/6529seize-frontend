import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "@heroicons/react/24/solid";
import type { RepDirection } from "./UserPageRep.helpers";

export default function RepDirectionToggle({
  repDirection,
  onRepDirectionChange,
  variant = "text",
  fill = false,
  matter = "REP",
}: {
  readonly repDirection: RepDirection;
  readonly onRepDirectionChange: (direction: RepDirection) => void;
  readonly variant?: "text" | "tabs";
  readonly fill?: boolean;
  readonly matter?: "REP" | "NIC";
}) {
  const locale = useBrowserLocale();
  const items: CommonSelectItem<RepDirection>[] = [
    {
      label: t(locale, "user.rate.received"),
      value: "received",
      key: "received",
    },
    { label: t(locale, "user.rate.given"), value: "given", key: "given" },
  ];
  if (variant === "text") {
    return (
      <div className="tw-flex tw-items-center tw-gap-4">
        <button
          type="button"
          aria-pressed={repDirection === "received"}
          onClick={() => onRepDirectionChange("received")}
          className={`tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-medium tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${
            repDirection === "received"
              ? "tw-text-iron-100"
              : "tw-text-iron-500 hover:tw-text-iron-300"
          }`}
        >
          <ArrowDownLeftIcon
            className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0"
            aria-hidden="true"
          />
          {t(locale, "user.rate.received")}
        </button>
        <button
          type="button"
          aria-pressed={repDirection === "given"}
          onClick={() => onRepDirectionChange("given")}
          className={`tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-medium tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${
            repDirection === "given"
              ? "tw-text-iron-100"
              : "tw-text-iron-500 hover:tw-text-iron-300"
          }`}
        >
          <ArrowUpRightIcon
            className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0"
            aria-hidden="true"
          />
          {t(locale, "user.rate.given")}
        </button>
      </div>
    );
  }

  return (
    <CommonTabs
      items={items}
      activeItem={repDirection}
      filterLabel={t(locale, "user.rate.direction", { matter })}
      setSelected={onRepDirectionChange}
      size="sm"
      fill={fill}
    />
  );
}
