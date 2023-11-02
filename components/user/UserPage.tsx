import { Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { Owner } from "../../entities/IOwner";
import { useRouter } from "next/router";
import { areEqualAddresses, containsEmojis } from "../../helpers/Helpers";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import { VIEW } from "../consolidation-switch/ConsolidationSwitch";
import UserPageDetails from "./user-page-details/UserPageDetails";
import { ENS } from "../../entities/IENS";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import UserPageHeader from "./user-page-header/UserPageHeader";
import UserPageFetching from "./UserPageFetching";

interface Props {
  user: string;
  wallets: string[];
  profile: IProfileAndConsolidations;
}

export default function UserPage(props: Props) {
  const router = useRouter();

  const [view, setView] = useState<VIEW>(
    router.query.address ? VIEW.WALLET : VIEW.CONSOLIDATION
  );

  const [activeAddress, setActiveAddress] = useState<string | null>(
    router.query.address ? (router.query.address as string) : null
  );

  const [walletOwnedLoaded, setWalletOwnedLoaded] = useState(false);
  const [consolidationOwnedLoaded, setConsolidationOwnedLoaded] =
    useState(false);

  const [ownerAddress, setOwnerAddress] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [ownerENS, setOwnerENS] = useState("");

  const [owned, setOwned] = useState<Owner[]>([]);
  const [walletOwned, setWalletOwned] = useState<Owner[]>([]);
  const [consolidationOwned, setConsolidationOwned] = useState<Owner[]>([]);

  const [walletTDH, setWalletTDH] = useState<TDHMetrics>();
  const [consolidatedTDH, setConsolidatedTDH] =
    useState<ConsolidatedTDHMetrics>();
  const [tdh, setTDH] = useState<ConsolidatedTDHMetrics | TDHMetrics>();
  const [isConsolidation, setIsConsolidation] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [consolidationKey, setConsolidationKey] = useState<string | null>();

  useEffect(() => {
    async function fetchENS() {
      if (
        props.user.startsWith("0x") ||
        props.user.endsWith(".eth") ||
        props.profile?.profile?.primary_wallet ||
        activeAddress
      ) {
        const userUrl =
          props.user.startsWith("0x") || props.user.endsWith(".eth")
            ? props.user
            : activeAddress
            ? activeAddress
            : props.profile?.profile?.primary_wallet;
        const url = `${process.env.API_ENDPOINT}/api/user/${userUrl}`;
        return fetchUrl(url).then((response: ENS) => {
          setConsolidationKey(response.consolidation_key ?? null);

          const oAddress =
            activeAddress ??
            props.profile.profile?.primary_wallet ??
            response.wallet ??
            props.user;
          setOwnerAddress(oAddress as `0x${string}`);
          setOwnerENS(
            activeAddress ??
              props.profile?.profile?.primary_wallet ??
              response.display ??
              oAddress
          );
          const currentQuery: { address?: string | undefined } = {};
          if (activeAddress) {
            currentQuery.address = activeAddress;
          }
          router.push(
            {
              pathname: props.profile.profile?.handle
                ? props.profile.profile.handle
                : response.display && !containsEmojis(response.display)
                ? response.display.replaceAll(" ", "-")
                : oAddress,
              query: currentQuery,
            },
            undefined,
            { shallow: true }
          );
          setFetchingUser(false);
        });
      }
      setFetchingUser(false);
    }

    if (router.isReady) {
      fetchENS();
    }
  }, [router.isReady]);

  useEffect(() => {
    async function fetchOwned(url: string, myowned: Owner[]) {
      return fetchUrl(url).then((response: DBResponse) => {
        if (response.next) {
          fetchOwned(response.next, [...myowned].concat(response.data));
        } else {
          const newOwned = [...myowned].concat(response.data);
          if (newOwned.length > 0) {
            const mergedOwners = newOwned.reduce(
              (accumulator: Owner[], currentOwner: Owner) => {
                const existingOwner = accumulator.find(
                  (owner) =>
                    areEqualAddresses(owner.contract, currentOwner.contract) &&
                    owner.token_id === currentOwner.token_id
                );

                if (existingOwner) {
                  existingOwner.balance += currentOwner.balance;
                } else {
                  accumulator.push(currentOwner);
                }

                return accumulator;
              },
              [] as Owner[]
            );
            setConsolidationOwned(mergedOwners);
          }
          setConsolidationOwnedLoaded(true);
        }
      });
    }

    if (consolidatedTDH) {
      if (consolidatedTDH.balance > 0) {
        const ownedUrl = `${
          process.env.API_ENDPOINT
        }/api/owners?wallet=${consolidatedTDH.wallets.join(",")}`;
        fetchOwned(ownedUrl, []);
      } else {
        setConsolidationOwnedLoaded(true);
        setWalletOwnedLoaded(true);
      }
    }
  }, [consolidatedTDH]);

  useEffect(() => {
    async function fetchOwned(url: string, myowned: Owner[]) {
      fetchAllPages(url).then((response: Owner[]) => {
        setWalletOwned(response);
        setWalletOwnedLoaded(true);
      });
    }

    if (walletTDH) {
      if (walletTDH.balance > 0) {
        const ownedUrl = `${process.env.API_ENDPOINT}/api/owners?wallet=${walletTDH.wallet}`;
        fetchOwned(ownedUrl, []);
      } else {
        setWalletOwnedLoaded(true);
      }
    }
  }, [walletTDH]);

  useEffect(() => {
    async function fetchConsolidatedTDH() {
      const url = `${process.env.API_ENDPOINT}/api/consolidated_owner_metrics/${consolidationKey}`;
      return fetchUrl(url).then((response: ConsolidatedTDHMetrics) => {
        if (response) {
          setConsolidatedTDH(response);
          if (response.wallets && response.wallets.length > 1) {
            setIsConsolidation(true);
          }
        }
      });
    }

    if (consolidationKey) {
      fetchConsolidatedTDH();
    }
  }, [consolidationKey]);

  useEffect(() => {
    async function fetchTDH() {
      const url = `${process.env.API_ENDPOINT}/api/owner_metrics/?wallet=${ownerAddress}&profile_page=true`;
      return fetchUrl(url).then((response: DBResponse) => {
        if (response && response.data.length === 1) {
          setWalletTDH(response.data[0]);
        }
      });
    }

    if (consolidatedTDH) {
      if (isConsolidation) {
        fetchTDH();
      } else {
        setWalletOwnedLoaded(true);
      }
    }
  }, [isConsolidation, consolidatedTDH]);

  useEffect(() => {
    if (view === VIEW.CONSOLIDATION || !isConsolidation) {
      setTDH(consolidatedTDH);
    } else {
      setTDH(walletTDH);
    }
  }, [view, walletTDH, consolidatedTDH]);

  useEffect(() => {
    if (walletOwnedLoaded && consolidationOwnedLoaded) {
      if (view === VIEW.CONSOLIDATION || !isConsolidation) {
        setOwned(consolidationOwned);
      } else {
        setOwned(walletOwned);
      }
    }
  }, [view, walletOwnedLoaded, consolidationOwnedLoaded]);

  if (fetchingUser) {
    return <UserPageFetching />;
  }

  return (
    <>
      <UserPageHeader
        tdh={tdh}
        consolidatedTDH={consolidatedTDH}
        isConsolidation={isConsolidation}
        ownerAddress={ownerAddress}
        view={view}
        activeAddress={activeAddress}
        setActiveAddress={setActiveAddress}
        user={props.user}
        setView={setView}
        ownerENS={ownerENS}
        profile={props.profile}
      />
      <UserPageDetails
        tdh={tdh}
        ownerAddress={ownerAddress}
        view={view}
        owned={owned}
        profile={props.profile}
      />
    </>
  );
}
