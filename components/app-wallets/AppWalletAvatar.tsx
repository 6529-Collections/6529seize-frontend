import Image from "next/image";

export default function AppWalletAvatar(
  props: Readonly<{ address: string; size?: number | undefined }>
) {
  const size = props.size ?? 36;
  return (
    <Image
      unoptimized
      className="tw-shrink-0 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-0.5"
      fetchPriority="high"
      loading="eager"
      height={size}
      width={size}
      src={`https://robohash.org/${props.address}.png`}
      alt={props.address}
    />
  );
}
