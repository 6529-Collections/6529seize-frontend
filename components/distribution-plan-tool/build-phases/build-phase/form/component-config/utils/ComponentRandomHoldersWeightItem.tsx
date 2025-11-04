"use client";

import { useEffect, useState } from "react";
import {
    ComponentRandomHoldersWeightItemI,
    ComponentRandomHoldersWeightType,
} from "./ComponentRandomHoldersWeight";

export default function ComponentRandomHoldersWeightItem({
  item,
  activeType,
  onChange,
}: {
  item: ComponentRandomHoldersWeightItemI;
  activeType: ComponentRandomHoldersWeightType;
  onChange: (value: ComponentRandomHoldersWeightType) => void;
}) {
  const [isActive, setIsActive] = useState<boolean>(
    item.itemType === activeType
  );

  useEffect(() => {
    setIsActive(item.itemType === activeType);
  }, [activeType, item.itemType]);

  const htmlFor = `random-holders-weight-${item.itemType}`;
  return (
    <div className="tw-cursor-pointer tw-flex tw-items-center">
      <input
        type="radio"
        name={htmlFor}
        id={htmlFor}
        checked={isActive}
        onChange={() => onChange(item.itemType)}
        className="tw-cursor-pointer tw-form-radio tw-h-4 tw-w-4 tw-border-iron-600 tw-bg-iron-700 tw-text-primary-500 focus:tw-ring-primary-500"
      />
      <label
        className="tw-cursor-pointer tw-ml-3 tw-block tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100"
        htmlFor={htmlFor}>
        {item.name}
      </label>
    </div>
  );
}
