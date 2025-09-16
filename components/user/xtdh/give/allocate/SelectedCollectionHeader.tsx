"use client";

import { short } from "./utils";

export default function SelectedCollectionHeader({
  name,
  address,
}: {
  readonly name?: string;
  readonly address: string;
}) {
  return (
    <div className="tw-text-iron-200 tw-text-sm">
      Selected: {name || short(address)} ({short(address)})
    </div>
  );
}

