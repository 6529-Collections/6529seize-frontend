import "../styles/seize-bootstrap.scss";
import "../styles/globals.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import "../styles/swiper.scss";
import { Provider } from "react-redux";
import type { AppProps } from "next/app";
import { wrapper } from "../store/store";
import {
  CW_PROJECT_ID,
  DELEGATION_CONTRACT,
  SUBSCRIPTIONS_CHAIN,
} from "../constants";

import { Chain, goerli, mainnet, sepolia } from "wagmi/chains";
import { Connector, WagmiProvider } from "wagmi";

import Head from "next/head";
import { NEXTGEN_CHAIN_ID } from "../components/nextGen/nextgen_contracts";
import Auth from "../components/auth/Auth";
import { NextPage, NextPageContext } from "next";
import { ReactElement, ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactQueryWrapper from "../components/react-query-wrapper/ReactQueryWrapper";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import "../components/drops/create/lexical/lexical.styles.scss";
import { CookieConsentProvider } from "../components/cookies/CookieConsentContext";
import { MANIFOLD_NETWORK } from "../hooks/useManifoldClaim";
import { wagmiConfigWeb } from "../wagmiConfig/wagmiConfigWeb";
import { wagmiConfigCapacitor } from "../wagmiConfig/wagmiConfigCapacitor";
import useCapacitor from "../hooks/useCapacitor";
import { NotificationsProvider } from "../components/notifications/NotificationsContext";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { SeizeConnectProvider } from "../components/auth/SeizeConnectContext";
import { IpfsProvider, resolveIpfsUrl } from "../components/ipfs/IPFSContext";
import { EULAConsentProvider } from "../components/eula/EULAConsentContext";
import {
  AppWallet,
  appWalletsEventEmitter,
  AppWalletsProvider,
} from "../components/app-wallets/AppWalletsContext";
import {
  APP_WALLET_CONNECTOR_TYPE,
  createAppWalletConnector,
} from "../wagmiConfig/wagmiAppWalletConnector";
import { Capacitor } from "@capacitor/core";
import { useAppWalletPasswordModal } from "../hooks/useAppWalletPasswordModal";
import { SeizeSettingsProvider } from "../contexts/SeizeSettingsContext";
import { EmojiProvider } from "../contexts/EmojiContext";
import { AppWebSocketProvider } from "../services/websocket/AppWebSocketProvider";
import MainLayout from "../components/layout/MainLayout";
import { HeaderProvider } from "../contexts/HeaderContext";
import NewVersionToast from "../components/utils/NewVersionToast";
import { PageSSRMetadata } from "../helpers/Types";

export function getChains() {
  const chains: Chain[] = [mainnet];
  if (
    DELEGATION_CONTRACT.chain_id === sepolia.id ||
    (NEXTGEN_CHAIN_ID as number) === sepolia.id ||
    SUBSCRIPTIONS_CHAIN.id.toString() === sepolia.id.toString() ||
    MANIFOLD_NETWORK.id.toString() === sepolia.id.toString()
  ) {
    chains.push(sepolia);
  }
  if (
    DELEGATION_CONTRACT.chain_id === goerli.id ||
    (NEXTGEN_CHAIN_ID as number) === goerli.id
  ) {
    chains.push(goerli);
  }
  return chains;
}

const CONTRACT_CHAINS = getChains();

const wagmiMetadata = {
  name: "6529.io",
  description: "6529.io",
  url: process.env.BASE_ENDPOINT!,
  icons: [
    "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
  ],
};

const chains = [...CONTRACT_CHAINS] as [Chain, ...Chain[]];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

const isCapacitor = Capacitor.isNativePlatform();
const wagmiConfig = isCapacitor
  ? wagmiConfigCapacitor(chains, wagmiMetadata)
  : wagmiConfigWeb(chains, wagmiMetadata);

createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId: CW_PROJECT_ID,
  enableAnalytics: true,
  themeMode: "dark",
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
  const capacitor = useCapacitor();
  const appWalletPasswordModal = useAppWalletPasswordModal();
  const router = useRouter();

  const FooterDynamic = dynamic(() => import("../FooterWrapper"), {
    ssr: false,
  });

  useEffect(() => {
    const createConnectorForWallet = (
      wallet: AppWallet,
      requestPassword: (
        address: string,
        addressHashed: string
      ) => Promise<string>
    ): Connector | null => {
      const connector = createAppWalletConnector({ appWallet: wallet }, () =>
        requestPassword(wallet.address, wallet.address_hashed)
      );
      return wagmiConfig?._internal.connectors.setup(connector) ?? null;
    };

    const isConnectorNew = (
      connector: Connector,
      existingConnectors: Connector[]
    ): boolean => {
      return !existingConnectors.some(
        (existing) => existing.id === connector.id
      );
    };

    const getNewConnectors = (
      connectors: Connector[],
      existingConnectors: Connector[]
    ): Connector[] => {
      return connectors.filter((connector) =>
        isConnectorNew(connector, existingConnectors)
      );
    };

    const appWalletsEventEmitterHandler = async (wallets: AppWallet[]) => {
      const connectors = wallets
        .map((wallet) =>
          createConnectorForWallet(
            wallet,
            appWalletPasswordModal.requestPassword
          )
        )
        .filter((connector): connector is Connector => connector !== null);

      const existingConnectors =
        wagmiConfig?.connectors.filter(
          (c) => c.id !== APP_WALLET_CONNECTOR_TYPE
        ) ?? [];

      const newConnectors = getNewConnectors(connectors, existingConnectors);

      wagmiConfig?._internal.connectors.setState([
        ...newConnectors,
        ...existingConnectors,
      ]);
    };

    appWalletsEventEmitter.on("update", appWalletsEventEmitterHandler);

    return () => {
      appWalletsEventEmitter.off("update", appWalletsEventEmitterHandler);
    };
  }, []);

  useEffect(() => {
    if (capacitor.isCapacitor) {
      document.body.classList.add("capacitor-native");
    }
  }, []);

  const updateImagesSrc = async () => {
    const elementsWithSrc = document.querySelectorAll("[src]");
    Array.from(elementsWithSrc).forEach(async (el) => {
      const src = el.getAttribute("src")!;
      const newSrc = await resolveIpfsUrl(src);
      if (newSrc !== src) {
        el.setAttribute("src", newSrc);
      }
    });
  };

  useEffect(() => {
    updateImagesSrc();

    const observer = new MutationObserver(() => {
      updateImagesSrc();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const pageMetadata = rest.pageProps.metadata;
  const componentMetadata = (Component as any).metadata;
  const isStaging = process.env.BASE_ENDPOINT?.includes("staging");
  const metadata: PageSSRMetadata = {
    title:
      componentMetadata?.title ??
      pageMetadata?.title ??
      (isStaging ? "6529 Staging" : "6529"),
    description:
      componentMetadata?.description ?? pageMetadata?.description ?? "",
    ogImage:
      componentMetadata?.ogImage ??
      pageMetadata?.ogImage ??
      `${process.env.BASE_ENDPOINT}/6529io.png`,
    twitterCard:
      componentMetadata?.twitterCard ?? pageMetadata?.twitterCard ?? "summary",
  };
  metadata.description = `${
    metadata.description ? `${metadata.description} | ` : ""
  }${isStaging ? "staging.6529.io" : "6529.io"}`;

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        {capacitor.isCapacitor && (
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
            />
          </Head>
        )}
        <WagmiProvider config={wagmiConfig}>
          <ReactQueryWrapper>
            <SeizeSettingsProvider>
              <EmojiProvider>
                <IpfsProvider>
                  <AppWalletsProvider>
                    <SeizeConnectProvider>
                      <Auth>
                        <NotificationsProvider>
                          <CookieConsentProvider>
                            <EULAConsentProvider>
                              <AppWebSocketProvider>
                                <HeaderProvider>
                                  <MainLayout metadata={metadata}>
                                    {getLayout(
                                      <Component
                                        {...props}
                                        key={router.asPath.split("?")[0]}
                                      />
                                    )}
                                  </MainLayout>
                                </HeaderProvider>
                                {appWalletPasswordModal.modal}
                                <NewVersionToast />
                              </AppWebSocketProvider>
                            </EULAConsentProvider>
                          </CookieConsentProvider>
                        </NotificationsProvider>
                      </Auth>
                    </SeizeConnectProvider>
                  </AppWalletsProvider>
                </IpfsProvider>
              </EmojiProvider>
            </SeizeSettingsProvider>
          </ReactQueryWrapper>
          <FooterDynamic />
        </WagmiProvider>
      </Provider>
    </QueryClientProvider>
  );
}
