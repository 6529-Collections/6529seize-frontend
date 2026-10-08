export {};
declare global {
  interface Window {
    featureFixture: {
      showTabs: () => void;
      logout: () => void;
      switchProfile: (profileId: string) => boolean;
      resumeAnalytics: () => void;
      failIdentityOnce: () => void;
      failResetTwice: () => void;
      failSeenOnce: (value: string) => void;
      updateTraits: () => void;
      resetVisit: () => void;
      revoke: () => void;
      enable: () => void;
      remount: () => void;
      navigate: (path: string) => void;
      lateEvent: () => void;
      failSdk: () => void;
      seedPendingQueues: () => Promise<void>;
      holdQueueClears: () => void;
      pendingQueueClears: () => Array<"events" | "people" | "groups">;
      releaseQueueClear: (kind: "events" | "people" | "groups") => void;
      failQueueClearOnce: () => void;
    };
  }
}
