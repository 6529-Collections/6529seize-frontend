import Image from "next/image";

type LogoIconColor = "white" | "black";

const LogoIcon = ({
  className,
  color = "white",
}: {
  readonly className?: string | undefined;
  readonly color?: LogoIconColor | undefined;
}) => {
  const wrapperClassName = className
    ? `tw-relative tw-inline-block tw-align-middle ${className}`
    : "tw-relative tw-inline-block tw-size-6 tw-align-middle";
  const imageClassName =
    "tw-absolute tw-inset-0 tw-h-full tw-w-full tw-transition-opacity tw-duration-75 motion-reduce:tw-transition-none";

  return (
    <span aria-hidden="true" className={wrapperClassName}>
      <Image
        alt=""
        aria-hidden="true"
        className={`${imageClassName} ${
          color === "black" ? "tw-opacity-0" : "tw-opacity-100"
        }`}
        draggable={false}
        height={192}
        unoptimized
        width={192}
        src="/6529.svg"
      />
      <Image
        alt=""
        aria-hidden="true"
        className={`${imageClassName} ${
          color === "black" ? "tw-opacity-100" : "tw-opacity-0"
        }`}
        draggable={false}
        height={192}
        unoptimized
        width={192}
        src="/6529-black.svg"
      />
    </span>
  );
};

export default LogoIcon;
