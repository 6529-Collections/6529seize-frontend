import { AnimatePresence, motion } from "framer-motion";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useWaveData } from "../../hooks/useWaveData";
import { WaveDrop } from "../waves/detailed/drop/WaveDrop";
import { ApiWave } from "../../generated/models/ApiWave";

interface Props {
  readonly drop: ExtendedDrop 
  readonly wave: ApiWave;
  readonly onClose: () => void;
}

const BrainDesktopDrop: React.FC<Props> = ({ drop, wave, onClose }) => {

  return (
    <div className="tw-full">
      <WaveDrop wave={wave} drop={drop} onClose={onClose} />
    </div>
  );
};

export default BrainDesktopDrop;
