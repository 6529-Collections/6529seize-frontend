import Image from "next/image";

type LogoIconColor = "white" | "black";

const LogoIcon = ({
  className,
  color = "white",
}: {
  readonly className?: string | undefined;
  readonly color?: LogoIconColor | undefined;
}) => (
  <Image
    alt=""
    aria-hidden="true"
    className={className}
    draggable={false}
    height={192}
    unoptimized
    width={192}
    src={color === "black" ? "/6529-black.svg" : "/6529.svg"}
  />
);

export default LogoIcon;
