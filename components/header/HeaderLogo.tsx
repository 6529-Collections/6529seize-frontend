import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.scss";

interface HeaderLogoProps {
  readonly isCapacitor: boolean;
  readonly isMobile: boolean;
}

export default function HeaderLogo({
  isCapacitor,
  isMobile,
}: HeaderLogoProps) {
  const logoSrc: string = "/6529.png";
  let logoWidth: number = 50;
  let logoHeight: number = 50;
  
  if (isCapacitor || isMobile) {
    logoWidth = 40;
    logoHeight = 40;
  }

  const logoClassName = isCapacitor || isMobile
    ? styles.logoIconSmall
    : styles.logoIcon;

  return (
    <Link href="/">
      <Image
        unoptimized
        loading="eager"
        priority
        className={logoClassName}
        src={logoSrc}
        alt="6529Seize"
        width={logoWidth}
        height={logoHeight}
      />
    </Link>
  );
}
