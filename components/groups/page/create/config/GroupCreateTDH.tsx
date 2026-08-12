import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";

export default function GroupCreateTDH({
  tdh,
  setTDH,
}: {
  readonly tdh: ApiCreateGroupDescription["tdh"];
  readonly setTDH: (tdh: ApiCreateGroupDescription["tdh"]) => void;
}) {
  const modes: CommonSelectItem<ApiGroupTdhInclusionStrategy>[] = [
    {
      label: "TDH + xTDH",
      value: ApiGroupTdhInclusionStrategy.Both,
      key: ApiGroupTdhInclusionStrategy.Both,
    },
    {
      label: "TDH",
      value: ApiGroupTdhInclusionStrategy.Tdh,
      key: ApiGroupTdhInclusionStrategy.Tdh,
    },
  ];

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-shadow sm:tw-p-5">
      <div className="tw-mb-4">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4">
          <div>
            <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
              {tdh.inclusion_strategy === ApiGroupTdhInclusionStrategy.Both
                ? "TDH + xTDH"
                : tdh.inclusion_strategy}
            </p>
            <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
              Set the group&apos;s minimum{" "}
              {tdh.inclusion_strategy === ApiGroupTdhInclusionStrategy.Both
                ? "TDH + xTDH"
                : tdh.inclusion_strategy}{" "}
              requirement.
            </p>
          </div>
          <div>
            <CommonTabs
              items={modes}
              activeItem={tdh.inclusion_strategy}
              setSelected={(strategy) =>
                setTDH({ ...tdh, inclusion_strategy: strategy })
              }
              size="sm"
              fill={false}
              filterLabel="Group TDH Mode"
            />
          </div>
        </div>
      </div>
      <GroupCreateNumericValue
        value={tdh.min}
        label={`${
          tdh.inclusion_strategy === ApiGroupTdhInclusionStrategy.Both
            ? "TDH + xTDH"
            : tdh.inclusion_strategy
        } at least`}
        labelId="floating_tdh"
        setValue={(value) => setTDH({ ...tdh, min: value })}
      />
    </div>
  );
}
