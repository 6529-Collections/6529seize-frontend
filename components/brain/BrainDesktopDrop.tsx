import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDrop } from "../waves/drop/SingleWaveDrop";


interface Props {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
  readonly onContentReady?: () => void;
}

const BrainDesktopDrop: React.FC<Props> = ({ drop, onClose, onContentReady }) => {
  return (
    <div className="tw-absolute tw-inset-0 tw-z-1000 tailwind-scope">
      <SingleWaveDrop
        drop={drop}
        onClose={onClose}
        onContentReady={onContentReady}
      />
    </div>
  );
};

export default BrainDesktopDrop;
