import { SortDirection } from "../../../entities/ISort";
import { useEffect, useState } from "react";
import { NFT, NFTLite } from "../../../entities/INFT";
import { Owner, OwnerLite } from "../../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import { Season } from "../../../entities/ISeason";
import UserPageCollectionNfts from "./UserPageCollectionNfts";

import DotLoader from "../../dotLoader/DotLoader";
import dynamic from "next/dynamic";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useRouter } from "next/router";
import { commonApiFetch } from "../../../services/api/common-api";
import { fetchAllPages } from "../../../services/6529api";
import UserPageHeaderAddresses from "../user-page-header/addresses/UserPageHeaderAddresses";

const UserPageCollectionControls = dynamic(
  () => import("./UserPageCollectionControls"),
  {
    ssr: false,
  }
);

interface Props {
  readonly profile: IProfileAndConsolidations;
  readonly consolidatedOwned: OwnerLite[];
  readonly consolidatedTDH: ConsolidatedTDHMetrics | TDHMetrics | null;
  readonly memesLite: NFTLite[];
  readonly gradients: NFT[];
  readonly seasons: Season[];
}

export enum UserCollectionSort {
  ID = "id",
  TDH = "tdh",
  RANK = "tdh_rank",
}

export default function UserPageCollection(props: Props) {
  const isConsolidation = props.profile.consolidation.wallets.length > 1;
  const router = useRouter();
  const mainAddress =
    props.profile.profile?.primary_wallet?.toLowerCase() ??
    (router.query.user as string).toLowerCase();

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

  const [activeAddress, setActiveAddress] = useState<string | null>(
    getAddressFromQuery()
  );

  const [queryAddress, setQueryAddress] = useState<string>(
    getAddressFromQuery() ?? mainAddress
  );

  const [walletsOwned, setWalletsOwned] = useState<Record<string, Owner[]>>({});
  const [owned, setOwned] = useState<OwnerLite[]>([]);
  const [walletsTDH, setWalletsTDH] = useState<Record<string, TDHMetrics>>({});
  const [tdh, setTDH] = useState<ConsolidatedTDHMetrics | TDHMetrics | null>(
    null
  );
  const [loadingMetrics, setLoadingMetrics] = useState<string[]>([]);

  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<UserCollectionSort>(UserCollectionSort.ID);
  const [hideSeized, setHideSeized] = useState(false);
  const [hideNonSeized, setHideNonSeized] = useState(true);
  const [hideMemes, setHideMemes] = useState(false);
  const [hideGradients, setHideGradients] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(0);

  const [loading, setLoading] = useState(loadingMetrics.length > 0);

  useEffect(() => {
    setActiveAddress((router.query.address as string) ?? null);
  }, [router.query.address]);

  useEffect(() => {
    setLoading(loadingMetrics.length > 0);
  }, [loadingMetrics]);

  useEffect(() => {
    setQueryAddress(activeAddress ?? mainAddress);
  }, [activeAddress]);

  useEffect(() => {
    const loadMetrics = async (wallet: string) => {
      setLoadingMetrics((prev) => [...prev, wallet]);
      const tdhResponses = await commonApiFetch<{ data: TDHMetrics[] }>({
        endpoint: `owner_metrics/?wallet=${wallet}&profile_page=true`,
      });

      if (!tdhResponses.data.length) {
        setLoadingMetrics((prev) => prev.filter((w) => w !== wallet));
        return;
      }

      const tdhResponse = tdhResponses.data[0];

      if (!tdhResponse.balance) {
        setWalletsTDH((prev) => ({
          ...prev,
          [wallet]: tdhResponse,
        }));
        setLoadingMetrics((prev) => prev.filter((w) => w !== wallet));
        return;
      }

      const walletOwnerResponse = await fetchAllPages(
        `${process.env.API_ENDPOINT}/api/owners?wallet=${activeAddress}`
      );

      setWalletsTDH((prev) => ({
        ...prev,
        [wallet]: tdhResponse,
      }));

      setWalletsOwned((prev) => ({
        ...prev,
        [wallet]: walletOwnerResponse,
      }));
      setLoadingMetrics((prev) => prev.filter((w) => w !== wallet));
    };

    if (!activeAddress) {
      return;
    }

    if (!props.consolidatedTDH) {
      return;
    }

    if (!isConsolidation) {
      return;
    }

    loadMetrics(activeAddress);
  }, [activeAddress]);

  useEffect(() => {
    if (!activeAddress || !isConsolidation) {
      setTDH(props.consolidatedTDH);
      setOwned(props.consolidatedOwned);
      return;
    }

    setTDH(walletsTDH[queryAddress]);
    setOwned(walletsOwned[queryAddress] ?? []);
  }, [activeAddress, walletsOwned, queryAddress, walletsTDH]);

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

  return (
    <>
      <UserPageCollectionControls
        tdh={tdh}
        hideSeized={hideSeized}
        hideNonSeized={hideNonSeized}
        setHideSeized={setHideSeized}
        setHideNonSeized={setHideNonSeized}
        hideGradients={hideGradients}
        setHideGradients={setHideGradients}
        hideMemes={hideMemes}
        setHideMemes={setHideMemes}
        sort={sort}
        setSort={setSort}
        sortDir={sortDir}
        setSortDir={setSortDir}
        seasons={props.seasons}
        selectedSeason={selectedSeason}
        setSelectedSeason={setSelectedSeason}
      >
        <div className="tailwind-scope">
          <UserPageHeaderAddresses
            addresses={props.profile.consolidation.wallets}
            activeAddress={activeAddress}
            onActiveAddress={onActiveAddress}
          />
        </div>
      </UserPageCollectionControls>
      {loading ? (
        <DotLoader />
      ) : (
        <UserPageCollectionNfts
          owned={owned}
          nfts={[...props.gradients, ...props.memesLite]}
          tdh={tdh}
          seasons={props.seasons}
          selectedSeason={selectedSeason}
          hideSeized={hideSeized}
          hideNonSeized={hideNonSeized}
          hideMemes={hideMemes}
          hideGradients={hideGradients}
          sort={sort}
          sortDir={sortDir}
        />
      )}
    </>
  );
}
