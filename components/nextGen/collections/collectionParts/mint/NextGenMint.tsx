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
  AdditionalData,
  PhaseTimes,
  CollectionWithMerkle,
  AllowlistType,
  Info,
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
  useCollectionCostsHook,
  useMintSharedState,
  useSharedState,
} from "../../../nextgen_helpers";
import NextGenMintWidget from "./NextGenMintWidget";
import NextGenMintBurnWidget from "./NextGenMintBurnWidget";
import Image from "next/image";
import { NextGenCountdown, NextGenPhases } from "../NextGenCollectionHeader";
import { NextGenTokenImage } from "../../NextGenTokenImage";
import DotLoader from "../../../../dotLoader/DotLoader";

interface Props {
  collection: number;
  collection_preview?: number;
  info: Info;
  phase_times: PhaseTimes;
  mint_price: number;
  additional_data: AdditionalData;
  burn_amount: number;
}

export default function NextGenMint(props: Readonly<Props>) {
  const account = useAccount();

  const [collection, setCollection] = useState<CollectionWithMerkle>();
  const [collectionLoaded, setCollectionLoaded] = useState<boolean>(false);

  const { mintingDetails, setMintingDetails } = useSharedState();
  useCollectionCostsHook(props.collection, setMintingDetails);

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
  } = useMintSharedState();

  useEffect(() => {
    if (props.additional_data && props.burn_amount > -1) {
      setAvailable(
        props.additional_data.total_supply -
          props.burn_amount -
          props.additional_data.circulation_supply
      );
    }
  }, [props.additional_data, props.burn_amount]);

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
      address: NEXTGEN_CORE.contract as `0x${string}`,
      abi: NEXTGEN_CORE.abi,
      chainId: NEXTGEN_CHAIN_ID,
      watch: true,
      enabled: mintingForDelegator
        ? account.isConnected && mintForAddress != ""
        : account.isConnected,
      args: [
        props.collection,
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
    if (
      props.phase_times &&
      account.address &&
      props.phase_times.allowlist_end_time > 0
    ) {
      const url = `${process.env.API_ENDPOINT}/api/nextgen/${props.phase_times.merkle_root}`;
      fetchUrl(url).then((response: CollectionWithMerkle) => {
        if (response) {
          setCollection(response);
        }
        setCollectionLoaded(true);
      });
    }
  }, [props.phase_times]);

  function getSalesModel() {
    if (!mintingDetails) {
      return "-";
    }

    switch (mintingDetails.sales_option) {
      case 1:
        return "Fixed Price";
      case 2:
        if (mintingDetails.rate === 0) {
          return "Exponential decrease";
        } else {
          return "Linear decrease";
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
    if (!mintingForDelegator) {
      addressMintCountAirdropRead.refetch();
      addressMintCountMintedALRead.refetch();
      addressMintCountMintedPublicRead.refetch();
    }
  }, [mintingForDelegator]);

  function printMintWidget(type: AllowlistType) {
    if (type === AllowlistType.ALLOWLIST) {
      return (
        <NextGenMintWidget
          collection={props.collection}
          phase_times={props.phase_times}
          additional_data={props.additional_data}
          available_supply={available}
          mint_price={props.mint_price}
          mint_counts={addressMintCounts}
          delegators={delegators}
          mintingForDelegator={setMintingForDelegator}
          mintForAddress={setMintForAddress}
        />
      );
    } else if (collection && type == AllowlistType.EXTERNAL_BURN) {
      return (
        <NextGenMintBurnWidget
          collection={collection}
          phase_times={props.phase_times}
          additional_data={props.additional_data}
          available_supply={available}
          mint_price={props.mint_price}
          mint_counts={addressMintCounts}
          delegators={delegators}
          mintingForDelegator={setMintingForDelegator}
          mintForAddress={setMintForAddress}
        />
      );
    }
  }

  function printMintWidgetContent() {
    if (props.phase_times.public_status === Status.LIVE) {
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
        <Col
          xs={12}
          className="d-flex align-items-center justify-content-between">
          <a
            href={`/nextgen/collection/${props.collection}`}
            className="decoration-hover-underline">
            <h1 className="mb-0 font-color">
              #{props.collection} - <b>{props.info.name.toUpperCase()}</b>
            </h1>
          </a>
          <NextGenPhases
            phase_times={props.phase_times}
            available={available}
          />
        </Col>
        <Col
          xs={12}
          className="d-flex align-items-center justify-content-between">
          <span className="font-larger">
            by <b>{props.info.artist}</b>
          </span>
          <span className="font-larger d-inline-flex align-items-center">
            <b>
              {props.additional_data.circulation_supply} /{" "}
              {props.additional_data.total_supply} minted
              {available > 0 && ` | ${available} remaining`}
            </b>
          </span>
        </Col>
        <Col xs={12} className="pt-3">
          <NextGenCountdown
            collection={props.collection}
            phase_times={props.phase_times}
            align="horizontal"
          />
        </Col>
      </Row>
      <Row className="pt-4 pb-4">
        <Col className="d-flex align-items-start justify-content-start gap-3">
          {props.collection_preview && (
            <NextGenTokenImage
              token_id={props.collection_preview}
              collection={props.collection}
              hide_info={true}
              hide_link={true}
            />
          )}
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
