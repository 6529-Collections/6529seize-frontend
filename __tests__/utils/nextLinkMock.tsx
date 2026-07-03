import type { AnchorHTMLAttributes } from "react";

export type MockNextLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export function mockNextLinkComponent({
  children,
  href,
  ...props
}: MockNextLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
