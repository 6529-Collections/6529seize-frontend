export {};
declare global {
  interface Window {
    featureFixture: {
      logout: () => void;
      switchProfile: (profileId: string) => boolean;
      resumeAnalytics: () => void;
      failIdentityOnce: () => void;
      failSeenOnce: (value: string) => void;
      updateTraits: () => void;
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
