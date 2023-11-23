import { useWeb3Modal } from "@web3modal/react";
import { useContext, useState } from "react";
import { useAccount } from "wagmi";
import { AuthContext } from "../../auth/Auth";
import UserPageIdentityRateModal from "./UserPageIdentityRateModal";

export default function UserPageIdentityRateButton() {
  const { open } = useWeb3Modal();
  const { address } = useAccount();
  const { requestAuth } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onCICRate = async () => {
    if (!address) {
      await open();
      return;
    }
    const { success } = await requestAuth();
    if (!success) {
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <button onClick={onCICRate}>Rate CIC</button>
      <UserPageIdentityRateModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </>
  );
}
