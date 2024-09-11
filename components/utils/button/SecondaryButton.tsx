import React from "react";

export default function SecondaryButton({
  onClicked,
  children,
}: {
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-shadow-sm hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
      onClick={onClicked}
    >
      {children}
    </button>
  );
}
