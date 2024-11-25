import { AnimatePresence, motion } from "framer-motion";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useWaveData } from "../../hooks/useWaveData";
import { WaveDrop } from "../waves/detailed/drop/WaveDrop";
import { ApiWave } from "../../generated/models/ApiWave";

interface Props {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

const BrainDesktopDrop: React.FC<Props> = ({ drop, onClose }) => {
  return (
    <div className="tw-absolute tw-inset-0 tw-z-1000">
      <WaveDrop drop={drop} onClose={onClose} />
    </div>
  );
};

export default BrainDesktopDrop;
