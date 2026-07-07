import { AppWalletsProvider } from "@/components/app-wallets/AppWalletsContext";
import Auth from "@/components/auth/Auth";
import AuthLaunchTimingReporter from "@/components/auth/AuthLaunchTimingReporter";
import {
  SeizeConnectProvider,
  SeizeConnectStartupFallbackProvider,
} from "@/components/auth/SeizeConnectContext";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { EULAConsentProvider } from "@/components/eula/EULAConsentContext";
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
import { SeizeSettingsMode } from "@/types/enums";
import { LayoutProvider } from "../brain/my-stream/layout/LayoutContext";
import { ViewProvider } from "../navigation/ViewContext";
import CapacitorSetup from "./CapacitorSetup";
import IpfsImageSetup from "./IpfsImageSetup";
import MixpanelSetup from "./MixpanelSetup";
import QueryClientSetup from "./QueryClientSetup";
import WagmiSetup from "./WagmiSetup";

function NavigationProviders({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <TitleProvider>
      <HeaderProvider>
        <ScrollPositionProvider>
          <ViewProvider>
            <NavigationHistoryProvider>{children}</NavigationHistoryProvider>
          </ViewProvider>
        </ScrollPositionProvider>
      </HeaderProvider>
    </TitleProvider>
  );
}

function AppRuntimeProviders({
  children,
  enableVersionCheck,
  enableCookieConsent,
  enableMyStream,
}: {
  readonly children: React.ReactNode;
  readonly enableVersionCheck: boolean;
  readonly enableCookieConsent: boolean;
  readonly enableMyStream: boolean;
}) {
  return (
    <WaveEligibilityProvider>
      <NotificationsProvider>
        <CookieConsentProvider disabled={!enableCookieConsent}>
          <MixpanelSetup />
          <EULAConsentProvider>
            <AppWebSocketProvider>
              <LayoutProvider>
                {enableMyStream ? (
                  <MyStreamProvider>
                    {children}
                    <QuickDirectMessagesGate />
                  </MyStreamProvider>
                ) : (
                  children
                )}
              </LayoutProvider>
              {enableVersionCheck && <NewVersionToast />}
            </AppWebSocketProvider>
          </EULAConsentProvider>
        </CookieConsentProvider>
      </NotificationsProvider>
    </WaveEligibilityProvider>
  );
}

function WalletReadyProviders({
  children,
  enableWalletAuthentication,
}: {
  readonly children: React.ReactNode;
  readonly enableWalletAuthentication: boolean;
}) {
  return (
    <SeizeConnectProvider>
      <Auth enableWalletAuthentication={enableWalletAuthentication}>
        <AuthLaunchTimingReporter
          enableWalletAuthentication={enableWalletAuthentication}
        />
        {children}
      </Auth>
    </SeizeConnectProvider>
  );
}

function WalletStartupProviders({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <SeizeConnectStartupFallbackProvider>
      {children}
    </SeizeConnectStartupFallbackProvider>
  );
}

export default function Providers({
  children,
  enableVersionCheck = true,
  enableWalletAuthentication = true,
  enableCookieConsent = true,
  enableMyStream = true,
  settingsMode = SeizeSettingsMode.REMOTE,
}: {
  readonly children: React.ReactNode;
  readonly enableVersionCheck?: boolean;
  readonly enableWalletAuthentication?: boolean;
  readonly enableCookieConsent?: boolean;
  readonly enableMyStream?: boolean;
  readonly settingsMode?: SeizeSettingsMode;
}) {
  const appSurface = (
    <AppRuntimeProviders
      enableVersionCheck={enableVersionCheck}
      enableCookieConsent={enableCookieConsent}
      enableMyStream={enableMyStream}
    >
      <NavigationProviders>{children}</NavigationProviders>
    </AppRuntimeProviders>
  );

  const appProviders = (
    <QueryClientSetup>
      <CapacitorSetup />
      <IpfsImageSetup />
      <AppWalletsProvider>
        <ReactQueryWrapper>
          <RefreshProvider>
            <SeizeSettingsProvider mode={settingsMode}>
              <EmojiProvider>
                <IpfsProvider>
                  <WagmiSetup
                    fallback={
                      <WalletStartupProviders>
                        {appSurface}
                      </WalletStartupProviders>
                    }
                  >
                    <WalletReadyProviders
                      enableWalletAuthentication={enableWalletAuthentication}
                    >
                      {appSurface}
                    </WalletReadyProviders>
                  </WagmiSetup>
                </IpfsProvider>
              </EmojiProvider>
            </SeizeSettingsProvider>
          </RefreshProvider>
        </ReactQueryWrapper>
      </AppWalletsProvider>
    </QueryClientSetup>
  );

  return (
    <EditingDropProvider>
      <ActiveGroupProvider>{appProviders}</ActiveGroupProvider>
    </EditingDropProvider>
  );
}
