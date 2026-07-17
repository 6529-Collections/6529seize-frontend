"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { DELEGATION_CONTRACT } from "@/constants/constants";
import { DelegationCenterSection } from "@/types/enums";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEnsName } from "wagmi";
import { sepolia } from "wagmi/chains";
import CollectionDelegationComponent from "./CollectionDelegation";
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

const SECTIONS_WITHOUT_NAVIGATION = new Set<DelegationCenterSection>([
  DelegationCenterSection.REGISTER_DELEGATION,
  DelegationCenterSection.REGISTER_SUB_DELEGATION,
  DelegationCenterSection.REGISTER_CONSOLIDATION,
  DelegationCenterSection.ASSIGN_PRIMARY_ADDRESS,
  DelegationCenterSection.ANY_COLLECTION,
  DelegationCenterSection.MEMES_COLLECTION,
  DelegationCenterSection.MEME_LAB_COLLECTION,
  DelegationCenterSection.GRADIENTS_COLLECTION,
]);

interface Props {
  section: DelegationCenterSection;
  path?: string[] | undefined;
  setActiveSection(section: DelegationCenterSection): void;
  address_query: string;
  setAddressQuery(address: string): void;
  collection_query: string;
  setCollectionQuery(collection: string): void;
  use_case_query: number;
  setUseCaseQuery(use_case: number): void;
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
  const showNavigation = !SECTIONS_WITHOUT_NAVIGATION.has(props.section);

  const { toast, showToast, showDelegationToast, setToastVisibility } =
    useDelegationToast();

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
            key={props.address_query}
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
        className={`tw-min-h-11 tw-w-full tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
          active
            ? "tw-border-primary-400 tw-bg-primary-500 tw-text-white"
            : "tw-border-white/10 tw-bg-iron-900 tw-text-iron-300 hover:tw-border-white/20 hover:tw-bg-iron-800 hover:tw-text-white"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </button>
    );
  }

  function printMenuRows() {
    return DELEGATION_MENU_ITEMS.map((item) => (
      <div key={item.section}>{printMenuButton(item.section, item.label)}</div>
    ));
  }

  function printExternalLinkRows() {
    return [<GithubLink key="github" />, <EtherscanLink key="etherscan" />];
  }

  return (
    <div className="tw-mx-auto tw-w-full tw-max-w-[1440px] tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-px-8">
      {showNavigation && (
        <nav aria-label="Delegation center" className="tw-mb-8">
          <div className="tw-mb-3 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-2 sm:tw-justify-end">
            {printExternalLinkRows()}
          </div>
          <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-5">
            {printMenuRows()}
          </div>
        </nav>
      )}
      <div className="tw-w-full">{printContent()}</div>
      {toast && (
        <DelegationToast
          toast={toast}
          showToast={showToast}
          setShowToast={setToastVisibility}
        />
      )}
    </div>
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
      className="tw-group tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-md tw-px-1 tw-py-1.5 tw-text-sm tw-font-medium tw-text-white tw-no-underline tw-transition-all hover:-tw-translate-y-0.5 hover:tw-text-white hover:tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
    >
      <Image unoptimized src="/etherscan_w.png" alt="" width={24} height={24} />
      <span>Etherscan</span>
      <FontAwesomeIcon
        icon={faArrowUpRightFromSquare}
        className="tw-h-3.5 tw-w-3.5 tw-text-white tw-transition-colors group-hover:tw-text-primary-300"
        aria-hidden="true"
      />
    </Link>
  );
}

function GithubLink() {
  return (
    <Link
      href={`https://github.com/6529-Collections/nftdelegation`}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-group tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-md tw-px-1 tw-py-1.5 tw-text-sm tw-font-medium tw-text-white tw-no-underline tw-transition-all hover:-tw-translate-y-0.5 hover:tw-text-white hover:tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
    >
      <Image unoptimized src="/github_w.png" alt="" width={24} height={24} />
      <span>GitHub</span>
      <FontAwesomeIcon
        icon={faArrowUpRightFromSquare}
        className="tw-h-3.5 tw-w-3.5 tw-text-white tw-transition-colors group-hover:tw-text-primary-300"
        aria-hidden="true"
      />
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
      className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-5 sm:tw-p-6"
      aria-labelledby="connect-wallet-heading"
    >
      <h1
        id="connect-wallet-heading"
        className="tw-mb-2 tw-mt-0 tw-text-3xl tw-font-bold tw-text-white"
      >
        {props.title}
      </h1>
      <p className="tw-mb-4 tw-text-base tw-leading-6 tw-text-iron-300">
        {props.body}
      </p>
      <button
        type="button"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-5 tw-py-2.5 tw-text-base tw-font-semibold tw-text-black tw-transition-colors hover:tw-bg-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        onClick={() => {
          props.onConnect();
        }}
      >
        Connect Wallet
      </button>
    </section>
  );
}
