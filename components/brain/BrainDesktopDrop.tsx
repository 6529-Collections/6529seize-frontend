import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { WaveDrop } from "../waves/detailed/drop/WaveDrop";

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
