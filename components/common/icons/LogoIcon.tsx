import type { CSSProperties } from "react";

const logoMaskStyle = {
  WebkitMaskImage: "url('/6529.svg')",
  maskImage: "url('/6529.svg')",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  maskSize: "contain",
} satisfies CSSProperties;

const LogoIcon = ({
  className,
}: {
  readonly className?: string | undefined;
}) => {
  const wrapperClassName = className
    ? `tw-inline-block tw-bg-current tw-align-middle ${className}`
    : "tw-inline-block tw-size-6 tw-bg-current tw-align-middle";

  return (
    <span
      aria-hidden="true"
      className={wrapperClassName}
      style={logoMaskStyle}
    />
  );
};

export default LogoIcon;
