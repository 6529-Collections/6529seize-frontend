// @ts-nocheck
import React from "react";
import { mainnet } from 'wagmi/chains';

describe('createWeb3Modal', () => {
  const loadApp = (isCap:boolean) => {
    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('@web3modal/wagmi/react', () => ({ createWeb3Modal: jest.fn() }));
      jest.doMock('../../wagmiConfig/wagmiConfigWeb', () => ({ wagmiConfigWeb: jest.fn(() => 'web') }));
      jest.doMock('../../wagmiConfig/wagmiConfigCapacitor', () => ({ wagmiConfigCapacitor: jest.fn(() => 'cap') }));
      jest.doMock('../../store/store', () => ({ wrapper: { useWrappedStore: jest.fn(() => ({store:{}, props:{}})) } }));
      jest.doMock('../../components/nextGen/nextgen_contracts', () => ({ NEXTGEN_CHAIN_ID: mainnet.id }));
      jest.doMock('../../hooks/useManifoldClaim', () => ({ MANIFOLD_NETWORK: mainnet }));
      jest.doMock('../../constants', () => ({ CW_PROJECT_ID: '1', DELEGATION_CONTRACT: { chain_id: mainnet.id, contract:'0x0' }, SUBSCRIPTIONS_CHAIN: mainnet }));
      jest.doMock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => isCap } }));
      jest.doMock('../../hooks/useCapacitor', () => ({ __esModule:true, default: () => ({ isCapacitor: isCap }) }));
      jest.doMock('../../contexts/SeizeSettingsContext', () => ({ SeizeSettingsProvider: ({children}:any) => <>{children}</>, useSeizeSettings: () => ({}) }));
      jest.doMock('../../contexts/EmojiContext', () => ({ EmojiProvider: ({children}:any) => <>{children}</> }));
      jest.doMock('../../services/websocket/AppWebSocketProvider', () => ({ AppWebSocketProvider: ({children}:any) => <>{children}</> }));
      jest.doMock('../../components/layout/MainLayout', () => ({ __esModule:true, default: ({children}:any) => <>{children}</> }));
      jest.doMock('../../contexts/HeaderContext', () => ({ HeaderProvider: ({children}:any) => <>{children}</> }));
      jest.doMock('../../components/react-query-wrapper/ReactQueryWrapper', () => ({ __esModule:true, default: ({children}:any) => <>{children}</> }));
      jest.doMock('../../components/auth/Auth', () => ({ __esModule:true, default: ({children}:any) => <>{children}</> }));
      jest.doMock('../../components/auth/SeizeConnectContext', () => ({ SeizeConnectProvider: ({children}:any) => <>{children}</> }));
      jest.doMock('../../components/app-wallets/AppWalletsContext', () => ({ AppWalletsProvider: ({children}:any) => <>{children}</>, appWalletsEventEmitter: { on: jest.fn(), off: jest.fn() } }));
      jest.doMock('../../components/ipfs/IPFSContext', () => ({ IpfsProvider: ({children}:any) => <>{children}</>, resolveIpfsUrl: jest.fn(async (u)=>u) }));
      jest.doMock('../../components/cookies/CookieConsentContext', () => ({ CookieConsentProvider: ({children}:any) => <>{children}</> }));
      jest.doMock('../../components/eula/EULAConsentContext', () => ({ EULAConsentProvider: ({children}:any) => <>{children}</> }));
      jest.doMock('../../components/utils/NewVersionToast', () => ({ __esModule:true, default: () => null }));
      jest.doMock('../../components/notifications/NotificationsContext', () => ({ NotificationsProvider: ({children}:any) => <>{children}</> }));
      jest.doMock('next/dynamic', () => () => (comp:any)=> comp());
      jest.doMock('next/head', () => ({ __esModule:true, default: ({children}:any) => <>{children}</> }));
    });
    const mod = require('../../pages/_app');
    return require('@web3modal/wagmi/react').createWeb3Modal as jest.Mock;
  };

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('uses web config when not capacitor', () => {
    const mock = loadApp(false);
    expect(mock).toHaveBeenCalledWith({ wagmiConfig: 'web', projectId: '1', enableAnalytics: true, themeMode: 'dark' });
  });

  it('uses capacitor config when native platform', () => {
    const mock = loadApp(true);
    expect(mock).toHaveBeenCalledWith({ wagmiConfig: 'cap', projectId: '1', enableAnalytics: true, themeMode: 'dark' });
  });
});
