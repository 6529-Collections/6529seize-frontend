import styles from "./Header.module.scss";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import WalletModal from "./walletModal/WalletModal";
import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { useWeb3Modal } from "@web3modal/wagmi/react";

export default function HeaderConnect() {
  const account = useAccount();
  const { open } = useWeb3Modal();

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
        <button className={`${styles.userProfileBtn}`} onClick={() => open()}>
          <b>&nbsp; Connect &nbsp;</b>
        </button>
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
