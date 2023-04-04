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
import { Web3Modal } from "@web3modal/react";
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
  faMinus
);

const { chains, provider } = configureChains(
  [sepolia, mainnet],
  [
    alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY! }),
    w3mProvider({ projectId: CW_PROJECT_ID }),
    publicProvider(),
  ]
);

const client = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId: CW_PROJECT_ID, version: 1, chains }),
  provider,
});

const ethereumClient = new EthereumClient(client, chains);

const customButton = {
  onClick: async () => {
    // Your custom logic here
    console.log("Custom button clicked");
  },
  text: "Custom Button",
  style: {
    background: "purple",
    color: "white",
    borderRadius: "4px",
    padding: "8px",
    margin: "4px",
    cursor: "pointer",
  },
};

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
      <Web3Modal
        defaultChain={mainnet}
        projectId={CW_PROJECT_ID}
        ethereumClient={ethereumClient}
        themeMode={"dark"}
        themeVariables={{
          "--w3m-background-color": "#282828",
          "--w3m-logo-image-url": "/Seize_Logo_Glasses_3.png",
          "--w3m-accent-color": "#fff",
          "--w3m-accent-fill-color": "#000",
          "--w3m-button-border-radius": "0",
          "--w3m-font-family": "Arial",
        }}
      />
    </>
  );
}
