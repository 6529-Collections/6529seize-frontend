import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { publicEnv } from "@/config/env";
import AwsRumProvider from "@/components/monitoring/AwsRumProvider";
import { AwsRum } from "aws-rum-web";

const WAVE_ID = `${"a".repeat(8)}-${"b".repeat(4)}-4${"c".repeat(3)}-a${"d".repeat(3)}-${"e".repeat(12)}`;
const OTHER_WAVE_ID = `${"f".repeat(8)}-${"1".repeat(4)}-4${"2".repeat(3)}-a${"3".repeat(3)}-${"4".repeat(12)}`;
let mockPathname = `/waves/${WAVE_ID}`;

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

jest.mock("aws-rum-web", () => {
  const createPlugin = (
    pluginId: string
  ): new (config?: unknown) => {
    readonly config: unknown;
    getPluginId: () => string;
  } =>
    class {
      readonly config: unknown;

      constructor(config?: unknown) {
        this.config = config;
      }

      getPluginId(): string {
        return pluginId;
      }
    };

  return {
    AwsRum: jest.fn(() => ({
      disable: jest.fn(),
      recordEvent: jest.fn(),
      recordPageView: jest.fn(),
    })),
    FetchPlugin: createPlugin("fetch"),
    JsErrorPlugin: createPlugin("js-error"),
    NavigationPlugin: createPlugin("navigation"),
    ResourcePlugin: createPlugin("resource"),
    WebVitalsPlugin: createPlugin("web-vitals"),
    XhrPlugin: createPlugin("xhr"),
  };
});

const mockAwsRum = AwsRum as jest.Mock;
const originalPublicEnv = { ...publicEnv };

type AwsRumHttpPluginConfig = {
  readonly urlsToExclude: RegExp[];
};

type MockAwsRumInstance = {
  readonly disable: jest.Mock;
  readonly recordEvent: jest.Mock;
  readonly recordPageView: jest.Mock;
};

describe("AwsRumProvider", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    Object.assign(publicEnv, originalPublicEnv, {
      NODE_ENV: "production",
      AWS_RUM_APP_ID: "test-app-id",
      AWS_RUM_REGION: "eu-west-1",
      AWS_RUM_SAMPLE_RATE: "0.5",
      VERSION: "test-version",
    });
    mockPathname = `/waves/${WAVE_ID}`;
    mockAwsRum.mockClear();
    delete window.awsRum;
    warnSpy = jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
    Object.assign(publicEnv, originalPublicEnv);
  });

  it("initializes AWS RUM after the provider hydrates", async () => {
    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();

    await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));

    expect(mockAwsRum).toHaveBeenCalledWith(
      "test-app-id",
      "test-version",
      "eu-west-1",
      expect.objectContaining({
        sessionSampleRate: 0.5,
        releaseId: "test-version",
        disableAutoPageView: true,
        telemetries: [],
      })
    );
    expect(
      getAwsRumConfig().eventPluginsToLoad?.map((plugin) =>
        plugin.getPluginId()
      )
    ).toEqual([
      "6529-aws-rum-privacy",
      "navigation",
      "resource",
      "web-vitals",
      "js-error",
      "xhr",
      "fetch",
    ]);
    expect(window.awsRum).toBe(mockAwsRum.mock.results[0]?.value);
    expect(getMockAwsRumInstance().recordPageView).toHaveBeenCalledWith(
      "/waves/[wave]"
    );
  });

  it("records client navigations once per normalized page family", async () => {
    const { rerender } = render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));
    const awsRumInstance = getMockAwsRumInstance();
    await waitFor(() =>
      expect(awsRumInstance.recordPageView).toHaveBeenCalledTimes(1)
    );

    mockPathname = `/waves/${OTHER_WAVE_ID}`;
    rerender(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    expect(awsRumInstance.recordPageView).toHaveBeenCalledTimes(1);

    mockPathname = "/notifications";
    rerender(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() =>
      expect(awsRumInstance.recordPageView).toHaveBeenCalledTimes(2)
    );
    expect(awsRumInstance.recordPageView.mock.calls).toEqual([
      ["/waves/[wave]"],
      ["/notifications"],
    ]);

    const payload = JSON.stringify(awsRumInstance.recordPageView.mock.calls);
    expect(payload).not.toContain(WAVE_ID);
    expect(payload).not.toContain(OTHER_WAVE_ID);
  });

  it("normalizes a root profile before automatic telemetry plugins load", async () => {
    mockPathname = "/private-profile-handle";

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));

    expect(getAwsRumConfig().eventPluginsToLoad?.[0]?.getPluginId()).toBe(
      "6529-aws-rum-privacy"
    );
    expect(getMockAwsRumInstance().recordPageView).toHaveBeenCalledWith(
      "/[user]"
    );
    expect(
      JSON.stringify(getMockAwsRumInstance().recordPageView.mock.calls)
    ).not.toContain("private-profile-handle");
  });

  it("excludes third-party analytics noise without excluding app-owned APIs", async () => {
    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));

    const urlsToExclude = getHttpUrlsToExclude();
    const isExcluded = (url: string): boolean =>
      urlsToExclude.some((urlPattern) => urlPattern.test(url));

    expect(isExcluded("https://www.google-analytics.com/g/collect?v=2")).toBe(
      true
    );
    expect(
      isExcluded("https://region7.google-analytics.com/g/collect?v=2")
    ).toBe(true);
    expect(isExcluded("https://analytics.google.com/g/collect?v=2")).toBe(true);
    expect(isExcluded("https://www.google.com/g/collect?v=2")).toBe(true);
    expect(isExcluded("https://cca-lite.coinbase.com/amp?event=load")).toBe(
      true
    );
    expect(isExcluded("https://cca-lite.coinbase.com/metrics?event=load")).toBe(
      true
    );
    expect(isExcluded("https://api-js.mixpanel.com/track/?ip=1")).toBe(true);
    expect(isExcluded("https://api-js.mixpanel.com/engage/?verbose=1")).toBe(
      true
    );
    expect(
      isExcluded("https://rpc.walletconnect.org/v1/?chainId=eip155:1")
    ).toBe(true);
    expect(
      isExcluded("https://rpc.walletconnect.com/v1/?chainId=eip155:1")
    ).toBe(true);
    expect(isExcluded("https://rpc.walletconnect.com/v1/sessions/abc")).toBe(
      true
    );
    expect(
      isExcluded("https://identity.walletconnect.org/v1/profile?projectId=test")
    ).toBe(true);
    expect(isExcluded("https://sts.amazonaws.com/")).toBe(true);
    expect(
      isExcluded("https://cognito-identity.us-east-1.amazonaws.com/")
    ).toBe(true);
    expect(
      isExcluded("https://dataplane.rum.us-east-1.amazonaws.com/appmonitors")
    ).toBe(true);

    expect(isExcluded("https://api.6529.io/api/auth/session-refresh")).toBe(
      false
    );
    expect(
      isExcluded("https://api.6529.io/api/v2/waves/123/drops?limit=50")
    ).toBe(false);
    expect(isExcluded("https://api.6529.io/api/v2/waves")).toBe(false);
    expect(isExcluded("https://api.6529.io/api/v2/notifications")).toBe(false);
    expect(
      isExcluded("https://api.6529.io/api/dm-drops/unread?identity=simo")
    ).toBe(false);
    expect(isExcluded("https://api-js.mixpanel.com/groups/?verbose=1")).toBe(
      false
    );
    expect(isExcluded("https://identity.walletconnect.org/v1beta")).toBe(false);
    expect(isExcluded("https://relay.walletconnect.com/v2/")).toBe(false);
  });

  it("skips AWS RUM initialization in development", async () => {
    publicEnv.NODE_ENV = "development";

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "AWS RUM: Skipped initialization in development mode"
      );
    });
    expect(mockAwsRum).not.toHaveBeenCalled();
  });

  it("skips AWS RUM initialization when the application id is missing", async () => {
    publicEnv.AWS_RUM_APP_ID = "";

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "AWS RUM: Skipped initialization - missing required environment variables"
      );
    });
    expect(mockAwsRum).not.toHaveBeenCalled();
  });

  it("uses default AWS RUM values when optional env values are empty strings", async () => {
    publicEnv.AWS_RUM_REGION = "";
    publicEnv.AWS_RUM_SAMPLE_RATE = "";
    publicEnv.VERSION = "";

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));

    expect(mockAwsRum).toHaveBeenCalledWith(
      "test-app-id",
      "1.0.0",
      "us-east-1",
      expect.objectContaining({
        sessionSampleRate: 0.2,
        releaseId: "1.0.0",
      })
    );
  });

  it("uses the default AWS RUM sample rate when the env value is invalid", async () => {
    publicEnv.AWS_RUM_SAMPLE_RATE = "not-a-number";

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));

    expect(mockAwsRum).toHaveBeenCalledWith(
      "test-app-id",
      "test-version",
      "eu-west-1",
      expect.objectContaining({
        sessionSampleRate: 0.2,
      })
    );
  });

  it("does not initialize AWS RUM after unmounting before the import resolves", async () => {
    const { unmount } = render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    unmount();

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mockAwsRum).not.toHaveBeenCalled();
    expect(window.awsRum).toBeUndefined();
  });

  it("disables AWS RUM and clears the global instance on unmount", async () => {
    const { unmount } = render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));

    const awsRumInstance = getMockAwsRumInstance();

    unmount();

    expect(awsRumInstance.disable).toHaveBeenCalledTimes(1);
    expect(window.awsRum).toBeUndefined();
  });
});

const getHttpUrlsToExclude = (): RegExp[] => {
  const plugins = getAwsRumConfig().eventPluginsToLoad ?? [];
  const xhrConfig = plugins.find((plugin) => plugin.getPluginId() === "xhr")
    ?.config as AwsRumHttpPluginConfig | undefined;
  const fetchConfig = plugins.find((plugin) => plugin.getPluginId() === "fetch")
    ?.config as AwsRumHttpPluginConfig | undefined;

  expect(xhrConfig).toBeDefined();
  expect(fetchConfig?.urlsToExclude).toEqual(xhrConfig?.urlsToExclude);

  return xhrConfig?.urlsToExclude ?? [];
};

const getAwsRumConfig = (): {
  readonly eventPluginsToLoad?: Array<{
    readonly config?: unknown;
    getPluginId: () => string;
  }>;
} => {
  const config = mockAwsRum.mock.calls[0]?.[3] as
    | {
        readonly eventPluginsToLoad?: Array<{
          readonly config?: unknown;
          getPluginId: () => string;
        }>;
      }
    | undefined;

  if (!config) {
    throw new Error("AWS RUM config was not provided");
  }

  return config;
};

const getMockAwsRumInstance = (): MockAwsRumInstance => {
  const instance = mockAwsRum.mock.results[0]?.value as
    | MockAwsRumInstance
    | undefined;

  if (!instance) {
    throw new Error("AWS RUM mock was not initialized");
  }

  return instance;
};
