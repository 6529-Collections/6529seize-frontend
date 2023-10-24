import { useAccount } from "wagmi";
import styles from "./Header.module.scss";
import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Web3Button } from "@web3modal/react";
import { AuthContext } from "../auth/Auth";
import WalletModal from "./walletModal/WalletModal";

export default function HeaderConnect() {
  const { profile } = useContext(AuthContext);
  const account = useAccount();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [display, setDisplay] = useState("");
  useEffect(() => {
    const wallet = profile?.consolidation.wallets.find(
      (w) =>
        w.wallet.address.toLowerCase() === account.address?.toLocaleLowerCase()
    );
    setDisplay(
      profile?.profile?.handle ??
        wallet?.wallet?.ens ??
        account.address?.slice(0, 6) ??
        ""
    );
  }, [profile?.profile?.handle, account.address]);

  return (
    <>
      {account.isConnected && account.address ? (
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
                profile?.profile?.handle ?? account.address
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
