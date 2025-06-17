"use client";

import Auth from "@/components/auth/Auth";
import { ReactNode } from "react";
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

export default function AllProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientSetup>
      <WagmiSetup>
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
                              <HeaderProvider>{children}</HeaderProvider>
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
