import clsx from "clsx";
import type { HTMLAttributes, TableHTMLAttributes } from "react";

import styles from "./AboutLayout.module.scss";

type AboutContainerProps = HTMLAttributes<HTMLDivElement> & {
  readonly fluid?: boolean;
};

type AboutColProps = HTMLAttributes<HTMLDivElement> & {
  readonly xs?: 12;
};

export function AboutContainer({
  children,
  className,
  fluid = false,
  ...props
}: Readonly<AboutContainerProps>) {
  return (
    <div
      className={clsx(
        "tw-mx-auto tw-w-full tw-px-3",
        !fluid && styles.container,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AboutRow({
  children,
  className,
  ...props
}: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={clsx("-tw-mx-3 tw-flex tw-flex-wrap", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AboutCol({
  children,
  className,
  xs,
  ...props
}: Readonly<AboutColProps>) {
  return (
    <div
      className={clsx(
        xs === 12 ? "tw-w-full tw-flex-none" : "tw-flex-1",
        "tw-px-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AboutTable({
  children,
  className,
  ...props
}: Readonly<TableHTMLAttributes<HTMLTableElement>>) {
  return (
    <table
      className={clsx("tw-mb-4 tw-w-full tw-align-top", className)}
      {...props}
    >
      {children}
    </table>
  );
}
