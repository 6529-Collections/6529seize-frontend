import ComponentRandomHoldersWeightItem from "./ComponentRandomHoldersWeightItem";

export enum ComponentRandomHoldersWeightType {
  OFF = "OFF",
  TOTAL_CARDS = "TOTAL_CARDS",
  UNIQUE_CARDS = "UNIQUE_CARDS",
}

export interface ComponentRandomHoldersWeightItemI {
  itemType: ComponentRandomHoldersWeightType;
  name: string;
}

export default function ComponentRandomHoldersWeight({
  selected,
  onChange,
}: {
  selected: ComponentRandomHoldersWeightType;
  onChange: (value: ComponentRandomHoldersWeightType) => void;
}) {
  const items: ComponentRandomHoldersWeightItemI[] = [
    {
      itemType: ComponentRandomHoldersWeightType.OFF,
      name: "Off",
    },
    {
      itemType: ComponentRandomHoldersWeightType.TOTAL_CARDS,
      name: "Total cards",
    },
    {
      itemType: ComponentRandomHoldersWeightType.UNIQUE_CARDS,
      name: "Unique cards",
    },
  ];
  return (
    <fieldset>
      <legend className="tw-text-sm tw-font-medium tw-text-neutral-100">
        Weighted by
      </legend>
      <div className="tw-space-y-4 sm:tw-flex sm:tw-items-center sm:tw-space-x-10 sm:tw-space-y-0">
        {items.map((item) => (
          <ComponentRandomHoldersWeightItem
            item={item}
            activeType={selected}
            onChange={onChange}
            key={item.itemType}
          />
        ))}
      </div>
    </fieldset>
  );
}
