import React from "react";

interface MemeDropDescriptionProps {
  readonly description: string;
}

export default function MemeDropDescription({
  description,
}: MemeDropDescriptionProps) {
  return (
    <div>
      <p className="tw-text-iron-300 tw-mb-0">{description}</p>
    </div>
  );
}