import Button from "./Button";

interface ActionButtonProps {
  readonly onClicked?: (() => void) | undefined;
  readonly children: React.ReactNode;
  readonly size?: "default" | "sm" | undefined;
  readonly disabled?: boolean | undefined;
  readonly loading?: boolean | undefined;
  readonly type?: "button" | "submit" | undefined;
  readonly ariaLabel?: string | undefined;
  readonly className?: string | undefined;
}

export default function ActionButton({
  onClicked,
  children,
  size = "default",
  disabled = false,
  loading = false,
  type = "button",
  ariaLabel,
  className = "",
}: ActionButtonProps) {
  return (
    <Button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      loading={loading}
      onClick={onClicked}
      variant="action"
      size={size === "sm" ? "xs" : "md"}
      className={className}
    >
      {children}
    </Button>
  );
}
