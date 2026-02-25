interface DropForgeMediaTypePillProps {
  label: string;
  className?: string;
}

export default function DropForgeMediaTypePill({
  label,
  className = "",
}: Readonly<DropForgeMediaTypePillProps>) {
  return (
    <span
      className={`tw-inline-flex tw-w-fit tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-uppercase tw-tracking-wider tw-text-white ${className}`}
    >
      {label}
    </span>
  );
}
