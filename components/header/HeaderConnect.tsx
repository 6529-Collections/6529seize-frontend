import { useAccount } from "wagmi";
import styles from "./Header.module.scss";
import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Web3Button } from "@web3modal/react";
import { NavDropdown } from "react-bootstrap";
import Image from "next/image";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { AuthContext } from "../auth/Auth";
import { useRouter } from "next/router";
import WalletModal from "./walletModal/WalletModal";

export default function HeaderConnect() {
  const { profile } = useContext(AuthContext);
  const account = useAccount();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [display, setDisplay] = useState("");
  useEffect(() => {
    setDisplay(profile?.profile?.handle ?? account.address?.slice(0, 6) ?? "");
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
