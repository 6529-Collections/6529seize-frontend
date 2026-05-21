"use client";

interface Props {
  readonly text: string;
  readonly className?: string | undefined;
  readonly align?: "left" | "center" | undefined;
}

export default function CollectionCardMetricLine({
  text,
  className = "",
  align = "left",
}: Props) {
  const separatorIndex = text.indexOf(":");
  const textAlignClass = align === "center" ? "tw-text-center" : "tw-text-left";
  const baseClass = `tw-mt-2 tw-w-full ${textAlignClass} tw-text-xs tw-leading-5`;

  if (separatorIndex === -1) {
    return (
      <div className={`${baseClass} tw-text-iron-500 ${className}`.trim()}>
        {text}
      </div>
    );
  }

  const label = text.slice(0, separatorIndex + 1);
  const value = text.slice(separatorIndex + 1).trimStart();

  return (
    <div className={`${baseClass} ${className}`.trim()}>
      <span className="tw-text-iron-500">{label} </span>
      <span className="tw-font-semibold tw-text-iron-200">{value}</span>
    </div>
  );
}
