import "../styles/seize-bootstrap.scss";
import "../styles/globals.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

import type { AppProps } from "next/app";
import SSRProvider from "react-bootstrap/SSRProvider";

import { CW_PROJECT_ID, DELEGATION_CONTRACT, PROJECT_NAME } from "../constants";

import { alchemyProvider } from "wagmi/providers/alchemy";

import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { publicProvider } from "@wagmi/core/providers/public";

import { mainnet, sepolia } from "wagmi/chains";
import { configureChains, createClient, WagmiConfig } from "wagmi";

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
} from "@fortawesome/free-solid-svg-icons";
import Head from "next/head";

library.add(
  faArrowUp,
  faArrowDown,
  faCircleArrowLeft,
  faCopy,
  faCaretRight,
  faCaretLeft,
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
  faCaretDown,
  faMinus,
  faInfoCircle,
  faArrowTurnRight,
  faCheckCircle,
  faFileUpload,
  faUser,
  faArrowCircleDown,
  faExternalLinkSquare
);

const CONTRACT_CHAINS =
  DELEGATION_CONTRACT.chain_id == mainnet.id ? [mainnet] : [mainnet, sepolia];

const { chains, provider } = configureChains(CONTRACT_CHAINS, [
  alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY! }),
  w3mProvider({ projectId: CW_PROJECT_ID }),
  publicProvider(),
]);

const client = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId: CW_PROJECT_ID, version: 1, chains }),
  provider,
});

export default function App({ Component, pageProps }: AppProps) {
  pageProps.provider = provider;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <SSRProvider>
        <WagmiConfig client={client}>
          <Component {...pageProps} />
        </WagmiConfig>
      </SSRProvider>
    </>
  );
}
