import Button from "./Button";

interface SecondaryButtonProps {
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly size?: "default" | "sm" | undefined;
  readonly disabled?: boolean | undefined;
  readonly className?: string | undefined;
  readonly loading?: boolean | undefined;
}

export default function SecondaryButton({
  onClicked,
  children,
  size = "default",
  disabled = false,
  className = "",
  loading = false,
}: SecondaryButtonProps) {
  return (
    <Button
      type="button"
      disabled={disabled}
      loading={loading}
      variant="secondary"
      size={size === "sm" ? "xs" : "md"}
      className={className}
      onClick={onClicked}
    >
      {children}
    </Button>
  );
}
