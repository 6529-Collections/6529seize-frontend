import React from "react";

interface MemeDropHeaderProps {
  readonly title: string;
}

export default function MemeDropHeader({ title }: MemeDropHeaderProps) {
  return (
    <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
      {title}
    </h3>
  );
}
