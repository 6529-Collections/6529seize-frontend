import { useState } from "react";
import ModalWrapper, { ModalSize } from "../../../common/modal/ModalWrapper";
import RepGiveModal from "./RepGiveModal";
import { Poppins } from "next/font/google";
import RepGiven from "../RepGiven";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export default function RepGiveBtn({
  giverAddress,
  receiverAddress,
}: {
  giverAddress: string;
  receiverAddress: string;
}) {
  const [isGiving, setIsGiving] = useState(false);
  return (
    <div className={`tailwind-scope ${poppins.className}`}>
      <button onClick={() => setIsGiving((prev) => !prev)}>Give rep</button>
      <RepGiven wallet={receiverAddress} />
      <ModalWrapper
        showModal={isGiving}
        onClose={() => setIsGiving(false)}
        modalSize={ModalSize.LARGE}
      >
        <RepGiveModal
          giverAddress={giverAddress}
          receiverAddress={receiverAddress}
        />
      </ModalWrapper>
    </div>
  );
}
