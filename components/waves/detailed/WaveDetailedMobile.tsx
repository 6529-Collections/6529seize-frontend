import { ApiWave } from "../../../generated/models/ApiWave";
import { useCallback, useContext, useMemo, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { WaveDetailedView } from "./WaveDetailed";
import WaveDetailedMobileAbout from "./WaveDetailedMobileAbout";
import { WaveChat } from "./chat/WaveChat";
import { WaveLeaderboard } from "./leaderboard/WaveLeaderboard";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { AnimatePresence, motion } from "framer-motion";
import { WaveDrop } from "./drop/WaveDrop";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import { WaveOutcome } from "./outcome/WaveOutcome";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";

interface WaveDetailedMobileProps {
  readonly wave: ApiWave;
  readonly setView: (view: WaveDetailedView) => void;
  readonly activeDrop: ExtendedDrop | null;
  readonly setActiveDrop: (drop: ExtendedDrop | null) => void;
  readonly onWaveChange: (wave: ApiWave) => void;
  readonly setIsLoading: (isLoading: boolean) => void;
}

export enum WaveDetailedMobileView {
  CHAT = "CHAT",
  LEADERBOARD = "LEADERBOARD",
  ABOUT = "ABOUT",
  OUTCOME = "OUTCOME",
}

const WaveDetailedMobile: React.FC<WaveDetailedMobileProps> = ({
  wave,
  setView,
  activeDrop,
  setActiveDrop,
  onWaveChange,
  setIsLoading,
}) => {
  const isDropWave = wave.wave.type !== ApiWaveType.Chat;
  const { votingState } = useWaveState(wave);

  const { connectedProfile, activeProfileProxy, showWaves } =
    useContext(AuthContext);

  const [activeView, setActiveView] = useState<WaveDetailedMobileView>(
    WaveDetailedMobileView.CHAT
  );

  const getIsAuthorAndNotProxy = useCallback(
    () =>
      connectedProfile?.profile?.handle === wave.author.handle &&
      !activeProfileProxy,
    [connectedProfile?.profile?.handle, wave.author.handle, activeProfileProxy]
  );

  const isAuthorAndNotProxy = useMemo(
    () => getIsAuthorAndNotProxy(),
    [getIsAuthorAndNotProxy]
  );

  const showRequiredMetadata = useMemo(
    () => isAuthorAndNotProxy || !!wave.participation.required_metadata.length,
    [isAuthorAndNotProxy, wave.participation.required_metadata.length]
  );

  const showRequiredTypes = useMemo(
    () => isAuthorAndNotProxy || !!wave.participation.required_media.length,
    [isAuthorAndNotProxy, wave.participation.required_media.length]
  );

  const handleWaveChange = useCallback(
    (newWave: ApiWave) => {
      setIsLoading(true);
      onWaveChange(newWave);
      setActiveView(WaveDetailedMobileView.CHAT);
      setView(WaveDetailedView.CHAT);
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    },
    [onWaveChange, setView, setIsLoading]
  );

  const components = useMemo(
    () => ({
      [WaveDetailedMobileView.CHAT]: (
        <WaveChat
          wave={wave}
          activeTab={WaveDetailedView.CHAT}
          setActiveTab={() => {}}
          onDropClick={setActiveDrop}
        />
      ),
      [WaveDetailedMobileView.LEADERBOARD]: (
        <WaveLeaderboard wave={wave} setActiveDrop={setActiveDrop}>
          <div></div>
        </WaveLeaderboard>
      ),
      [WaveDetailedMobileView.ABOUT]: (
        <WaveDetailedMobileAbout
          wave={wave}
          showRequiredMetadata={showRequiredMetadata}
          showRequiredTypes={showRequiredTypes}
          setView={setView}
          setActiveView={setActiveView}
          onWaveChange={handleWaveChange}
          setIsLoading={setIsLoading}
        />
      ),
      [WaveDetailedMobileView.OUTCOME]: <WaveOutcome wave={wave} />,
    }),
    [
      wave,
      setActiveDrop,
      showRequiredMetadata,
      showRequiredTypes,
      setView,
      handleWaveChange,
      setIsLoading,
    ]
  );

  if (!showWaves) {
    return null;
  }

  return (
    <div
      className="tailwind-scope tw-bg-black tw-relative"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <AnimatePresence mode="wait">
        {activeDrop && (
          <motion.div
            key={`drop-${activeDrop.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="tw-absolute lg:tw-ml-[21.5rem] tw-inset-0 tw-z-1000"
            style={{ willChange: "transform" }}
          >
            <WaveDrop drop={activeDrop} onClose={() => setActiveDrop(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="tw-px-4 min-[992px]:tw-px-3 tw-flex tw-gap-x-3 lg:tw-gap-x-4 tw-border-b tw-border-iron-800 tw-border-solid tw-border-t-0 tw-border-x-0">
        <button
          onClick={() => setActiveView(WaveDetailedMobileView.CHAT)}
          className={`tw-bg-transparent tw-text-base tw-font-semibold tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-b-2 ${
            activeView === WaveDetailedMobileView.CHAT
              ? "tw-border-primary-400 tw-text-iron-100 tw-whitespace-nowrap tw-font-semibold tw-py-3 tw-px-1"
              : "tw-border-transparent tw-text-iron-500 hover:tw-border-iron-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-3 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
          }`}
        >
          Chat
        </button>
        {isDropWave && (
          <button
            onClick={() => setActiveView(WaveDetailedMobileView.LEADERBOARD)}
            className={`tw-bg-transparent tw-text-base tw-font-semibold tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-b-2 ${
              activeView === WaveDetailedMobileView.LEADERBOARD
                ? "tw-border-primary-400 tw-text-iron-100 tw-whitespace-nowrap tw-font-semibold tw-py-3 tw-px-1"
                : "tw-border-transparent tw-text-iron-500 hover:tw-border-iron-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-3 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
            }`}
          >
            {votingState === WaveVotingState.ENDED ? "Winners" : "Leaderboard"}
          </button>
        )}
        {isDropWave && (
          <button
            onClick={() => setActiveView(WaveDetailedMobileView.OUTCOME)}
            className={`tw-bg-transparent tw-text-base tw-font-semibold tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-b-2 ${
              activeView === WaveDetailedMobileView.OUTCOME
                ? "tw-border-primary-400 tw-text-iron-100 tw-whitespace-nowrap tw-font-semibold tw-py-3 tw-px-1"
                : "tw-border-transparent tw-text-iron-500 hover:tw-border-iron-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-3 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
            }`}
          >
            Outcome
          </button>
        )}
        <button
          onClick={() => setActiveView(WaveDetailedMobileView.ABOUT)}
          className={`tw-bg-transparent tw-text-base tw-font-semibold tw-border-b-2 tw-border-solid tw-border-x-0 tw-border-t-0 ${
            activeView === WaveDetailedMobileView.ABOUT
              ? "tw-border-primary-400 tw-text-iron-100 tw-whitespace-nowrap tw-font-semibold tw-py-3 tw-px-1"
              : "tw-border-transparent tw-text-iron-500 hover:tw-border-iron-300 hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-3 tw-px-1 tw-transition tw-duration-300 tw-ease-out"
          }`}
        >
          About
        </button>
      </div>
      <div className="lg:tw-flex lg:tw-items-start lg:tw-justify-center lg:tw-gap-x-4">
        {components[activeView]}
      </div>
    </div>
  );
};

export default WaveDetailedMobile;
