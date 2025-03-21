import React from "react";

interface MemeWinnerDescriptionProps {
  readonly description: string;
}

export default function MemeWinnerDescription({
  description,
}: MemeWinnerDescriptionProps) {
  return (
    <div>
      <p className="tw-text-iron-400 tw-mb-0 tw-text-md">{description}</p>
    </div>
  );
}