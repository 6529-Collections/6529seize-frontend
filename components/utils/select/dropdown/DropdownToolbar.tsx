import type { ComponentPropsWithoutRef } from "react";

export default function DropdownToolbar({
  className = "",
  size = "md",
  ...props
}: Readonly<ComponentPropsWithoutRef<"div">> & {
  readonly size?: "sm" | "md";
}) {
  const triggerClasses =
    "desktop-hover:[&_button[aria-haspopup]:hover]:tw-bg-iron-900 [&_button[aria-haspopup]:not(:focus-visible)]:tw-ring-iron-800 [&_button[aria-haspopup]>:last-child>svg]:tw-size-4 [&_button[aria-haspopup]]:tw-h-10 [&_button[aria-haspopup]]:tw-bg-iron-950 [&_button[aria-haspopup]]:tw-py-2 [&_button[aria-haspopup]]:tw-pl-3 [&_button[aria-haspopup]]:tw-pr-7 [&_button[aria-haspopup]]:tw-shadow-none";

  const compactTriggerClasses =
    "desktop-hover:[&_button[aria-haspopup]:hover]:tw-bg-iron-900 [&_button[aria-haspopup]>:last-child>svg]:tw-size-3 [&_button[aria-haspopup]]:tw-h-8 [&_button[aria-haspopup]]:tw-border [&_button[aria-haspopup]]:tw-border-solid [&_button[aria-haspopup]]:tw-border-iron-800 [&_button[aria-haspopup]]:tw-bg-iron-950 [&_button[aria-haspopup]]:tw-py-0 [&_button[aria-haspopup]]:tw-pl-2.5 [&_button[aria-haspopup]]:tw-pr-8 [&_button[aria-haspopup]]:tw-text-iron-100 [&_button[aria-haspopup]]:tw-shadow-none [&_button[aria-haspopup]:not(:focus-visible)]:tw-ring-0";

  return (
    <div
      {...props}
      className={`${className} ${size === "sm" ? compactTriggerClasses : triggerClasses}`}
    />
  );
}
