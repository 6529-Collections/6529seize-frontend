"use client";

// Keep the whole provider tree behind this one client boundary. Each Client
// Component a Server Component renders becomes its own client reference in the
// RSC payload, and each reference repeats the root layout's full chunk list in
// the inline flight data of every HTML page.
import { usePathname } from "next/navigation";

import { WaveInformationProvider } from "@/contexts/WaveInformationContext";
import { ShellSearchParamsProvider } from "@/contexts/ShellSearchParamsContext";
import { VersionStatusProvider } from "@/contexts/VersionStatusContext";
import { AppWalletsProvider } from "@/components/app-wallets/AppWalletsContext";
import Auth from "@/components/auth/Auth";
import DesktopProfileStorageGate from "@/components/desktop/DesktopProfileStorageGate";
import AuthLaunchTimingReporter from "@/components/auth/AuthLaunchTimingReporter";
import MarketActivityTracker from "@/components/collect/MarketActivityTracker";
import DeviceSetupHost from "@/components/device-signing/DeviceSetupHost";
import SignedWriteDecisionHost from "@/components/device-signing/SignedWriteDecisionHost";
import { SeizeConnectProvider } from "@/components/auth/SeizeConnectContext";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import E2eeProvider from "@/components/e2ee/E2eeProvider";
import QuickDirectMessagesGate from "@/components/messages/quick-dms/QuickDirectMessagesGate";
import { NotificationsProvider } from "@/components/notifications/NotificationsContext";
import ReactQueryWrapper from "@/components/react-query-wrapper/ReactQueryWrapper";
import NewVersionToast from "@/components/utils/NewVersionToast";
import DesktopUpdateNotice from "@/components/desktop/DesktopUpdateNotice";
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
import { isValidatorAuthorizePath } from "@/lib/validator-page/authorize/paths";
import { SeizeSettingsMode } from "@/types/enums";
import { LayoutProvider } from "../brain/my-stream/layout/LayoutContext";
import { ViewProvider } from "../navigation/ViewContext";
import CapacitorSetup from "./CapacitorSetup";
import EULAConsentStartup from "./EULAConsentStartup";
import IpfsImageSetup from "./IpfsImageSetup";
import LocaleMessagesGate from "./LocaleMessagesGate";
import AwsRumProvider from "@/components/monitoring/AwsRumProvider";
import MixpanelSetup from "./MixpanelSetup";
import QueryClientSetup from "./QueryClientSetup";
import WagmiSetup from "./WagmiSetup";
import DocumentLanguage from "./DocumentLanguage";
import AndroidBackNavigation from "@/components/navigation/AndroidBackNavigation";
import DesktopNavigationBridge from "@/components/desktop/DesktopNavigationBridge";
import DesktopNotificationsBridge from "@/components/desktop/DesktopNotificationsBridge";

export default function Providers({
  children,
  enableVersionCheck = true,
  enableWalletAuthentication: walletAuthenticationProp = true,
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
  // A phone authorizing a validator connects a wallet only to sign the
  // validator's grant; it doesn't sign in to 6529.io.
  const pathname = usePathname();
  const enableWalletAuthentication =
    walletAuthenticationProp && !isValidatorAuthorizePath(pathname);

  const sharedProviders = (
    <TitleProvider>
      <HeaderProvider>
        <ScrollPositionProvider>
          <ViewProvider>
            <WaveInformationProvider>
              <NavigationHistoryProvider>
                <AndroidBackNavigation />
                <DesktopNavigationBridge />
                <DesktopNotificationsBridge />
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
                    <SeizeConnectProvider>
                      <Auth
                        enableWalletAuthentication={enableWalletAuthentication}
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
                              <AwsRumProvider />
                              <AppWebSocketProvider>
                                {/* Encrypted chats (D109): inert unless the flag is on. */}
                                <E2eeProvider>
                                  {enableWalletAuthentication && (
                                    <DeviceSetupHost />
                                  )}
                                  <LayoutProvider>
                                    <ShellSearchParamsProvider>
                                      {enableMyStream ? (
                                        <MyStreamProvider>
                                          {sharedProviders}
                                          <QuickDirectMessagesGate />
                                        </MyStreamProvider>
                                      ) : (
                                        sharedProviders
                                      )}
                                    </ShellSearchParamsProvider>
                                  </LayoutProvider>
                                </E2eeProvider>
                                {enableVersionCheck && <NewVersionToast />}
                                {enableVersionCheck && <DesktopUpdateNotice />}
                              </AppWebSocketProvider>
                            </CookieConsentProvider>
                          </NotificationsProvider>
                        </WaveEligibilityProvider>
                      </Auth>
                    </SeizeConnectProvider>
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
      <EULAConsentStartup>
        <EditingDropProvider>
          <ActiveGroupProvider>
            {/* Inert on the web. Inside 6529 Desktop it restores and saves
                the signed-in profiles kept by the shell. */}
            <DesktopProfileStorageGate enabled={enableWalletAuthentication}>
              {appProviders}
            </DesktopProfileStorageGate>
          </ActiveGroupProvider>
        </EditingDropProvider>
      </EULAConsentStartup>
    </>
  );
}
