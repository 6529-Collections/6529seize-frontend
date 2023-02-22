import "../styles/seize-bootstrap.scss";
import "../styles/globals.scss";
import type { AppProps } from "next/app";
import SSRProvider from "react-bootstrap/SSRProvider";

import { PROJECT_NAME } from "../constants";

import { alchemyProvider } from "wagmi/providers/alchemy";

import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { InjectedConnector } from "wagmi/connectors/injected";
import { mainnet } from "wagmi/chains";
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
} from "@fortawesome/free-solid-svg-icons";
import Head from "next/head";

library.add(
  faArrowUp,
  faArrowDown,
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
  faCartPlus
);

const { chains, provider } = configureChains(
  [mainnet],
  [alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY! })]
);

const client = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: PROJECT_NAME,
      },
    }),
  ],
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
