import { useState } from "react";
import ModalWrapper from "../../../common/modal/ModalWrapper";

export default function RepGiveBtn({
  activeAddress,
}: {
  activeAddress: string;
}) {
  const [isGiving, setIsGiving] = useState(false);
  return (
    <div id="allowlist-tool">
      <button onClick={() => setIsGiving((prev) => !prev)}>Give rep</button>
      <ModalWrapper showModal={isGiving} onClose={() => setIsGiving(false)} title="Awesome stuff">
      <div className="tw-rounded-lg tw-overflow-hidden">
      <div className="tw-p-6 tw-max-h-[calc(100vh_+_-100px)] tw-overflow-y-auto">
        <div>
          <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-neutral-100">
            Blocks that includes 
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-neutral-400">
            Total: 
          </p>
        </div>
        <div className="tw-mt-4 tw-space-y-0.5">
     
        </div>
      </div>
    </div>
      </ModalWrapper>
    </div>
  );
}
