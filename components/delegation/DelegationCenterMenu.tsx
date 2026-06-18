"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { DELEGATION_CONTRACT } from "@/constants/constants";
import { DelegationCenterSection } from "@/types/enums";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Col, Container, Row } from "react-bootstrap";
import { useEnsName } from "wagmi";
import { sepolia } from "wagmi/chains";
import CollectionDelegationComponent from "./CollectionDelegation";
import styles from "./Delegation.module.scss";
import DelegationCenterComponent from "./DelegationCenter";
import { DelegationToast, useDelegationToast } from "./DelegationToast";
import NewAssignPrimaryAddress from "./NewAssignPrimaryAddress";
import NewConsolidationComponent from "./NewConsolidation";
import NewDelegationComponent from "./NewDelegation";
import NewSubDelegationComponent from "./NewSubDelegation";
import {
  ANY_COLLECTION,
  GRADIENTS_COLLECTION,
  MEMES_COLLECTION,
  MEME_LAB_COLLECTION,
} from "./delegation-constants";
import DelegationHTML from "./html/DelegationHTML";
import WalletCheckerComponent from "./walletChecker/WalletChecker";

const DELEGATION_MENU_ITEMS: ReadonlyArray<{
  section: DelegationCenterSection;
  label: string;
}> = [
  {
    section: DelegationCenterSection.CENTER,
    label: "Delegation Center",
  },
  {
    section: DelegationCenterSection.WALLET_ARCHITECTURE,
    label: "Wallet Architecture",
  },
  {
    section: DelegationCenterSection.FAQ,
    label: "Delegation FAQ",
  },
  {
    section: DelegationCenterSection.CONSOLIDATION_USE_CASES,
    label: "Consolidation Use Cases",
  },
  {
    section: DelegationCenterSection.CHECKER,
    label: "Wallet Checker",
  },
];

interface Props {
  section: DelegationCenterSection;
  path?: string[] | undefined;
  setActiveSection(section: DelegationCenterSection): any;
  address_query: string;
  setAddressQuery(address: string): any;
  collection_query: string;
  setCollectionQuery(collection: string): any;
  use_case_query: number;
  setUseCaseQuery(use_case: number): any;
}

export default function DelegationCenterMenu(props: Readonly<Props>) {
  const pathname = usePathname();
  const accountResolution = useSeizeConnectContext();
  const connectedAddress = accountResolution.address as string | undefined;
  const hasConnectedWallet =
    accountResolution.isConnected && !!connectedAddress;
  const ensResolution = useEnsName({
    address: accountResolution.address as `0x${string}`,
    chainId: 1,
  });

  const {
    toastRef,
    toast,
    showToast,
    showDelegationToast,
    setToastVisibility,
  } = useDelegationToast();

  function printContent() {
    switch (props.section) {
      case DelegationCenterSection.CENTER:
        return (
          <DelegationCenterComponent
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.REGISTER_DELEGATION:
        if (!hasConnectedWallet || !connectedAddress) {
          return (
            <DelegationConnectWalletState
              title="Connect Wallet to Register a Delegation"
              body="Connect the wallet that owns the NFTs or controls the delegation manager rights. No on-chain delegation can be registered while disconnected."
              onConnect={accountResolution.seizeConnect}
            />
          );
        }
        return (
          <NewDelegationComponent
            address={connectedAddress}
            ens={ensResolution.data}
            collection_query={props.collection_query}
            setCollectionQuery={props.setCollectionQuery}
            use_case_query={props.use_case_query}
            setUseCaseQuery={props.setUseCaseQuery}
            onHide={() => {
              props.setActiveSection(DelegationCenterSection.CENTER);
            }}
            onSetToast={showDelegationToast}
          />
        );
      case DelegationCenterSection.REGISTER_SUB_DELEGATION:
        if (!hasConnectedWallet || !connectedAddress) {
          return (
            <DelegationConnectWalletState
              title="Connect Wallet to Register a Delegation Manager"
              body="Connect the wallet that should grant manager rights. No on-chain delegation manager record can be registered while disconnected."
              onConnect={accountResolution.seizeConnect}
            />
          );
        }
        return (
          <NewSubDelegationComponent
            address={connectedAddress}
            ens={ensResolution.data}
            onHide={() => {
              props.setActiveSection(DelegationCenterSection.CENTER);
            }}
            onSetToast={showDelegationToast}
          />
        );
      case DelegationCenterSection.REGISTER_CONSOLIDATION:
        if (!hasConnectedWallet || !connectedAddress) {
          return (
            <DelegationConnectWalletState
              title="Connect Wallet to Register a Consolidation"
              body="Connect one of the wallets you control. No on-chain consolidation can be registered while disconnected."
              onConnect={accountResolution.seizeConnect}
            />
          );
        }
        return (
          <NewConsolidationComponent
            address={connectedAddress}
            ens={ensResolution.data}
            onHide={() => {
              props.setActiveSection(DelegationCenterSection.CENTER);
            }}
            onSetToast={showDelegationToast}
          />
        );
      case DelegationCenterSection.ASSIGN_PRIMARY_ADDRESS:
        if (!hasConnectedWallet || !connectedAddress) {
          return (
            <DelegationConnectWalletState
              title="Connect Wallet to Assign a Primary Address"
              body="Connect the wallet that should assign its primary address. No primary-address record can be registered while disconnected."
              onConnect={accountResolution.seizeConnect}
            />
          );
        }
        return (
          <NewAssignPrimaryAddress
            address={connectedAddress}
            ens={ensResolution.data}
            onHide={() => {
              props.setActiveSection(DelegationCenterSection.CENTER);
            }}
            onSetToast={showDelegationToast}
            new_primary_address_query={props.address_query}
            setNewPrimaryAddressQuery={props.setAddressQuery}
          />
        );
      case DelegationCenterSection.ANY_COLLECTION:
        return (
          <CollectionDelegationComponent
            collection={ANY_COLLECTION}
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.MEMES_COLLECTION:
        return (
          <CollectionDelegationComponent
            collection={MEMES_COLLECTION}
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.MEME_LAB_COLLECTION:
        return (
          <CollectionDelegationComponent
            collection={MEME_LAB_COLLECTION}
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.GRADIENTS_COLLECTION:
        return (
          <CollectionDelegationComponent
            collection={GRADIENTS_COLLECTION}
            setSection={(section) => props.setActiveSection(section)}
          />
        );
      case DelegationCenterSection.WALLET_ARCHITECTURE:
        return (
          <DelegationHTML
            title="Wallet Architecture"
            path="reference-overview-wallet-architecture"
          />
        );
      case DelegationCenterSection.FAQ:
        return <DelegationHTML title="Delegation FAQ" path="delegation-faq" />;
      case DelegationCenterSection.CONSOLIDATION_USE_CASES:
        return (
          <DelegationHTML
            title="Consolidation Use Cases"
            path="consolidation-use-cases"
          />
        );
      case DelegationCenterSection.HTML:
        return (
          <DelegationHTML
            path={props.path && props.path[props.path?.length - 1]}
          />
        );
      case DelegationCenterSection.CHECKER:
        return (
          <WalletCheckerComponent
            address_query={props.address_query}
            setAddressQuery={props.setAddressQuery}
          />
        );
    }
  }

  function isMenuSectionActive(section: DelegationCenterSection) {
    return (
      props.section === section ||
      (section === DelegationCenterSection.FAQ &&
        props.section === DelegationCenterSection.HTML &&
        pathname?.startsWith("/delegation/delegation-faq/"))
    );
  }

  function printMenuButton(section: DelegationCenterSection, label: string) {
    const active = isMenuSectionActive(section);

    return (
      <button
        type="button"
        onClick={() => props.setActiveSection(section)}
        className={`${styles["menuLeftItem"]} ${
          active ? styles["menuLeftItemActive"] : ""
        }`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </button>
    );
  }

  function printMenuRows() {
    return DELEGATION_MENU_ITEMS.map((item, index) => (
      <Row
        className={index === 0 ? "pt-2 pb-2" : "pt-1 pb-2"}
        key={item.section}
      >
        <Col>{printMenuButton(item.section, item.label)}</Col>
      </Row>
    ));
  }

  function printExternalLinkRows() {
    return [
      <Row className="pt-2 pb-2" key="etherscan">
        <Col>
          <EtherscanLink />
        </Col>
      </Row>,
      <Row className="pt-2 pb-2" key="github">
        <Col>
          <GithubLink />
        </Col>
      </Row>,
    ];
  }

  return (
    <Container className="pt-4">
      <Row>
        <Col className={styles["menuLeft"]}>
          <Container>
            {printMenuRows()}
            {printExternalLinkRows()}
          </Container>
        </Col>
        {<Col className={styles["menuRight"]}>{printContent()}</Col>}
      </Row>
      <Row className="pt-4">
        <Col className={styles["menuLeftFull"]}>
          <Container>
            <Row>
              <Col>
                <Container className="no-padding">{printMenuRows()}</Container>
              </Col>
              <Col>
                <Container className="no-padding">
                  {printExternalLinkRows()}
                </Container>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      {toast && (
        <DelegationToast
          toastRef={toastRef}
          toast={toast}
          showToast={showToast}
          setShowToast={setToastVisibility}
        />
      )}
    </Container>
  );
}

function EtherscanLink() {
  return (
    <Link
      href={
        DELEGATION_CONTRACT.chain_id === sepolia.id
          ? `https://sepolia.etherscan.io/address/${DELEGATION_CONTRACT.contract}`
          : `https://etherscan.io/address/${DELEGATION_CONTRACT.contract}`
      }
      target="_blank"
      rel="noopener noreferrer"
      className={styles["delegationLink"]}
    >
      <Image unoptimized src="/etherscan_w.png" alt="" width={30} height={30} />
      <span>Etherscan</span>
    </Link>
  );
}

function GithubLink() {
  return (
    <Link
      href={`https://github.com/6529-Collections/nftdelegation`}
      target="_blank"
      rel="noopener noreferrer"
      className={styles["delegationLink"]}
    >
      <Image unoptimized src="/github_w.png" alt="" width={30} height={30} />
      <span>GitHub</span>
    </Link>
  );
}

function DelegationConnectWalletState(
  props: Readonly<{
    title: string;
    body: string;
    onConnect: () => void;
  }>
) {
  return (
    <section
      className={styles["connectRequired"]}
      aria-labelledby="connect-wallet-heading"
    >
      <h1 id="connect-wallet-heading">{props.title}</h1>
      <p>{props.body}</p>
      <button
        type="button"
        className={styles["connectRequiredButton"]}
        onClick={props.onConnect}
      >
        Connect Wallet
      </button>
    </section>
  );
}
