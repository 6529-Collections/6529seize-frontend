import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"div"> & {
  readonly desktopOnly?: boolean;
};

export default function DropdownToolbar({
  desktopOnly = false,
  className = "",
  ...props
}: Readonly<Props>) {
  const triggerClasses = desktopOnly
    ? "lg:desktop-hover:[&_button[aria-haspopup]:hover]:tw-bg-iron-900 lg:[&_button[aria-haspopup]:not(:focus-visible)]:tw-ring-iron-800 lg:[&_button[aria-haspopup]>:last-child>svg]:tw-size-4 lg:[&_button[aria-haspopup]]:tw-h-10 lg:[&_button[aria-haspopup]]:tw-bg-iron-950 lg:[&_button[aria-haspopup]]:tw-py-2 lg:[&_button[aria-haspopup]]:tw-pl-3 lg:[&_button[aria-haspopup]]:tw-pr-7 lg:[&_button[aria-haspopup]]:tw-shadow-none"
    : "desktop-hover:[&_button[aria-haspopup]:hover]:tw-bg-iron-900 [&_button[aria-haspopup]:not(:focus-visible)]:tw-ring-iron-800 [&_button[aria-haspopup]>:last-child>svg]:tw-size-4 [&_button[aria-haspopup]]:tw-h-10 [&_button[aria-haspopup]]:tw-bg-iron-950 [&_button[aria-haspopup]]:tw-py-2 [&_button[aria-haspopup]]:tw-pl-3 [&_button[aria-haspopup]]:tw-pr-7 [&_button[aria-haspopup]]:tw-shadow-none";

  return <div {...props} className={`${className} ${triggerClasses}`} />;
}
