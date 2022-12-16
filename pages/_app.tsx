import "../styles/seize-bootstrap.scss";
import "../styles/globals.scss";
import type { AppProps } from "next/app";
import SSRProvider from "react-bootstrap/SSRProvider";

import { PROJECT_NAME } from "../constants";

import { alchemyProvider } from "wagmi/providers/alchemy";

import { publicProvider } from "wagmi/providers/public";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { InjectedConnector } from "wagmi/connectors/injected";
import {
  configureChains,
  createClient,
  defaultChains,
  WagmiConfig,
} from "wagmi";

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
} from "@fortawesome/free-solid-svg-icons";

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
  faEyeSlash
);

const providerAlchemy = alchemyProvider({
  apiKey: process.env.ALCHEMY_API_KEY,
});

const providerPublic = publicProvider();

const { chains, provider, webSocketProvider } = configureChains(defaultChains, [
  providerAlchemy,
  providerPublic,
]);

const client = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      options: {
        shimDisconnect: true,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: PROJECT_NAME,
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
  ],
  provider,
  webSocketProvider,
});

export default function App({ Component, pageProps }: AppProps) {
  pageProps.provider = provider;

  return (
    <SSRProvider>
      <WagmiConfig client={client}>
        <Component {...pageProps} />
      </WagmiConfig>
    </SSRProvider>
  );
}
