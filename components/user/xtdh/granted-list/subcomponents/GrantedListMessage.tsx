import type { ReactNode } from "react";

interface GrantedListMessageProps {
  readonly children: ReactNode;
}

export function GrantedListMessage({ children }: Readonly<GrantedListMessageProps>) {
  return <p className="tw-text-sm tw-text-iron-300 tw-m-0">{children}</p>;
}
