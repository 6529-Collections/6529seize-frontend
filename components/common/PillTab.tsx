import type { ComponentProps } from "react";
import clsx from "clsx";
import TabButton from "./TabButton";
import { getPillTabClasses, type PillTabSize } from "./pillTabStyles";

type PillTabProps = ComponentProps<"button"> & {
  readonly active: boolean;
  readonly size?: PillTabSize | undefined;
  readonly transition?: boolean | undefined;
};

export default function PillTab({
  active,
  size = "sm",
  transition = false,
  type = "button",
  className,
  ...props
}: PillTabProps) {
  const Button = transition ? TabButton : "button";

  return (
    <Button
      {...props}
      type={type}
      className={clsx(getPillTabClasses({ active, size }), className)}
    />
  );
}
