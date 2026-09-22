import type { CreateWaveProposalCardMode } from "@/types/waves.types";

export default function ProposalCardLayoutPreview({
  mode,
  className,
}: {
  readonly mode: CreateWaveProposalCardMode;
  readonly className: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 34 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1.5" y="1.5" width="31" height="19" rx="3" />
      {mode === "standard" ? (
        <>
          <circle cx="6" cy="6" r="1.7" fill="currentColor" stroke="none" />
          <path d="M10 6h10" />
          <path d="M4.5 10h25M4.5 13.5h22M4.5 17h18" opacity="0.65" />
        </>
      ) : (
        <>
          <path d="M4.5 9h11" strokeWidth="2" />
          <path d="M4.5 13h13" opacity="0.65" />
          <rect
            x="21"
            y="6"
            width="8.5"
            height="10"
            rx="1.5"
            fill="currentColor"
            stroke="none"
            opacity="0.65"
          />
        </>
      )}
    </svg>
  );
}
