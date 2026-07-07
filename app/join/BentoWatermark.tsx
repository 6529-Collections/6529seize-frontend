import type { ComponentType } from "react";
import {
  CalendarDaysIcon,
  LifebuoyIcon,
  LinkIcon,
} from "@heroicons/react/24/solid";

import WavesIcon from "@/components/common/icons/WavesIcon";

type BentoWatermarkVariant = "waves" | "subscriptions" | "delegation" | "help";
type WatermarkIcon = ComponentType<{ readonly className?: string }>;

const BASE_CLASS =
  "tw-pointer-events-none tw-absolute -tw-bottom-10 -tw-right-10 tw-z-0 tw-transform tw-text-white/[0.025] tw-transition-all tw-duration-1000 tw-ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:tw-transform-none motion-reduce:tw-transition-none";

const WATERMARKS: Record<
  BentoWatermarkVariant,
  { readonly Icon: WatermarkIcon; readonly className: string }
> = {
  waves: {
    Icon: WavesIcon,
    className:
      "tw-h-[210px] tw-w-[210px] group-hover:-tw-translate-y-4 group-hover:tw-rotate-6 group-hover:tw-text-[#7000ff]/10 group-hover:tw-drop-shadow-[0_0_30px_rgba(112,0,255,0.3)]",
  },
  delegation: {
    Icon: LinkIcon,
    className:
      "tw-h-[200px] tw-w-[200px] group-hover:-tw-rotate-12 group-hover:tw-text-orange-400/10 group-hover:tw-drop-shadow-[0_0_20px_rgba(251,146,60,0.2)]",
  },
  help: {
    Icon: LifebuoyIcon,
    className:
      "tw-h-[200px] tw-w-[200px] group-hover:tw-scale-110 group-hover:tw-rotate-6 group-hover:tw-text-[#00f0ff]/10 group-hover:tw-drop-shadow-[0_0_20px_rgba(0,240,255,0.2)]",
  },
  subscriptions: {
    Icon: CalendarDaysIcon,
    className:
      "tw-h-[210px] tw-w-[210px] group-hover:tw-scale-110 group-hover:tw-text-[#00f0ff]/10 group-hover:tw-drop-shadow-[0_0_24px_rgba(0,240,255,0.18)]",
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
