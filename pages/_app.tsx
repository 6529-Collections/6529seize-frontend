import "../styles/seize-bootstrap.scss";
import "../styles/globals.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import "../styles/swiper.scss";
import { Provider } from "react-redux";
import type { AppProps } from "next/app";
import { wrapper } from "../store/store";
import { CW_PROJECT_ID, DELEGATION_CONTRACT } from "../constants";

import { Chain, goerli, mainnet, sepolia } from "wagmi/chains";
import { WagmiConfig } from "wagmi";

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
  faArrowsTurnRight,
  faCheckCircle,
  faFileUpload,
  faUser,
  faArrowCircleDown,
  faExternalLinkSquare,
  faPlusCircle,
  faXmarkCircle,
  faFire,
  faGlobe,
  faExternalLink,
  faFileCsv,
  faRefresh,
  faImage,
  faWallet,
  faGear,
  faArrowCircleLeft,
  faArrowRightFromBracket,
  faGasPump,
  faFaceGrinWide,
  faFaceSmile,
  faFrown,
  faArrowCircleRight,
  faTowerBroadcast,
  faLightbulb,
  faMaximize,
  faPlayCircle,
  faPauseCircle,
  faSpinner,
  faFilter,
  faFilterCircleXmark,
  faMagnifyingGlass,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPlusSquare,
  faMinusSquare,
  faChevronDown,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import Head from "next/head";
import { NEXTGEN_CHAIN_ID } from "../components/nextGen/nextgen_contracts";
import Auth from "../components/auth/Auth";
import { NextPage, NextPageContext } from "next";
import { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ReactQueryWrapper from "../components/react-query-wrapper/ReactQueryWrapper";

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
  faArrowsTurnRight,
  faCheckCircle,
  faFileUpload,
  faUser,
  faArrowCircleDown,
  faExternalLinkSquare,
  faPlusCircle,
  faXmarkCircle,
  faFire,
  faGlobe,
  faExternalLink,
  faFileCsv,
  faRefresh,
  faImage,
  faWallet,
  faGear,
  faArrowCircleLeft,
  faArrowCircleRight,
  faArrowRightFromBracket,
  faGasPump,
  faFaceGrinWide,
  faFaceSmile,
  faFrown,
  faTowerBroadcast,
  faLightbulb,
  faMaximize,
  faPlayCircle,
  faPauseCircle,
  faSpinner,
  faFilter,
  faFilterCircleXmark,
  faCheckCircle,
  faMagnifyingGlass,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPlusSquare,
  faMinusSquare,
  faChevronDown,
  faEdit
);

const CONTRACT_CHAINS: Chain[] = [mainnet];
if (
  DELEGATION_CONTRACT.chain_id === sepolia.id ||
  (NEXTGEN_CHAIN_ID as number) === sepolia.id
) {
  CONTRACT_CHAINS.push(sepolia);
}
if (
  DELEGATION_CONTRACT.chain_id === goerli.id ||
  (NEXTGEN_CHAIN_ID as number) === goerli.id
) {
  CONTRACT_CHAINS.push(goerli);
}

import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";

const metadata = {
  name: "Seize",
  description: "6529 Seize",
  url: process.env.BASE_ENDPOINT,
};

export const wagmiConfig = defaultWagmiConfig({
  chains: CONTRACT_CHAINS,
  projectId: CW_PROJECT_ID,
  metadata,
});

createWeb3Modal({
  wagmiConfig,
  projectId: CW_PROJECT_ID,
  enableAnalytics: true,
  themeMode: "dark",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      refetchOnWindowFocus: false,
    },
  },
});

export type NextPageWithLayout<Props> = NextPage<Props> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout<NextPageContext>;
};

export default function App({ Component, ...rest }: AppPropsWithLayout) {
  const { store, props } = wrapper.useWrappedStore(rest);
  const getLayout = Component.getLayout ?? ((page) => page);
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1"
          />
        </Head>
        <WagmiConfig config={wagmiConfig}>
          <ReactQueryWrapper>
            <Auth>{getLayout(<Component {...props} />)}</Auth>
          </ReactQueryWrapper>
        </WagmiConfig>
        {/* <Web3Modal
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
        /> */}
      </Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
