import {
  GROUP_CREATE_PANEL_STYLES,
  GROUP_CREATE_TITLE_STYLES,
  GROUP_CREATE_DESCRIPTION_STYLES,
} from "../GroupCreate.styles";
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
    <div className={GROUP_CREATE_PANEL_STYLES}>
      <div className="tw-mb-4">
        <div
          data-group-criteria-tabs-row
          className="tw-flex tw-flex-col tw-items-start tw-justify-between tw-gap-4 sm:tw-flex-row sm:tw-items-center"
        >
          <div>
            <p className={GROUP_CREATE_TITLE_STYLES}>
              {tdh.inclusion_strategy === ApiGroupTdhInclusionStrategy.Both
                ? "TDH + xTDH"
                : tdh.inclusion_strategy}
            </p>
            <p className={GROUP_CREATE_DESCRIPTION_STYLES}>
              Set the group&apos;s minimum{" "}
              {tdh.inclusion_strategy === ApiGroupTdhInclusionStrategy.Both
                ? "TDH + xTDH"
                : tdh.inclusion_strategy}{" "}
              requirement.
            </p>
          </div>
          <div data-group-criteria-tabs>
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
