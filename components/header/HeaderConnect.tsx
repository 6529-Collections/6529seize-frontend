import styles from "./Header.module.scss";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Web3Button } from "@web3modal/react";
import WalletModal from "./walletModal/WalletModal";
import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";

export default function HeaderConnect() {
  const account = useAccount();
  const { isLoading, data: profile } = useQuery<IProfileAndConsolidations>({
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


  useEffect(() => console.log(account), [account]);

  return (
    <>
      {isLoading ? (
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
                profile?.profile?.handle ?? account.address
              }`)
            }>
            <FontAwesomeIcon icon="user"></FontAwesomeIcon>
          </button>
        </>
      ) : (
        <Web3Button label="Connect" icon="hide" avatar="hide" balance="hide" />
      )}
      {account.address && (
        <WalletModal
          wallet={account.address as `0x${string}`}
          show={showWalletModal}
          onHide={() => setShowWalletModal(false)}
        />
      )}
    </>
  );
}
