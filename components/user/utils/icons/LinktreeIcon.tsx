import Image from "next/image";

export default function LinktreeIcon() {
  return (
    <Image
      src="/linktree-logo-icon.svg"
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-object-contain tw-align-top"
    />
  );
}
