export {};
declare global {
  interface Window {
    featureFixture: {
      resetVisit: () => void;
      revoke: () => void;
      enable: () => void;
      remount: () => void;
      navigate: (path: string) => void;
      lateEvent: () => void;
      failSdk: () => void;
    };
  }
}
