import { useMemo } from "react";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { ALL_NETWORKS_OPTION } from "../../constants";
import { classNames } from "@/helpers/Helpers";

interface XtdhNetworkDropdownProps {
  readonly networks: string[];
  readonly selected: string[];
  readonly onToggle: (network: string) => void;
  readonly disabled?: boolean;
}

const SUMMARY_VALUE = "__xtdh_network_summary__";

/**
 * Network multi-select dropdown built on top of the shared CommonDropdown.
 */
export default function XtdhNetworkDropdown({
  networks,
  selected,
  onToggle,
  disabled = false,
}: Readonly<XtdhNetworkDropdownProps>) {
  const normalizedNetworks = useMemo(
    () => Array.from(new Set(networks.filter(Boolean))),
    [networks]
  );

  const normalizedSelected = useMemo(
    () => selected.filter((network) => normalizedNetworks.includes(network)),
    [normalizedNetworks, selected]
  );

  const selectedCount = normalizedSelected.length;

  const selectedSet = useMemo(
    () => new Set(normalizedSelected),
    [normalizedSelected]
  );

  const hasNetworks = normalizedNetworks.length > 0;

  const allSelected =
    selectedCount === 0 || selectedCount === normalizedNetworks.length;

  const summaryLabel = useMemo(() => {
    if (!hasNetworks) {
      return "No networks";
    }
    if (normalizedNetworks.length === 1) {
      return normalizedNetworks[0];
    }
    if (allSelected) {
      return "All networks";
    }
    if (selectedCount === 1) {
      return normalizedSelected[0];
    }
    return `${selectedCount.toLocaleString()} networks`;
  }, [
    allSelected,
    hasNetworks,
    normalizedNetworks,
    normalizedSelected,
    selectedCount,
  ]);

  const items = useMemo<CommonSelectItem<string>[]>(() => {
    if (!hasNetworks) {
      return [];
    }
    return [
      {
        key: ALL_NETWORKS_OPTION,
        value: ALL_NETWORKS_OPTION,
        label: "All networks",
      },
      ...normalizedNetworks.map(
        (network): CommonSelectItem<string> => ({
          key: network,
          value: network,
          label: network,
        })
      ),
    ];
  }, [hasNetworks, normalizedNetworks]);

  const dropdownDisabled = disabled || !hasNetworks;

  return (
    <div className="tw-min-w-[11rem] tw-w-full sm:tw-w-auto">
      <CommonDropdown<string>
        items={items}
        activeItem={SUMMARY_VALUE}
        noneLabel={summaryLabel}
        filterLabel="Networks"
        setSelected={(value) => {
          if (dropdownDisabled) return;
          onToggle(value);
        }}
        disabled={dropdownDisabled}
        closeOnSelect={false}
        renderItemChildren={(item) => {
          const isAll = item.value === ALL_NETWORKS_OPTION;
          const isChecked = isAll ? allSelected : selectedSet.has(item.value);

          return (
            <span
              aria-hidden="true"
              className={classNames(
                "tw-ml-3 tw-inline-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded tw-border tw-border-iron-600 tw-text-[0.65rem] tw-font-bold",
                isChecked
                  ? "tw-bg-primary-500 tw-text-iron-950 tw-border-primary-500"
                  : "tw-bg-iron-900 tw-text-transparent"
              )}
            >
              ✓
            </span>
          );
        }}
      />
    </div>
  );
}
