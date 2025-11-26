import Auth from "@/components/auth/Auth";
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
import IpfsImageSetup from "./IpfsImageSetup";
import QueryClientSetup from "./QueryClientSetup";
import { NavigationHistoryProvider } from "@/contexts/NavigationHistoryContext";
import { ScrollPositionProvider } from "@/contexts/ScrollPositionContext";
import { LayoutProvider } from "../brain/my-stream/layout/LayoutContext";
import { ViewProvider } from "../navigation/ViewContext";
import { MyStreamProvider } from "@/contexts/wave/MyStreamContext";
import { TitleProvider } from "@/contexts/TitleContext";
import { WaveEligibilityProvider } from "@/contexts/wave/WaveEligibilityContext";

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
          </ReactQueryWrapper>
        </WagmiSetup>
      </AppWalletsProvider>
    </QueryClientSetup>
  );
}
