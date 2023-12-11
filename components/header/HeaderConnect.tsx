import styles from "./Header.module.scss";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Web3Button } from "@web3modal/react";
import WalletModal from "./walletModal/WalletModal";
import { NavDropdown } from "react-bootstrap";
import Cookies from "js-cookie";
import { VIEW_MODE_COOKIE } from "../../constants";
import Image from "next/image";
import { WalletView } from "../../enums";
import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";

interface Props {
  consolidations: string[];
  view?: WalletView;
  setView: (view: WalletView) => void;
}

export default function HeaderConnect(props: Props) {
  const account = useAccount();
  const {
    isLoading,
    isError,
    data: profile,
    error,
  } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, account.address?.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${account.address}`,
      }),
    enabled: !!account.address,
  });

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
    if (profile?.profile?.handle) {
      setDisplay(profile?.profile?.handle);
      return;
    }
    const wallet = profile?.consolidation.wallets.find(
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
  }, [profile, account.address]);

  return (
    <>
      {isLoading ? (
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
                profile?.profile?.handle ?? account.address
              }`)
            }
          >
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
                  }`}
                >
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
              align={"end"}
            >
              <NavDropdown.Item
                className={styles.dropdownItemViewMode}
                onClick={() => props.setView(WalletView.WALLET)}
              >
                {props.view === WalletView.WALLET && (
                  <FontAwesomeIcon
                    className={styles.viewModeIcon}
                    icon="check-circle"
                  ></FontAwesomeIcon>
                )}
                Wallet
              </NavDropdown.Item>
              <NavDropdown.Item
                onClick={() => props.setView(WalletView.CONSOLIDATION)}
                className={styles.dropdownItemViewMode}
              >
                {props.view === WalletView.CONSOLIDATION && (
                  <FontAwesomeIcon
                    className={`${styles.viewModeIcon} ${styles.viewModeIconConsolidation}`}
                    icon="check-circle"
                  ></FontAwesomeIcon>
                )}
                Consolidation
              </NavDropdown.Item>
            </NavDropdown>
          )}
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
