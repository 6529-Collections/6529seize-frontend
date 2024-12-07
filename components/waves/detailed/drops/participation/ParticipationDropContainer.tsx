import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { ApiDropType } from "../../../../../generated/models/ApiDropType";
import { DropLocation } from "../Drop";

interface ParticipationDropContainerProps {
  readonly drop: ExtendedDrop;
  readonly isActiveDrop: boolean;
  readonly location: DropLocation;
  readonly children: React.ReactNode;
}

const getColorClasses = ({
  isActiveDrop,
  rank,
  isDrop,
}: {
  isActiveDrop: boolean;
  rank: number | null;
  isDrop: boolean;
}): {
  container: string;
  text: string;
  metadataKey: string;
  metadataValue: string;
} => {
  if (!isDrop)
    return {
      container: "tw-bg-iron-950",
      text: "",
      metadataKey: "tw-text-iron-400",
      metadataValue: "tw-text-iron-200",
    };

  const rankStyles = {
    1: {
      base: "tw-border tw-border-solid tw-border-amber-400/20 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(66,56,41,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(251,191,36,0.05),0_0_15px_rgba(251,191,36,0.1)]",
      hover:
        "hover:tw-shadow-[inset_0_0_25px_rgba(251,191,36,0.1),0_0_25px_rgba(251,191,36,0.15)] hover:tw-border-amber-400/30 hover:tw-bg-[linear-gradient(90deg,rgba(35,35,41,0.92)_0%,rgba(71,61,46,0.97)_100%)]",
      active:
        "tw-border-l-4 tw-border-l-amber-400 tw-border-y tw-border-y-amber-400/20 tw-border-r tw-border-r-amber-400/20 tw-bg-[linear-gradient(90deg,rgba(66,56,41,0.95)_0%,rgba(31,31,37,0.9)_100%)] tw-shadow-[inset_0_0_30px_rgba(251,191,36,0.2)]",
      metadataKey: "tw-text-amber-400/70",
      metadataValue: "tw-text-amber-200/90",
    },
    2: {
      base: "tw-border tw-border-solid tw-border-slate-400/20 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(45,45,50,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(226,232,240,0.05),0_0_15px_rgba(226,232,240,0.1)]",
      hover:
        "hover:tw-shadow-[inset_0_0_25px_rgba(226,232,240,0.1),0_0_25px_rgba(226,232,240,0.15)] hover:tw-border-slate-400/30 hover:tw-bg-[linear-gradient(90deg,rgba(35,35,41,0.92)_0%,rgba(50,50,55,0.97)_100%)]",
      active:
        "tw-border-l-4 tw-border-l-slate-400 tw-border-y tw-border-y-slate-400/20 tw-border-r tw-border-r-slate-400/20 tw-bg-[linear-gradient(90deg,rgba(45,45,50,0.95)_0%,rgba(31,31,37,0.9)_100%)] tw-shadow-[inset_0_0_30px_rgba(226,232,240,0.2)]",
      metadataKey: "tw-text-slate-400/70",
      metadataValue: "tw-text-slate-200/90",
    },
    3: {
      base: "tw-border tw-border-solid tw-border-[#CD7F32]/20 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(60,46,36,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(205,127,50,0.05),0_0_15px_rgba(205,127,50,0.1)]",
      hover:
        "hover:tw-shadow-[inset_0_0_25px_rgba(205,127,50,0.1),0_0_25px_rgba(205,127,50,0.15)] hover:tw-border-[#CD7F32]/30 hover:tw-bg-[linear-gradient(90deg,rgba(35,35,41,0.92)_0%,rgba(65,51,41,0.97)_100%)]",
      active:
        "tw-border-l-4 tw-border-l-[#CD7F32] tw-border-y tw-border-y-[#CD7F32]/20 tw-border-r tw-border-r-[#CD7F32]/20 tw-bg-[linear-gradient(90deg,rgba(60,46,36,0.95)_0%,rgba(31,31,37,0.9)_100%)] tw-shadow-[inset_0_0_30px_rgba(205,127,50,0.2)]",
      metadataKey: "tw-text-[#CD7F32]/70",
      metadataValue: "tw-text-[#CD7F32]/90",
    },
    default: {
      base: "tw-border tw-border-solid tw-border-iron-600/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.95)_0%,rgba(35,35,40,0.98)_100%)] tw-shadow-[inset_0_0_16px_rgba(255,255,255,0.03)]",
      hover:
        "hover:tw-shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:tw-border-iron-500/40",
      active:
        "tw-border-l-4 tw-border-l-iron-400 tw-border-y tw-border-y-iron-400/20 tw-border-r tw-border-r-iron-400/20 tw-bg-[linear-gradient(90deg,rgba(35,35,40,0.98)_0%,rgba(31,31,37,0.95)_100%)] tw-shadow-[inset_0_0_25px_rgba(255,255,255,0.1)]",
      metadataKey: "tw-text-iron-400",
      metadataValue: "tw-text-iron-200",
    },
  };

  const style =
    rankStyles[rank as keyof typeof rankStyles] ?? rankStyles.default;
  const classes = [style.base, style.hover];

  if (isActiveDrop) {
    classes.push(style.active);
  }

  return {
    container: classes.join(" "),
    text: "",
    metadataKey: style.metadataKey,
    metadataValue: style.metadataValue,
  };
};

export default function ParticipationDropContainer({
  drop,
  isActiveDrop,
  location,
  children
}: ParticipationDropContainerProps) {
  const isDrop = drop.drop_type === ApiDropType.Participatory;
  const rank = drop.rank;
  const colorClasses = getColorClasses({ isActiveDrop, rank, isDrop });

  return (
    <div className={`${location === DropLocation.WAVE ? "tw-px-4" : ""}`}>
      <div
        className={`tw-relative tw-w-full tw-rounded-xl tw-my-4 ${colorClasses.container} tw-overflow-hidden tw-backdrop-blur-sm
          tw-transition-all tw-duration-300 tw-ease-out
          tw-shadow-lg tw-shadow-black/5
          hover:tw-shadow-xl hover:tw-shadow-black/10
          tw-group`}
      >
        {children}
      </div>
    </div>
  );
}

export { getColorClasses }; 
