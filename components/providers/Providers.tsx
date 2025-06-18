"use client";

import Auth from "@/components/auth/Auth";
import { ReactNode, Suspense } from "react";
import ReactQueryWrapper from "@/components/react-query-wrapper/ReactQueryWrapper";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { NotificationsProvider } from "@/components/notifications/NotificationsContext";
import { SeizeConnectProvider } from "@/components/auth/SeizeConnectContext";
import { IpfsProvider } from "@/components/ipfs/IPFSContext";
import { EULAConsentProvider } from "@/components/eula/EULAConsentContext";
import { AppWalletsProvider } from "@/components/app-wallets/AppWalletsContext";
import { SeizeSettingsProvider } from "@/contexts/SeizeSettingsContext";
import { EmojiProvider } from "@/contexts/EmojiContext";
import { AppWebSocketProvider } from "@/services/websocket/AppWebSocketProvider";
import { HeaderProvider } from "@/contexts/HeaderContext";
import NewVersionToast from "@/components/utils/NewVersionToast";
import WagmiSetup from "./WagmiSetup";
import CapacitorSetup from "./CapacitorSetup";
import FooterWrapper from "@/FooterWrapper";
import IpfsImageSetup from "./IpfsImageSetup";
import QueryClientSetup from "./QueryClientSetup";
import { NavigationHistoryProvider } from "@/contexts/NavigationHistoryContext";
import { ScrollPositionProvider } from "@/contexts/ScrollPositionContext";
import { LayoutProvider } from "../brain/my-stream/layout/LayoutContext";
import { ViewProvider } from "../navigation/ViewContext";
import { MyStreamProvider } from "@/contexts/wave/MyStreamContext";
import { TitleProvider } from "@/contexts/TitleContext";
import { getWagmiConfig } from "@/wagmiConfig/wagmiConfig";
import { initWeb3Modal } from "./web3ModalSetup";

export default function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const wagmiConfig = getWagmiConfig();
  initWeb3Modal(wagmiConfig.config);

  return (
    <QueryClientSetup>
      <WagmiSetup wagmiConfig={wagmiConfig}>
        <CapacitorSetup />
        <IpfsImageSetup />
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
                              <Suspense fallback={null}>
                                <TitleProvider>
                                  <HeaderProvider>
                                    <ScrollPositionProvider>
                                      <ViewProvider>
                                        <NavigationHistoryProvider>
                                          <LayoutProvider>
                                            <MyStreamProvider>
                                              {children}
                                            </MyStreamProvider>
                                          </LayoutProvider>
                                        </NavigationHistoryProvider>
                                      </ViewProvider>
                                    </ScrollPositionProvider>
                                  </HeaderProvider>
                                </TitleProvider>
                              </Suspense>
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
        <FooterWrapper />
      </WagmiSetup>
    </QueryClientSetup>
  );
}
