import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { Owner } from "../../entities/IOwner";
import { useRouter } from "next/router";
import { areEqualAddresses } from "../../helpers/Helpers";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import UserPageDetails from "./details/UserPageDetails";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import UserPageHeader from "./user-page-header/UserPageHeader";
import UserPageFetching from "./UserPageFetching";
import { commonApiFetch } from "../../services/api/common-api";

interface Props {
  user: string;
  connectedWallets: string[];
  profile: IProfileAndConsolidations;
}

export default function UserPage(props: Props) {
  const router = useRouter();
  const isConsolidation = props.profile.consolidation.wallets.length > 1;

  const getAddressFromQuery = (): string | null => {
    if (!router.query.address) {
      return null;
    }
    if (typeof router.query.address === "string") {
      return router.query.address.toLowerCase();
    }

    if (router.query.address.length > 0) {
      return router.query.address[0].toLowerCase();
    }
    return null;
  };

  const getMainAddress = (): string => {
    if (props.profile.profile?.primary_wallet) {
      return props.profile.profile.primary_wallet.toLowerCase();
    }

    return props.user.toLowerCase();
  };

  const [activeAddress, setActiveAddress] = useState<string | null>(
    getAddressFromQuery()
  );

  const [mainAddress, setMainAddress] = useState<string>(getMainAddress());
  const [queryAddress, setQueryAddress] = useState<string>(
    getAddressFromQuery() ?? getMainAddress()
  );

  const [walletsOwned, setWalletsOwned] = useState<Record<string, Owner[]>>({});
  const [consolidationOwned, setConsolidationOwned] = useState<Owner[]>([]);
  const [owned, setOwned] = useState<Owner[]>([]);

  const [walletsTDH, setWalletsTDH] = useState<Record<string, TDHMetrics>>({});
  const [consolidatedTDH, setConsolidatedTDH] =
    useState<ConsolidatedTDHMetrics | null>(null);
  const [tdh, setTDH] = useState<ConsolidatedTDHMetrics | TDHMetrics | null>(
    null
  );

  const [fetchingUser, setFetchingUser] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [loadingWalletTdh, setLoadingWalletTdh] = useState<string[]>([]);
  const [loadingWalletOwned, setLoadingWalletOwned] = useState<string[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);

  useEffect(() => {
    setLoadingMetrics(!!loadingWalletTdh.length || !!loadingWalletOwned.length);
  }, [loadingWalletTdh, loadingWalletOwned]);

  const onActiveAddress = (address: string) => {
    if (address === activeAddress) {
      setActiveAddress(null);
      const currentQuery = { ...router.query };
      delete currentQuery.address;
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );
      return;
    }
    setActiveAddress(address);
    const currentQuery = { ...router.query };
    currentQuery.address = address;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  useEffect(() => {
    setQueryAddress(activeAddress ?? mainAddress);
  }, [activeAddress, mainAddress]);

  useEffect(() => {
    setDataLoaded(userNotFound || !!consolidationOwned.length);
  }, [userNotFound, consolidationOwned]);

  useEffect(() => {
    const fetchConsolidatedTDH = async () => {
      const userResponse = await commonApiFetch<{
        consolidation_key: string | undefined;
      }>({
        endpoint: `user/${mainAddress}`,
      });

      if (!userResponse.consolidation_key) {
        setUserNotFound(true);
        setFetchingUser(false);
        return;
      }

      const consolidatedTDHResponse =
        await commonApiFetch<ConsolidatedTDHMetrics>({
          endpoint: `consolidated_owner_metrics/${userResponse.consolidation_key}`,
        });

      setConsolidatedTDH(consolidatedTDHResponse);
      setFetchingUser(false);
    };

    fetchConsolidatedTDH();
  }, [mainAddress]);

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
        }
      });
    }

    if (!consolidatedTDH) {
      return;
    }

    if (consolidatedTDH.balance <= 0) {
      return;
    }
    const ownedUrl = `${
      process.env.API_ENDPOINT
    }/api/owners?wallet=${consolidatedTDH.wallets.join(",")}`;
    fetchOwned(ownedUrl, []);
  }, [consolidatedTDH]);

  useEffect(() => {
    async function fetchTDH(wallet: string) {
      const url = `${process.env.API_ENDPOINT}/api/owner_metrics/?wallet=${wallet}&profile_page=true`;
      setLoadingWalletTdh((prev) => [...prev, wallet]);
      fetchUrl(url).then((response: DBResponse) => {
        if (response && response.data.length === 1) {
          setWalletsTDH((prev) => ({
            ...prev,
            [wallet]: response.data[0],
          }));
        }
        setLoadingWalletTdh((prev) => prev.filter((w) => w !== wallet));
      });
    }

    if (!activeAddress) {
      return;
    }
    if (walletsTDH[activeAddress]) {
      return;
    }

    if (!consolidatedTDH) {
      return;
    }

    if (!isConsolidation) {
      return;
    }

    fetchTDH(activeAddress);
  }, [consolidatedTDH, activeAddress, walletsTDH]);

  useEffect(() => {
    async function fetchOwned(url: string, wallet: string) {
      setLoadingWalletOwned((prev) => [...prev, wallet]);
      fetchAllPages(url).then((response: Owner[]) => {
        setWalletsOwned((prev) => ({
          ...prev,
          [wallet]: response,
        }));
        setLoadingWalletOwned((prev) => prev.filter((w) => w !== wallet));
      });
    }

    if (!activeAddress) {
      return;
    }
    if (!!walletsOwned[activeAddress]) {
      return;
    }

    if (!walletsTDH[activeAddress]) {
      return;
    }

    if (!consolidatedTDH) {
      return;
    }

    if (!isConsolidation) {
      return;
    }

    if (walletsTDH[activeAddress].balance > 0) {
      const ownedUrl = `${process.env.API_ENDPOINT}/api/owners?wallet=${activeAddress}`;
      fetchOwned(ownedUrl, activeAddress);
    }
  }, [consolidatedTDH, activeAddress, walletsOwned, walletsTDH]);

  useEffect(() => {
    if (!activeAddress || !isConsolidation) {
      setTDH(consolidatedTDH);
    } else {
      setTDH(walletsTDH[queryAddress]);
    }
  }, [activeAddress, walletsTDH, queryAddress, consolidatedTDH]);

  useEffect(() => {
    if (!activeAddress || !isConsolidation) {
      setOwned(consolidationOwned);
    } else {
      setOwned(walletsOwned[queryAddress]);
    }
  }, [activeAddress, walletsOwned, consolidationOwned, queryAddress]);

  if (fetchingUser) {
    return <UserPageFetching />;
  }

  return (
    <>
      {/* <UserPageHeader
        dataLoaded={dataLoaded}
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
      /> */}
      <UserPageHeader
        profile={props.profile}
        activeAddress={activeAddress}
        onActiveAddress={onActiveAddress}
      />
      {dataLoaded && (
        <UserPageDetails
          tdh={tdh}
          activeAddress={activeAddress}
          mainAddress={mainAddress}
          owned={owned ?? []}
          profile={props.profile}
        />
      )}
    </>
  );
}
