import type { ReactNode } from "react";

export function GrantListItemContainer({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <li className="tw-list-none tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      {children}
    </li>
  );
}
