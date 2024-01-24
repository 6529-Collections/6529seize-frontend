import styles from "../../NextGen.module.scss";
import { useContractRead, useAccount, useContractReads } from "wagmi";
import { DELEGATION_ABI } from "../../../../../abis";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "../../../../../constants";
import { Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import {
  CollectionWithMerkle,
  AllowlistType,
  Status,
} from "../../../nextgen_entities";
import { fromGWEI } from "../../../../../helpers/Helpers";
import {
  ALL_USE_CASE,
  MINTING_USE_CASE,
} from "../../../../../pages/delegation/[...section]";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../../../nextgen_contracts";
import { fetchUrl } from "../../../../../services/6529api";
import {
  getStatusFromDates,
  useCollectionCostsHook,
  useMintSharedState,
  useSharedState,
} from "../../../nextgen_helpers";
import NextGenMintWidget from "./NextGenMintWidget";
import NextGenMintBurnWidget from "./NextGenMintBurnWidget";
import Image from "next/image";
import { NextGenCountdown, NextGenPhases } from "../NextGenCollectionHeader";
import DotLoader from "../../../../dotLoader/DotLoader";
import { NextGenCollection } from "../../../../../entities/INextgen";

interface Props {
  collection: NextGenCollection;
  mint_price: number;
  burn_amount: number;
}

export function Spinner() {
  return (
    <div className="d-inline">
      <output className={`spinner-border ${styles.loader}`}></output>
    </div>
  );
}

export default function NextGenMint(props: Readonly<Props>) {
  const account = useAccount();

  const [collection, setCollection] = useState<CollectionWithMerkle>();
  const [collectionLoaded, setCollectionLoaded] = useState<boolean>(false);

  const { mintingDetails, setMintingDetails } = useSharedState();
  useCollectionCostsHook(props.collection.id, setMintingDetails);

  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  const {
    available,
    setAvailable,
    delegators,
    setDelegators,
    mintingForDelegator,
    setMintingForDelegator,
    mintForAddress,
    setMintForAddress,
    addressMintCounts,
    setAddressMintCounts,
    fetchingMintCounts,
    setFetchingMintCounts,
  } = useMintSharedState();

  useEffect(() => {
    if (props.burn_amount > -1) {
      setAvailable(
        props.collection.total_supply -
          props.burn_amount -
          props.collection.mint_count
      );
    }
  }, [props.burn_amount]);

  function getDelegationAddress() {
    if (collection && mintingDetails) {
      if (collection.al_type === AllowlistType.ALLOWLIST) {
        return mintingDetails.del_address;
      } else if (collection.al_type === AllowlistType.EXTERNAL_BURN) {
        return collection.burn_collection;
      }
    }
    return "";
  }

  useContractReads({
    contracts: [
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          DELEGATION_ALL_ADDRESS,
          ALL_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          DELEGATION_ALL_ADDRESS,
          MINTING_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          getDelegationAddress(),
          ALL_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          getDelegationAddress(),
          MINTING_USE_CASE.use_case,
        ],
      },
    ],
    watch: true,
    enabled:
      account.isConnected &&
      mintingDetails !== undefined &&
      collection !== undefined,
    onSettled(data: any, error: any) {
      if (data) {
        const del: string[] = [];
        const d = data as any[];
        d.forEach((r) => {
          r.result.forEach((a: string) => del.push(a));
        });
        setDelegators(del);
      }
    },
  });

  function retrievePerAddressParams() {
    return {
      address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
      abi: NEXTGEN_CORE.abi,
      chainId: NEXTGEN_CHAIN_ID,
      watch: true,
      enabled: mintingForDelegator
        ? account.isConnected && mintForAddress != ""
        : account.isConnected,
      args: [
        props.collection.id,
        mintingForDelegator ? mintForAddress : account.address,
      ],
    };
  }

  const addressMintCountAirdropRead = useContractRead({
    functionName: "retrieveTokensAirdroppedPerAddress",
    ...retrievePerAddressParams(),
    onSettled(data: any, error: any) {
      if (data) {
        const air = parseInt(data);
        setAddressMintCounts((amc) => {
          amc.airdrop = air;
          amc.total = amc.airdrop + amc.allowlist + amc.public;
          return amc;
        });
      }
    },
  });

  const addressMintCountMintedALRead = useContractRead({
    functionName: "retrieveTokensMintedALPerAddress",
    ...retrievePerAddressParams(),
    onSettled(data: any, error: any) {
      if (data) {
        const allow = parseInt(data);
        setAddressMintCounts((amc) => {
          amc.allowlist = allow;
          amc.total = amc.airdrop + amc.allowlist + amc.public;
          return amc;
        });
      }
    },
  });

  const addressMintCountMintedPublicRead = useContractRead({
    functionName: "retrieveTokensMintedPublicPerAddress",
    ...retrievePerAddressParams(),
    onSettled(data: any, error: any) {
      if (data) {
        const pub = parseInt(data);
        setAddressMintCounts((amc) => {
          amc.public = pub;
          amc.total = amc.airdrop + amc.allowlist + amc.public;
          return amc;
        });
      }
    },
  });

  useEffect(() => {
    if (account.address && props.collection.merkle_root) {
      const merkleRoot = props.collection.merkle_root;
      const url = `${process.env.API_ENDPOINT}/api/nextgen/merkle_roots/${merkleRoot}`;
      fetchUrl(url).then((response: CollectionWithMerkle) => {
        if (response) {
          setCollection(response);
        }
        setCollectionLoaded(true);
      });
    }
  }, [account.address, props.collection.merkle_root]);

  function getSalesModel() {
    if (!mintingDetails) {
      return "-";
    }

    switch (mintingDetails.sales_option) {
      case 1:
        return "Fixed Price";
      case 2:
        if (mintingDetails.rate === 0) {
          return "Exponential Descending";
        } else {
          return "Linear Descending";
        }
      case 3:
        return "Periodic Sale";
      default:
        return `${mintingDetails.sales_option}`;
    }
  }

  useEffect(() => {
    setAddressMintCounts({
      airdrop: 0,
      allowlist: 0,
      public: 0,
      total: 0,
    });
    addressMintCountAirdropRead.refetch();
    addressMintCountMintedALRead.refetch();
    addressMintCountMintedPublicRead.refetch();
  }, [mintForAddress]);

  useEffect(() => {
    const isFetching =
      addressMintCountAirdropRead.isFetching ||
      addressMintCountMintedALRead.isFetching ||
      addressMintCountMintedPublicRead.isFetching;
    // alert(isFetching);
    setFetchingMintCounts(isFetching);
  }, [
    addressMintCountAirdropRead.isFetching,
    addressMintCountMintedALRead.isFetching,
    addressMintCountMintedPublicRead.isFetching,
  ]);

  function printMintWidget(type: AllowlistType) {
    if (type === AllowlistType.ALLOWLIST) {
      return (
        <NextGenMintWidget
          collection={props.collection}
          available_supply={available}
          mint_price={props.mint_price}
          mint_counts={addressMintCounts}
          delegators={delegators}
          mintingForDelegator={setMintingForDelegator}
          mintForAddress={setMintForAddress}
          fetchingMintCounts={fetchingMintCounts}
        />
      );
    } else if (collection && type == AllowlistType.EXTERNAL_BURN) {
      return (
        <NextGenMintBurnWidget
          collection={props.collection}
          collection_merkle={collection}
          available_supply={available}
          mint_price={props.mint_price}
          mint_counts={addressMintCounts}
          delegators={delegators}
          mintingForDelegator={setMintingForDelegator}
          mintForAddress={setMintForAddress}
          fetchingMintCounts={fetchingMintCounts}
        />
      );
    }
  }

  function printMintWidgetContent() {
    if (publicStatus === Status.LIVE) {
      return printMintWidget(AllowlistType.ALLOWLIST);
    }
    if (collectionLoaded) {
      if (collection) {
        return printMintWidget(collection.al_type);
      }
      return (
        <span className="d-flex gap-1 align-items-center">
          <Image
            loading="eager"
            width="0"
            height="0"
            style={{ height: "50px", width: "auto" }}
            src="/SummerGlasses.svg"
            alt="SummerGlasses"
          />
          <b>Allowlist Not Found</b>
        </span>
      );
    }
    return <DotLoader />;
  }

  return (
    <Container className="no-padding">
      <Row className="pt-2">
        <Col sm={12} md={6} className="d-flex flex-column">
          <NextGenPhases collection={props.collection} available={available} />
          <a
            href={`/nextgen/collection/${props.collection.id}`}
            className="decoration-hover-underline">
            <h1 className="mb-0 font-color">
              #{props.collection.id} -{" "}
              <b>{props.collection.name.toUpperCase()}</b>
            </h1>
          </a>
          <span className="font-larger">
            by{" "}
            <b>
              <a href={`/${props.collection.artist_address}`}>
                {props.collection.artist}
              </a>
            </b>
          </span>
          <span className="pt-2 font-larger d-inline-flex align-items-center">
            <b>
              {props.collection.mint_count} / {props.collection.total_supply}{" "}
              minted
              {available > 0 && ` | ${available} remaining`}
            </b>
          </span>
        </Col>
        <Col sm={12} md={6} className="pt-1 pb-1 d-flex align-items-center">
          <NextGenCountdown collection={props.collection} align="vertical" />
        </Col>
      </Row>
      <Row className="pt-4 pb-4">
        <Col
          sm={12}
          md={6}
          className="d-flex align-items-start justify-content-start gap-3">
          <Image
            loading="eager"
            width="0"
            height="0"
            style={{
              height: "auto",
              width: "auto",
              maxHeight: "100%",
              maxWidth: "100%",
              padding: "10px",
            }}
            src={props.collection.image}
            alt={props.collection.name}
          />
        </Col>
        <Col sm={12} md={6}>
          <Container className="no-padding">
            <Row className="pt-2">
              <Col className="d-flex gap-2">
                <span
                  className={`mb-0 d-flex align-items-center gap-2 no-wrap ${styles.nextgenTag}`}>
                  <span>Mint Cost</span>
                  <span>|</span>
                  <span className="font-bolder">
                    {props.mint_price > 0 ? fromGWEI(props.mint_price) : `Free`}{" "}
                    {props.mint_price > 0 ? `ETH` : ``}
                  </span>
                </span>
                <span
                  className={`mb-0 d-flex align-items-center gap-2 no-wrap ${styles.nextgenTag}`}>
                  <span>Sales Model</span>
                  <span>|</span>
                  <span className="font-bolder">{getSalesModel()}</span>
                </span>
              </Col>
            </Row>
            <Row className="pt-3">
              <Col>{printMintWidgetContent()}</Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
