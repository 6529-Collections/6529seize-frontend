import Image from "next/image";

export default function FoundationIcon() {
  return (
    <Image
      src="/foundation.png"
      alt="Foundation App"
      width={20}
      height={20}
      unoptimized
      className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-rounded-full tw-object-contain tw-align-top"
    />
  );
}
