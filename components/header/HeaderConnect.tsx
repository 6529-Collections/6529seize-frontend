import styles from "./Header.module.scss";
import { useAccount } from "wagmi";
import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext } from "../auth/Auth";
import WalletModal from "./walletModal/WalletModal";
import { Button, NavDropdown } from "react-bootstrap";
import Cookies from "js-cookie";
import { VIEW_MODE_COOKIE } from "../../constants";
import Image from "next/image";
import { WalletView } from "../../enums";
import Tippy from "@tippyjs/react";
import { useSeizeWeb3Modal } from "../../hooks/web3Modal";

interface Props {
  consolidations: string[];
  view?: WalletView;
  setView: (view: WalletView) => void;
}

export default function HeaderConnect(props: Props) {
  const seizeWeb3Modal = useSeizeWeb3Modal();

  const { myProfile, loadingMyProfile } = useContext(AuthContext);
  const account = useAccount();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const viewMode = Cookies.get(VIEW_MODE_COOKIE);
    if (viewMode === WalletView.CONSOLIDATION) {
      props.setView(WalletView.CONSOLIDATION);
    } else {
      props.setView(WalletView.WALLET);
    }
  }, []);

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
            onClick={() => setShowWalletModal(true)}>
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
            }>
            <FontAwesomeIcon icon="user"></FontAwesomeIcon>
          </button>
          {props.consolidations.length > 1 && (
            <NavDropdown
              className={`${styles.consolidationDropDown}`}
              title={
                <button
                  className={`${styles.consolidationDropdownBtn} ${
                    props.view === WalletView.CONSOLIDATION
                      ? styles.consolidationBtnActive
                      : ""
                  }`}>
                  <Image
                    loading="eager"
                    priority
                    src="/consolidation-icon_b.png"
                    alt="consolidation"
                    width={20}
                    height={20}
                  />
                </button>
              }
              align={"end"}>
              <NavDropdown.Item
                className={styles.dropdownItemViewMode}
                onClick={() => props.setView(WalletView.WALLET)}>
                {props.view === WalletView.WALLET && (
                  <FontAwesomeIcon
                    className={styles.viewModeIcon}
                    icon="check-circle"></FontAwesomeIcon>
                )}
                Wallet
              </NavDropdown.Item>
              <NavDropdown.Item
                onClick={() => props.setView(WalletView.CONSOLIDATION)}
                className={styles.dropdownItemViewMode}>
                {props.view === WalletView.CONSOLIDATION && (
                  <FontAwesomeIcon
                    className={`${styles.viewModeIcon} ${styles.viewModeIconConsolidation}`}
                    icon="check-circle"></FontAwesomeIcon>
                )}
                Consolidation
              </NavDropdown.Item>
            </NavDropdown>
          )}
        </>
      ) : (
        <Tippy
          disabled={!seizeWeb3Modal.connectDisabled}
          hideOnClick={false}
          content={"Connect is currently disabled"}
          theme={"light"}>
          <span>
            <Button
              disabled={seizeWeb3Modal.connectDisabled}
              className={`seize-btn btn-white`}
              onClick={() => {
                seizeWeb3Modal.open();
              }}>
              <b>{seizeWeb3Modal.isOpen ? `Connecting...` : `Connect`}</b>
            </Button>
          </span>
        </Tippy>
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
