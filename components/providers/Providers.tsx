"use client";

// Keep the whole provider tree behind this one client boundary. Each Client
// Component a Server Component renders becomes its own client reference in the
// RSC payload, and each reference repeats the root layout's full chunk list in
// the inline flight data of every HTML page.
import { WaveInformationProvider } from "@/contexts/WaveInformationContext";
import { VersionStatusProvider } from "@/contexts/VersionStatusContext";
import { AppWalletsProvider } from "@/components/app-wallets/AppWalletsContext";
import Auth from "@/components/auth/Auth";
import AuthLaunchTimingReporter from "@/components/auth/AuthLaunchTimingReporter";
import MarketActivityTracker from "@/components/collect/MarketActivityTracker";
import SignedWriteDecisionHost from "@/components/device-signing/SignedWriteDecisionHost";
import { SeizeConnectProvider } from "@/components/auth/SeizeConnectContext";
import { NftPurchasingServerRenderProvider } from "@/components/common/NftPurchasingServerRender";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import E2eeProvider from "@/components/e2ee/E2eeProvider";
import { IpfsProvider } from "@/components/ipfs/IPFSContext";
import QuickDirectMessagesGate from "@/components/messages/quick-dms/QuickDirectMessagesGate";
import { NotificationsProvider } from "@/components/notifications/NotificationsContext";
import ReactQueryWrapper from "@/components/react-query-wrapper/ReactQueryWrapper";
import NewVersionToast from "@/components/utils/NewVersionToast";
import { ActiveGroupProvider } from "@/contexts/ActiveGroupContext";
import { EditingDropProvider } from "@/contexts/EditingDropContext";
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
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import { SeizeSettingsMode } from "@/types/enums";
import { LayoutProvider } from "../brain/my-stream/layout/LayoutContext";
import { ViewProvider } from "../navigation/ViewContext";
import CapacitorSetup from "./CapacitorSetup";
import EULAConsentStartup from "./EULAConsentStartup";
import IpfsImageSetup from "./IpfsImageSetup";
import LocaleMessagesGate from "./LocaleMessagesGate";
import MixpanelSetup from "./MixpanelSetup";
import QueryClientSetup from "./QueryClientSetup";
import WagmiSetup from "./WagmiSetup";
import DocumentLanguage from "./DocumentLanguage";

export default function Providers({
  children,
  enableVersionCheck = true,
  enableWalletAuthentication = true,
  enableCookieConsent = true,
  enableMyStream = true,
  settingsMode = SeizeSettingsMode.REMOTE,
  initialIsIos = false,
  initialEulaConsentVersion,
  canServerRenderNftPurchasing = false,
}: {
  readonly children: React.ReactNode;
  readonly enableVersionCheck?: boolean;
  readonly enableWalletAuthentication?: boolean;
  readonly enableCookieConsent?: boolean;
  readonly enableMyStream?: boolean;
  readonly settingsMode?: SeizeSettingsMode;
  readonly initialIsIos?: boolean;
  readonly initialEulaConsentVersion?: string | undefined;
  readonly canServerRenderNftPurchasing?: boolean;
}) {
  const sharedProviders = (
    <TitleProvider>
      <HeaderProvider>
        <ScrollPositionProvider>
          <ViewProvider>
            <WaveInformationProvider>
              <NavigationHistoryProvider>
                <LocaleMessagesGate>{children}</LocaleMessagesGate>
              </NavigationHistoryProvider>
            </WaveInformationProvider>
          </ViewProvider>
        </ScrollPositionProvider>
      </HeaderProvider>
    </TitleProvider>
  );

  const appProviders = (
    <QueryClientSetup>
      <AppWalletsProvider>
        <WagmiSetup>
          <IpfsImageSetup />
          <ReactQueryWrapper>
            <VersionStatusProvider enabled={enableVersionCheck}>
              <RefreshProvider>
                <SeizeSettingsProvider mode={settingsMode}>
                  <EmojiProvider>
                    <IpfsProvider>
                      <SeizeConnectProvider>
                        <Auth
                          enableWalletAuthentication={
                            enableWalletAuthentication
                          }
                        >
                          <AuthLaunchTimingReporter
                            enableWalletAuthentication={
                              enableWalletAuthentication
                            }
                          />
                          {enableWalletAuthentication && (
                            <MarketActivityTracker />
                          )}
                          {enableWalletAuthentication &&
                            isSignedMessagesEnabled() && (
                              <SignedWriteDecisionHost />
                            )}
                          <WaveEligibilityProvider>
                            <NotificationsProvider>
                              <CookieConsentProvider
                                disabled={!enableCookieConsent}
                              >
                                <MixpanelSetup />
                                <AppWebSocketProvider>
                                  {/* Encrypted chats (D109): inert unless the flag is on. */}
                                  <E2eeProvider>
                                    <LayoutProvider>
                                      {enableMyStream ? (
                                        <MyStreamProvider>
                                          {sharedProviders}
                                          <QuickDirectMessagesGate />
                                        </MyStreamProvider>
                                      ) : (
                                        sharedProviders
                                      )}
                                    </LayoutProvider>
                                  </E2eeProvider>
                                  {enableVersionCheck && <NewVersionToast />}
                                </AppWebSocketProvider>
                              </CookieConsentProvider>
                            </NotificationsProvider>
                          </WaveEligibilityProvider>
                        </Auth>
                      </SeizeConnectProvider>
                    </IpfsProvider>
                  </EmojiProvider>
                </SeizeSettingsProvider>
              </RefreshProvider>
            </VersionStatusProvider>
          </ReactQueryWrapper>
        </WagmiSetup>
      </AppWalletsProvider>
    </QueryClientSetup>
  );

  return (
    <>
      <DocumentLanguage />
      <CapacitorSetup />
      <EULAConsentStartup
        initialIsIos={initialIsIos}
        initialConsentVersion={initialEulaConsentVersion}
      >
        <EditingDropProvider>
          <ActiveGroupProvider>
            <NftPurchasingServerRenderProvider
              enabled={canServerRenderNftPurchasing}
            >
              {appProviders}
            </NftPurchasingServerRenderProvider>
          </ActiveGroupProvider>
        </EditingDropProvider>
      </EULAConsentStartup>
    </>
  );
}
