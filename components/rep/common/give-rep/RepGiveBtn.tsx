import { useState } from "react";
import ModalWrapper, { ModalSize } from "../../../common/modal/ModalWrapper";
import RepGiveModal from "./RepGiveModal";

export default function RepGiveBtn({
  giverAddress,
  receiverAddress,
  maxVotes,
  onNewVote,
}: {
  giverAddress: string;
  receiverAddress: string;
  maxVotes: number;
  onNewVote: () => void;
}) {
  const [isGiving, setIsGiving] = useState(false);
  const onRepGiven = () => {
    setIsGiving(false);
    onNewVote();
  };
  return (
    <div>
      <button
        className="tw-rounded tw-w-16 tw-bg-white/10 tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-text-white tw-shadow-sm tw-hover:bg-white/20"
        onClick={() => setIsGiving((prev) => !prev)}
      >
        Vote
      </button>
      <ModalWrapper
        showModal={isGiving}
        onClose={() => setIsGiving(false)}
        modalSize={ModalSize.LARGE}
      >
        <RepGiveModal
          giverAddress={giverAddress}
          receiverAddress={receiverAddress}
          maxVotes={maxVotes}
          onRepGiven={onRepGiven}
        />
      </ModalWrapper>
    </div>
  );
}
