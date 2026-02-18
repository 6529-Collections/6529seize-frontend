import Image from "next/image";

export default function ManifoldIcon() {
  return (
    <Image
      src="/manifold.png"
      alt="Manifold"
      width={20}
      height={20}
      className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-rounded-full tw-object-contain tw-align-top"
    />
  );
}
