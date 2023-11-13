import { useEffect, useState } from "react";
import { Owner, OwnerLite } from "../../entities/IOwner";
import { useRouter } from "next/router";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { fetchAllPages } from "../../services/6529api";
import UserPageDetails from "./details/UserPageDetails";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import UserPageHeader from "./user-page-header/UserPageHeader";
import { commonApiFetch } from "../../services/api/common-api";
import { GRADIENT_CONTRACT, MEMES_CONTRACT } from "../../constants";
import { NFT, NFTLite } from "../../entities/INFT";
import { Season } from "../../entities/ISeason";

interface Props {
  user: string;
  connectedWallets: string[];
  profile: IProfileAndConsolidations;
  mainAddress: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
  memesLite: NFTLite[];
  gradients: NFT[];
  seasons: Season[];
}

export default function UserPage(props: Props) {
  const router = useRouter();
  const isConsolidation = props.profile.consolidation.wallets.length > 1;

  const getConsolidatedOwned = (): OwnerLite[] => {
    if (!props.consolidatedTDH) {
      return [];
    }
    const cards: OwnerLite[] = [];
    for (const meme of props.consolidatedTDH.memes) {
      cards.push({
        token_id: meme.id,
        balance: meme.balance,
        contract: MEMES_CONTRACT,
      });
    }

    for (const gradient of props.consolidatedTDH.gradients) {
      cards.push({
        token_id: gradient.id,
        balance: gradient.balance,
        contract: GRADIENT_CONTRACT,
      });
    }

    return cards;
  };

  const consolidatedOwned = getConsolidatedOwned();

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
    getAddressFromQuery() ?? props.mainAddress
  );

  const [walletsOwned, setWalletsOwned] = useState<Record<string, Owner[]>>({});
  const [owned, setOwned] = useState<OwnerLite[]>([]);
  const [walletsTDH, setWalletsTDH] = useState<Record<string, TDHMetrics>>({});
  const [tdh, setTDH] = useState<ConsolidatedTDHMetrics | TDHMetrics | null>(
    null
  );
  const [loadingMetrics, setLoadingMetrics] = useState<string[]>([]);

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
    setQueryAddress(activeAddress ?? props.mainAddress);
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
      setOwned(consolidatedOwned);
      return;
    }

    setTDH(walletsTDH[queryAddress]);
    setOwned(walletsOwned[queryAddress]);
  }, [
    activeAddress,
    walletsOwned,
    queryAddress,
    walletsTDH,
  ]);


  return (
    <>
      <UserPageHeader
        profile={props.profile}
        mainAddress={props.mainAddress}
        consolidatedTDH={props.consolidatedTDH}
        activeAddress={activeAddress}
        onActiveAddress={onActiveAddress}
        user={props.user}
      />
      {/* <UserPageDetails
        tdh={tdh}
        activeAddress={activeAddress}
        mainAddress={props.mainAddress}
        owned={owned}
        profile={props.profile}
        loading={!!loadingMetrics.length}
        memesLite={props.memesLite}
        gradients={props.gradients}
        seasons={props.seasons}
      /> */}
    </>
  );
}
