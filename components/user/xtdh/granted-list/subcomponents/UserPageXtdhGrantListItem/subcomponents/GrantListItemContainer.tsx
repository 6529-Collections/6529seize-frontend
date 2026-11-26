import type { ReactNode } from "react";

export function GrantListItemContainer({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <li className="tw-list-none tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900/50 tw-p-4 md:tw-p-6">
      {children}
    </li>
  );
}
