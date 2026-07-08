import type { ComponentType } from "react";

import WavesIcon from "@/components/common/icons/WavesIcon";

type BentoWatermarkVariant =
  | "memes"
  | "waves"
  | "subscriptions"
  | "delegation"
  | "help";
type WatermarkIcon = ComponentType<{ readonly className?: string }>;

function PaletteIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="6.5" cy="12.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
    </svg>
  );
}

function CalendarClockIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path d="M16 14v2.2l1.6 1" />
      <path d="M16 2v4" />
      <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
      <path d="M3 10h5" />
      <path d="M8 2v4" />
      <circle cx="16" cy="16" r="6" />
    </svg>
  );
}

function SplitIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path d="M16 3h5v5" />
      <path d="M8 3H3v5" />
      <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
      <path d="m15 9 6-6" />
    </svg>
  );
}

function MessageCircleQuestionIcon({
  className,
}: {
  readonly className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

const BASE_CLASS =
  "tw-pointer-events-none tw-absolute -tw-bottom-6 -tw-right-6 tw-z-0 tw-transform tw-text-white/[0.025] tw-transition-all tw-duration-1000 tw-ease-[cubic-bezier(0.16,1,0.3,1)] sm:-tw-bottom-10 sm:-tw-right-10 motion-reduce:tw-transform-none motion-reduce:tw-transition-none";

const WATERMARKS: Record<
  BentoWatermarkVariant,
  { readonly Icon: WatermarkIcon; readonly className: string }
> = {
  memes: {
    Icon: PaletteIcon,
    className:
      "tw-h-[150px] tw-w-[150px] sm:tw-h-[190px] sm:tw-w-[190px] lg:tw-h-[210px] lg:tw-w-[210px] group-hover:-tw-translate-y-3 group-hover:tw-rotate-3 group-hover:tw-text-primary-300/[0.06] group-hover:tw-drop-shadow-[0_0_18px_rgba(0,240,255,0.12)]",
  },
  waves: {
    Icon: WavesIcon,
    className:
      "tw-h-[150px] tw-w-[150px] sm:tw-h-[190px] sm:tw-w-[190px] lg:tw-h-[210px] lg:tw-w-[210px] group-hover:-tw-translate-y-4 group-hover:tw-rotate-6 group-hover:tw-text-[#7000ff]/[0.06] group-hover:tw-drop-shadow-[0_0_22px_rgba(112,0,255,0.16)]",
  },
  delegation: {
    Icon: SplitIcon,
    className:
      "tw-h-[145px] tw-w-[145px] sm:tw-h-[180px] sm:tw-w-[180px] lg:tw-h-[200px] lg:tw-w-[200px] group-hover:-tw-rotate-12 group-hover:tw-text-orange-400/[0.06] group-hover:tw-drop-shadow-[0_0_16px_rgba(251,146,60,0.12)]",
  },
  help: {
    Icon: MessageCircleQuestionIcon,
    className:
      "tw-h-[145px] tw-w-[145px] sm:tw-h-[180px] sm:tw-w-[180px] lg:tw-h-[200px] lg:tw-w-[200px] group-hover:tw-scale-110 group-hover:tw-rotate-6 group-hover:tw-text-[#00f0ff]/[0.06] group-hover:tw-drop-shadow-[0_0_16px_rgba(0,240,255,0.12)]",
  },
  subscriptions: {
    Icon: CalendarClockIcon,
    className:
      "tw-h-[150px] tw-w-[150px] sm:tw-h-[190px] sm:tw-w-[190px] lg:tw-h-[210px] lg:tw-w-[210px] group-hover:tw-scale-110 group-hover:tw-text-[#00f0ff]/[0.06] group-hover:tw-drop-shadow-[0_0_18px_rgba(0,240,255,0.12)]",
  },
};

export function BentoWatermark({
  variant,
}: {
  readonly variant: BentoWatermarkVariant;
}) {
  const { Icon, className } = WATERMARKS[variant];

  return (
    <div aria-hidden="true">
      <Icon className={`${BASE_CLASS} ${className}`} />
    </div>
  );
}
