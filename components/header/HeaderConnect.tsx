import { useAccount } from "wagmi";
import styles from "./Header.module.scss";
import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Web3Button } from "@web3modal/react";
import { AuthContext } from "../auth/Auth";
import WalletModal from "./walletModal/WalletModal";

export default function HeaderConnect() {
  const { myProfile, loadingMyProfile } = useContext(AuthContext);
  const account = useAccount();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (myProfile?.profile?.handle) {
      setDisplay(myProfile?.profile?.handle);
      return;
    }
    const wallet = myProfile?.consolidation.wallets.find(
      (w) =>
        w.wallet.address.toLowerCase() === account.address?.toLocaleLowerCase()
    );
    if (wallet?.wallet?.ens) {
      setDisplay(wallet.wallet.ens);
      return;
    }
    if (account.address) {
      setDisplay(account.address.slice(0, 6));
      return;
    }
    setDisplay("Connect");
  }, [myProfile, account.address]);

  return (
    <>
      {loadingMyProfile ? (
        <div></div>
      ) : account.isConnected && account.address ? (
        <>
          <button
            className={`${styles.userProfileBtn}`}
            onClick={() => setShowWalletModal(true)}
          >
            <b>
              &nbsp;
              {display}
              &nbsp;
            </b>
          </button>
          <button
            className={`${styles.userProfileBtn}`}
            onClick={() =>
              (window.location.href = `/${
                myProfile?.profile?.handle ?? account.address
              }`)
            }
          >
            <FontAwesomeIcon icon="user"></FontAwesomeIcon>
          </button>
        </>
      ) : (
        <Web3Button label="Connect" icon="hide" avatar="hide" balance="hide" />
      )}
      {account.address && (
        <WalletModal
          wallet={account.address}
          show={showWalletModal}
          onHide={() => setShowWalletModal(false)}
        />
      )}
    </>
  );
}
