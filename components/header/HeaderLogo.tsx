import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.scss";

interface HeaderLogoProps {
  readonly isSmall?: boolean;
  readonly isCapacitor: boolean;
  readonly isMobile: boolean;
}

export default function HeaderLogo({
  isSmall,
  isCapacitor,
  isMobile,
}: HeaderLogoProps) {
  const { theme } = useTheme();

  const logoSrc: string = theme === "light" ? "/6529black.png" : "/6529.png";
  let logoWidth: number = 50;
  let logoHeight: number = 50;

  if (isCapacitor || isMobile) {
    logoWidth = 40;
    logoHeight = 40;
  }

  const logoClassName =
    isSmall || isCapacitor || isMobile ? styles.logoIconSmall : styles.logoIcon;

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
