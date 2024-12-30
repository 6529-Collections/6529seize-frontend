import { motion } from "framer-motion";
import useCapacitor from "../../../hooks/useCapacitor";
import { ApiWave } from "../../../generated/models/ObjectSerializer";
import { WaveDetailedSmallLeaderboard } from "./small-leaderboard/WaveDetailedSmallLeaderboard";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import WaveDetailedRightSidebarToggle from "./WaveDetailedRightSidebarToggle";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import { WaveWinnersSmall } from "./winners/WaveWinnersSmall";

interface WaveDetailedRightSidebarProps {
  readonly wave: ApiWave;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const WaveDetailedRightSidebar: React.FC<WaveDetailedRightSidebarProps> = ({
  isOpen,
  wave,
  onToggle,
  onDropClick,
}) => {
  const capacitor = useCapacitor();
  const { votingState } = useWaveState(wave);

  const containerClassName = `${
    capacitor.isCapacitor ? "tw-pb-20" : ""
  } tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-z-40 tw-bg-iron-950 tw-flex tw-flex-col tw-w-full lg:tw-w-[20.5rem] 
  3xl:tw-w-[28rem] tw-border-solid tw-border-l-2 tw-border-iron-800 tw-border-y-0 tw-border-b-0 tw-border-r-0 tw-shadow-2xl`;

  return (
    <motion.div
      className={containerClassName}
      initial={false}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="tw-hidden lg:tw-block">
        <WaveDetailedRightSidebarToggle isOpen={isOpen} onToggle={onToggle} />
      </div>
      <div
        className={`${
          capacitor.isCapacitor
            ? "tw-mt-[10rem]"
            : "tw-mt-[5.6rem] xl:tw-mt-[6.25rem]"
        } tw-text-iron-500 tw-text-sm tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 
        tw-h-full`}
      >
        {votingState === WaveVotingState.ENDED ? (
          <WaveWinnersSmall wave={wave} onDropClick={onDropClick} />
        ) : (
          <WaveDetailedSmallLeaderboard wave={wave} onDropClick={onDropClick} />
        )}
      </div>
    </motion.div>
  );
};

export default WaveDetailedRightSidebar;
