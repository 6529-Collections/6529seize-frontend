import type { ComponentProps } from "react";
import clsx from "clsx";
import TabButton from "./TabButton";
import {
  getUnderlineTabClasses,
  type UnderlineTabSize,
} from "./underlineTabStyles";

type UnderlineTabProps = ComponentProps<"button"> & {
  readonly active: boolean;
  readonly size?: UnderlineTabSize | undefined;
  readonly externalIndicator?: boolean | undefined;
  readonly transition?: boolean | undefined;
};

export default function UnderlineTab({
  active,
  size = "default",
  externalIndicator = false,
  transition = false,
  className,
  ...props
}: UnderlineTabProps) {
  const Button = transition ? TabButton : "button";

  return (
    <Button
      {...props}
      className={clsx(
        getUnderlineTabClasses({ active, size, externalIndicator }),
        className
      )}
    />
  );
}
