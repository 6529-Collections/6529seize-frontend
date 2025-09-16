"use client";

import { ReactNode } from "react";

export default function XTDHCard({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-bg-iron-900 tw-rounded-lg tw-border tw-border-iron-700 tw-p-4 lg:tw-p-5">
      <div className="tw-text-iron-100 tw-font-semibold tw-mb-3">{title}</div>
      {children}
    </div>
  );
}

