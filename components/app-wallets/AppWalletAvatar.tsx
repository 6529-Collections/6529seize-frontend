import styles from "./AppWallet.module.scss";
import Image from "next/image";

export default function AppWalletAvatar(
  props: Readonly<{ address: string; size?: number | undefined }>
) {
  const size = props.size ?? 36;
  return (
    <Image
      unoptimized
      className={styles["appWalletAvatar"]}
      fetchPriority="high"
      loading="eager"
      height={size}
      width={size}
      src={`https://robohash.org/${props.address}.png`}
      alt={props.address}
    />
  );
}
