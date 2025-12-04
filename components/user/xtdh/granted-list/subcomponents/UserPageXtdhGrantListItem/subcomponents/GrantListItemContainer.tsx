import type { ReactNode } from "react";

export function GrantListItemContainer({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <li className="tw-list-none tw-py-6 tw-px-6">
      {children}
    </li>
  );
}
