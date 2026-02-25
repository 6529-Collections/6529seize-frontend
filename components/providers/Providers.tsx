import { AppWalletsProvider } from "@/components/app-wallets/AppWalletsContext";
import Auth from "@/components/auth/Auth";
import { SeizeConnectProvider } from "@/components/auth/SeizeConnectContext";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { EULAConsentProvider } from "@/components/eula/EULAConsentContext";
import { IpfsProvider } from "@/components/ipfs/IPFSContext";
import { NotificationsProvider } from "@/components/notifications/NotificationsContext";
import ReactQueryWrapper from "@/components/react-query-wrapper/ReactQueryWrapper";
import NewVersionToast from "@/components/utils/NewVersionToast";
import { EmojiProvider } from "@/contexts/EmojiContext";
import { HeaderProvider } from "@/contexts/HeaderContext";
import { NavigationHistoryProvider } from "@/contexts/NavigationHistoryContext";
import { RefreshProvider } from "@/contexts/RefreshContext";
import { ScrollPositionProvider } from "@/contexts/ScrollPositionContext";
import { SeizeSettingsProvider } from "@/contexts/SeizeSettingsContext";
import { TitleProvider } from "@/contexts/TitleContext";
import { MyStreamProvider } from "@/contexts/wave/MyStreamContext";
import { WaveEligibilityProvider } from "@/contexts/wave/WaveEligibilityContext";
import { AppWebSocketProvider } from "@/services/websocket/AppWebSocketProvider";

import { LayoutProvider } from "../brain/my-stream/layout/LayoutContext";
import { ViewProvider } from "../navigation/ViewContext";

import CapacitorSetup from "./CapacitorSetup";
import IpfsImageSetup from "./IpfsImageSetup";
import QueryClientSetup from "./QueryClientSetup";
import WagmiSetup from "./WagmiSetup";

export default function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <QueryClientSetup>
      <AppWalletsProvider>
        <WagmiSetup>
          <CapacitorSetup />
          <IpfsImageSetup />
          <ReactQueryWrapper>
            <RefreshProvider>
              <SeizeSettingsProvider>
                <EmojiProvider>
                  <IpfsProvider>
                    <SeizeConnectProvider>
                      <Auth>
                        <WaveEligibilityProvider>
                          <NotificationsProvider>
                            <CookieConsentProvider>
                              <EULAConsentProvider>
                                <AppWebSocketProvider>
                                  <LayoutProvider>
                                    <MyStreamProvider>
                                      <TitleProvider>
                                        <HeaderProvider>
                                          <ScrollPositionProvider>
                                            <ViewProvider>
                                              <NavigationHistoryProvider>
                                                {children}
                                              </NavigationHistoryProvider>
                                            </ViewProvider>
                                          </ScrollPositionProvider>
                                        </HeaderProvider>
                                      </TitleProvider>
                                    </MyStreamProvider>
                                  </LayoutProvider>
                                  <NewVersionToast />
                                </AppWebSocketProvider>
                              </EULAConsentProvider>
                            </CookieConsentProvider>
                          </NotificationsProvider>
                        </WaveEligibilityProvider>
                      </Auth>
                    </SeizeConnectProvider>
                  </IpfsProvider>
                </EmojiProvider>
              </SeizeSettingsProvider>
            </RefreshProvider>
          </ReactQueryWrapper>
        </WagmiSetup>
      </AppWalletsProvider>
    </QueryClientSetup>
  );
}
