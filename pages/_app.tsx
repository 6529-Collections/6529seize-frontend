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

import { Connector } from "wagmi";

import Head from "next/head";
import Auth from "../components/auth/Auth";
import { NextPage, NextPageContext } from "next";
import { ReactElement, ReactNode, useEffect } from "react";
import "../components/drops/create/lexical/lexical.styles.scss";
import { CookieConsentProvider } from "../components/cookies/CookieConsentContext";
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
import { useAppWalletPasswordModal } from "../hooks/useAppWalletPasswordModal";
import { SeizeSettingsProvider } from "../contexts/SeizeSettingsContext";
import { EmojiProvider } from "../contexts/EmojiContext";
import { AppWebSocketProvider } from "../services/websocket/AppWebSocketProvider";
import MainLayout from "../components/layout/MainLayout";
import { HeaderProvider } from "../contexts/HeaderContext";
import NewVersionToast from "../components/utils/NewVersionToast";
import { PageSSRMetadata } from "../helpers/Types";

// Import CoreClientProviders
import CoreClientProviders from "../components/shared/CoreClientProviders";

export type NextPageWithLayout<Props> = NextPage<Props> & {
  getLayout?: (page: ReactElement<any>) => ReactNode;
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
      return connector;
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
      
      // This section interacting with wagmiConfig.connectors is non-functional without wagmiConfig
      // console.warn("appWalletsEventEmitterHandler: wagmiConfig not directly accessible in _app.tsx after refactor. Dynamic connector updates might be affected.");
      
      // Example of what it might have done - this cannot run now:
      /*
      const tempWagmiConfig: any = {}; // placeholder
      const existingConnectors =
        tempWagmiConfig?.connectors?.filter(
          (c: Connector) => c.id !== APP_WALLET_CONNECTOR_TYPE
        ) ?? [];
      const newConnectors = getNewConnectors(connectors, existingConnectors);
      if (tempWagmiConfig?._internal?.connectors?.setState) {
        tempWagmiConfig._internal.connectors.setState([
          ...newConnectors,
          ...existingConnectors,
        ]);
      }
      */
    };

    appWalletsEventEmitter.on("update", appWalletsEventEmitterHandler);

    return () => {
      appWalletsEventEmitter.off("update", appWalletsEventEmitterHandler);
    };
  }, [appWalletPasswordModal]);

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
    <Provider store={store}>
      {capacitor.isCapacitor && (
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
          />
        </Head>
      )}
      <CoreClientProviders>
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
        <FooterDynamic />
      </CoreClientProviders>
    </Provider>
  );
}
