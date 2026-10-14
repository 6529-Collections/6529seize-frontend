import type { ReactNode } from "react";

interface GrantedListMessageProps {
  readonly children: ReactNode;
}

export function GrantedListMessage({ children }: Readonly<GrantedListMessageProps>) {
  return <p className="tw-text-sm tw-text-iron-300 tw-m-0 group-data-[typography=profile]/profile-xtdh:tw-text-meta group-data-[typography=profile]/profile-xtdh:tw-font-normal group-data-[typography=profile]/profile-xtdh:tw-text-iron-500">{children}</p>;
}
