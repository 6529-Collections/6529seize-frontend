import React from "react";

interface MemeWinnerCalloutProps {
  readonly message?: string;
}

export default function MemeWinnerCallout({
  message = "Winner: This artwork has been selected as a winner in The Memes collection",
}: MemeWinnerCalloutProps) {
  return (
    <div className="tw-p-4 tw-bg-gradient-to-r tw-from-green/20 tw-to-green/20 tw-border-l-2 tw-border-green-500 tw-rounded-lg tw-shadow-sm">
      <p className="tw-text-green tw-text-sm tw-font-medium tw-mb-0">
        {message}
      </p>
    </div>
  );
}