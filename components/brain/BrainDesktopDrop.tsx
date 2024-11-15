import { AnimatePresence, motion } from "framer-motion";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useWaveData } from "../../hooks/useWaveData";
import { WaveDrop } from "../waves/detailed/drop/WaveDrop";

interface Props {

}

const BrainDesktopDrop: React.FC<Props> = () => {

  return (
    <div className="tw-absolute tw-inset-0 tw-bg-red tw-z-1000"></div>
  );
};

export default BrainDesktopDrop;
