import Button from "./Button";
import ButtonLink from "./ButtonLink";
import type { ButtonSize } from "./buttonStyles";

type PrimaryButtonSize = "default" | "sm" | "lg";

interface PrimaryButtonProps {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly size?: PrimaryButtonSize | undefined;
  readonly padding?: string | undefined;
  readonly title?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly className?: string | undefined;
  readonly hideChildrenWhenLoading?: boolean | undefined;
  readonly href?: string | undefined;
}

const BUTTON_SIZE_BY_LEGACY_SIZE: Record<PrimaryButtonSize, ButtonSize> = {
  default: "md",
  sm: "xs",
  lg: "lg",
};

export default function PrimaryButton({
  loading,
  disabled,
  onClicked,
  children,
  size = "default",
  padding,
  title,
  ariaLabel,
  className = "",
  hideChildrenWhenLoading = false,
  href,
}: PrimaryButtonProps) {
  const buttonSize = BUTTON_SIZE_BY_LEGACY_SIZE[size];
  const classes = [padding, className].filter(Boolean).join(" ") || undefined;

  if (href && !disabled && !loading) {
    return (
      <ButtonLink
        href={href}
        variant="primary"
        size={buttonSize}
        title={title}
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </ButtonLink>
    );
  }

  return (
    <Button
      onClick={onClicked}
      disabled={disabled}
      loading={loading}
      hideChildrenWhenLoading={hideChildrenWhenLoading}
      type="button"
      variant="primary"
      size={buttonSize}
      title={title}
      aria-label={ariaLabel}
      className={classes}
    >
      {children}
    </Button>
  );
}
