import Image from "next/image";

/** A system's logo on a small white tile, as the downloads list shows it. */
export default function AiSystemLogo({
  src,
  size = "md",
}: {
  readonly src: string;
  /** `sm` in a tab, `md` beside a heading. */
  readonly size?: "sm" | "md" | undefined;
}) {
  const small = size === "sm";
  return (
    <span
      className={`tw-flex tw-flex-none tw-items-center tw-justify-center tw-bg-white ${small ? "tw-size-5 tw-rounded-md" : "tw-size-8 tw-rounded-lg"}`}
    >
      <Image
        unoptimized
        src={src}
        alt=""
        width={small ? 12 : 18}
        height={small ? 12 : 18}
        className={`tw-object-contain ${small ? "tw-size-3" : "tw-size-[18px]"}`}
      />
    </span>
  );
}
