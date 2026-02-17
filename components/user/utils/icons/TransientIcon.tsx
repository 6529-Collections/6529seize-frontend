import Image from "next/image";

export default function TransientIcon() {
  return (
    <Image
      src="/transient.avif"
      alt="Transient"
      width={20}
      height={20}
      // Some local Sharp builds fail AVIF optimization; serve this static asset directly.
      unoptimized
      className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-rounded-full tw-object-contain tw-align-top"
    />
  );
}
