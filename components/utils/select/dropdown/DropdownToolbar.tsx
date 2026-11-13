import type { ComponentPropsWithoutRef } from "react";

export default function DropdownToolbar({
  className = "",
  size = "md",
  ...props
}: Readonly<ComponentPropsWithoutRef<"div">> & {
  readonly size?: "sm" | "md";
}) {
  const triggerClasses =
    "[&_button[aria-haspopup]]:tw-h-10 [&_button[aria-haspopup]]:tw-py-2";

  const compactTriggerClasses =
    "[&_button[aria-haspopup]]:tw-h-8 [&_button[aria-haspopup]]:tw-py-0 [&_button[aria-haspopup]]:tw-pl-2.5";

  return (
    <div
      {...props}
      className={`${className} ${size === "sm" ? compactTriggerClasses : triggerClasses}`}
    />
  );
}
