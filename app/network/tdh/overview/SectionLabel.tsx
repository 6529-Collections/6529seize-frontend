import { EX_TEXT } from "@/components/explained/tokens";

/** A section's number and name above its statement heading: "01 · The picture". */
export default function SectionLabel({
  no,
  label,
}: {
  readonly no: string;
  readonly label: string;
}) {
  return (
    <span className={`${EX_TEXT.label} tw-mb-3.5 tw-block`}>
      <span className="tw-text-primary-300">{no}</span>
      {` · ${label}`}
    </span>
  );
}
