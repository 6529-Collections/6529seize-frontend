// This must run synchronously while the document head is parsed. next/script's
// beforeInteractive queue still depends on the Next runtime being downloaded.
// Match Capacitor's bridge detection before its JS package is available; never
// infer native mode from a mobile user agent or a persisted cookie.
export const NATIVE_STARTUP_SCRIPT = `(() => {
  try {
    const runtime = globalThis;
    let platform = runtime.Capacitor?.getPlatform?.() ?? runtime.CapacitorCustomPlatform?.name;
    if (!platform) {
      if (runtime.androidBridge) platform = "android";
      else if (runtime.webkit?.messageHandlers?.bridge) platform = "ios";
    }
    if (platform === "ios" || platform === "android") {
      document.documentElement.setAttribute("data-native-runtime", platform);
    }
  } catch {
    // Detection failure must not hide ordinary web content.
  }
})();`;

// Critical, native-only presentation: keep the server content mounted for
// hydration, but do not expose its desktop layout visually or to focus/AT.
// Inline styles make this independent of application JS and stylesheet timing.
export const NATIVE_STARTUP_STYLES = `
[data-native-startup], [data-native-startup-content] { display: contents; }
[data-native-startup-placeholder] { display: none; }
:root[data-native-runtime] [data-native-startup="pending"] > [data-native-startup-content] { display: none; }
:root[data-native-runtime] [data-native-startup="pending"] > [data-native-startup-placeholder] {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 100svh;
  padding: env(safe-area-inset-top, 0px) 16px env(safe-area-inset-bottom, 0px);
  background: #000;
}
[data-native-startup-placeholder] > header { height: 70px; flex-shrink: 0; }
[data-native-startup-placeholder] > div { flex: 1; }
[data-native-startup-placeholder] > footer {
  height: 104px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
[data-native-startup-placeholder] > footer > div {
  height: 64px;
  width: 100%;
  border: 1px solid #26272b;
  border-radius: 9999px;
  box-sizing: border-box;
}
`;
