import "../styles/seize-bootstrap.scss";
import "../styles/globals.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

import type { AppProps } from "next/app";
import SSRProvider from "react-bootstrap/SSRProvider";
import { Web3Modal } from "@web3modal/react";

import {
  CW_PROJECT_ID,
  DELEGATION_CONTRACT,
  NEXT_GEN_CONTRACT,
  PROJECT_NAME,
} from "../constants";

import { alchemyProvider } from "wagmi/providers/alchemy";

import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";

import { mainnet, sepolia } from "wagmi/chains";
import { configureChains, createConfig, WagmiConfig } from "wagmi";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowUp,
  faArrowDown,
  faCopy,
  faCaretRight,
  faCaretLeft,
  faExchange,
  faShoppingCart,
  faCircleChevronUp,
  faCircleChevronDown,
  faSquareCaretUp,
  faSquareCaretDown,
  faParachuteBox,
  faDownload,
  faChevronCircleUp,
  faChevronCircleDown,
  faChevronCircleLeft,
  faChevronCircleRight,
  faExpandAlt,
  faBars,
  faEye,
  faEyeSlash,
  faCheck,
  faXmark,
  faCartPlus,
  faTimesCircle,
  faLink,
  faSearch,
  faX,
  faSquareXmark,
  faChevronUp,
  faLock,
  faLockOpen,
  faPlus,
  faMinus,
  faCaretDown,
  faCircleArrowLeft,
  faInfoCircle,
  faArrowTurnRight,
  faCheckCircle,
  faFileUpload,
  faUser,
  faArrowCircleDown,
  faExternalLinkSquare,
  faPlusCircle,
  faXmarkCircle,
  faCaretUp,
  faChevronDown,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import Head from "next/head";

library.add(
  faArrowUp,
  faArrowDown,
  faCircleArrowLeft,
  faCopy,
  faCaretRight,
  faCaretLeft,
  faCaretUp,
  faCaretDown,
  faChevronUp,
  faChevronDown,
  faExchange,
  faShoppingCart,
  faSquareCaretUp,
  faSquareCaretDown,
  faCircleChevronUp,
  faCircleChevronDown,
  faChevronCircleUp,
  faChevronCircleDown,
  faChevronCircleLeft,
  faChevronCircleRight,
  faParachuteBox,
  faDownload,
  faExpandAlt,
  faBars,
  faEye,
  faEyeSlash,
  faCheck,
  faXmark,
  faCartPlus,
  faTimesCircle,
  faLink,
  faSearch,
  faX,
  faSquareXmark,
  faChevronUp,
  faLock,
  faLockOpen,
  faMinus,
  faPlus,
  faMinus,
  faInfoCircle,
  faArrowTurnRight,
  faCheckCircle,
  faFileUpload,
  faUser,
  faArrowCircleDown,
  faExternalLinkSquare,
  faPlusCircle,
  faXmarkCircle,
  faGlobe
);

const CONTRACT_CHAINS =
  DELEGATION_CONTRACT.chain_id === mainnet.id &&
  NEXT_GEN_CONTRACT.chain_id === mainnet.id
    ? [mainnet]
    : [mainnet, sepolia];

const { chains, publicClient } = configureChains(CONTRACT_CHAINS, [
  alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY! }),
  w3mProvider({ projectId: CW_PROJECT_ID }),
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId: CW_PROJECT_ID, version: 2, chains }),
  publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <SSRProvider>
        <WagmiConfig config={wagmiConfig}>
          <Component {...pageProps} />
        </WagmiConfig>
      </SSRProvider>

      <Web3Modal
        defaultChain={mainnet}
        projectId={CW_PROJECT_ID}
        ethereumClient={ethereumClient}
        themeMode={"dark"}
        themeVariables={{
          "--w3m-background-color": "#282828",
          "--w3m-logo-image-url":
            "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
          "--w3m-accent-color": "#fff",
          "--w3m-accent-fill-color": "#000",
          "--w3m-button-border-radius": "0",
          "--w3m-font-family": "Arial",
        }}
      />
    </>
  );
}
