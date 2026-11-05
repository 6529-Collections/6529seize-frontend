import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { publicEnv } from "@/config/env";
import AwsRumProvider from "@/components/monitoring/AwsRumProvider";
import { AwsRum, FetchPlugin, XhrPlugin } from "aws-rum-web";

const WAVE_ID = `${"a".repeat(8)}-${"b".repeat(4)}-4${"c".repeat(3)}-a${"d".repeat(3)}-${"e".repeat(12)}`;
const OTHER_WAVE_ID = `${"f".repeat(8)}-${"1".repeat(4)}-4${"2".repeat(3)}-a${"3".repeat(3)}-${"4".repeat(12)}`;
const TEST_AUTHOR_ID = `${"1".repeat(8)}-${"2".repeat(4)}-4${"3".repeat(3)}-8${"4".repeat(3)}-${"5".repeat(12)}`;
const MEDIA_URL = `https://media.example.cloudfront.net/renditions/drops/author_${TEST_AUTHOR_ID}/file.m3u8`;
let mockPathname = `/waves/${WAVE_ID}`;

type MockPluginContext = {
  record: (eventType: string, eventData: object) => void;
  recordPageView: (pageId: string) => void;
};

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

jest.mock("aws-rum-web", () => {
  type MockPluginConfig = {
    readonly eventPluginsToLoad?: Array<{
      load?: (context: MockPluginContext) => void;
    }>;
  };
  const createPlugin = (
    pluginId: string
  ): new (config?: unknown) => {
    readonly config: unknown;
    getPluginId: () => string;
    load: (context: MockPluginContext) => void;
  } =>
    class {
      readonly config: unknown;

      constructor(config?: unknown) {
        this.config = config;
      }

      getPluginId(): string {
        return pluginId;
      }

      load(context: MockPluginContext): void {
        void context;
      }
    };

  const createHttpPlugin = (pluginId: string, config?: unknown) => {
    let loadedContext: MockPluginContext | undefined;

    return {
      config,
      disable: jest.fn(),
      enable: jest.fn(),
      getLoadedContext: () => {
        if (!loadedContext) {
          throw new Error(`Expected the ${pluginId} plugin to be loaded`);
        }
        return loadedContext;
      },
      getPluginId: () => pluginId,
      load: jest.fn((context: MockPluginContext) => {
        loadedContext = context;
      }),
    };
  };

  return {
    AwsRum: jest.fn(
      (
        _applicationId: string,
        _applicationVersion: string,
        _region: string,
        config: MockPluginConfig
      ) => {
        const instance = {
          disable: jest.fn(),
          recordEvent: jest.fn(),
          recordPageView: jest.fn(),
        };
        const pluginContext: MockPluginContext = {
          record: instance.recordEvent,
          recordPageView: instance.recordPageView,
        };
        config.eventPluginsToLoad?.forEach((plugin) => {
          plugin.load?.(pluginContext);
        });
        return instance;
      }
    ),
    FetchPlugin: jest.fn((config?: unknown) =>
      createHttpPlugin("fetch", config)
    ),
    JsErrorPlugin: createPlugin("js-error"),
    NavigationPlugin: createPlugin("navigation"),
    ResourcePlugin: createPlugin("resource"),
    WebVitalsPlugin: createPlugin("web-vitals"),
    XhrPlugin: jest.fn((config?: unknown) => createHttpPlugin("xhr", config)),
  };
});

const mockAwsRum = AwsRum as jest.Mock;
const mockFetchPlugin = FetchPlugin as unknown as jest.Mock;
const mockXhrPlugin = XhrPlugin as unknown as jest.Mock;
const originalPublicEnv = { ...publicEnv };

type AwsRumHttpPluginConfig = {
  readonly urlsToExclude: RegExp[];
};

type MockAwsRumInstance = {
  readonly disable: jest.Mock;
  readonly recordEvent: jest.Mock;
  readonly recordPageView: jest.Mock;
};

type MockHttpPlugin = {
  readonly getLoadedContext: () => MockPluginContext;
};

const AWS_RUM_SAMPLING_STORAGE_KEY = "6529:aws-rum-session-sampled";

const setAwsRumSessionCookie = (record: boolean): void => {
  document.cookie = `cwr_s=${btoa(
    JSON.stringify({ sessionId: "test-session", record, eventCount: 1 })
  )}; path=/`;
};

const clearAwsRumSessionCookie = (): void => {
  document.cookie = "cwr_s=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

describe("AwsRumProvider", () => {
  let warnSpy: jest.SpyInstance;
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    window.sessionStorage.clear();
    clearAwsRumSessionCookie();
    randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    Object.assign(publicEnv, originalPublicEnv, {
      NODE_ENV: "production",
      AWS_RUM_APP_ID: "test-app-id",
      AWS_RUM_REGION: "eu-west-1",
      AWS_RUM_SAMPLE_RATE: "0.5",
      VERSION: "test-version",
    });
    mockPathname = `/waves/${WAVE_ID}`;
    mockAwsRum.mockClear();
    mockFetchPlugin.mockClear();
    mockXhrPlugin.mockClear();
    delete window.awsRum;
    warnSpy = jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
    randomSpy.mockRestore();
    window.sessionStorage.clear();
    clearAwsRumSessionCookie();
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
        // The provider sampled the session before importing the SDK.
        sessionSampleRate: 1,
        releaseId: "test-version",
        disableAutoPageView: true,
        telemetries: [],
        // Queued events go out at most once a minute; a hidden page flushes
        // one batch with a beacon.
        dispatchInterval: 60_000,
        batchLimit: 50,
        useBeacon: true,
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
    expect(getMockAwsRumInstance().recordPageView).toHaveBeenCalledTimes(1);
    expect(
      JSON.stringify(getMockAwsRumInstance().recordPageView.mock.calls)
    ).not.toContain("private-profile-handle");
  });

  it.each([
    { pluginName: "Fetch", pluginConstructor: mockFetchPlugin },
    { pluginName: "XHR", pluginConstructor: mockXhrPlugin },
  ])(
    "filters exact $pluginName aborts before retained HTTP events reach the privacy boundary",
    async ({ pluginConstructor }) => {
      render(
        <AwsRumProvider>
          <div>Child content</div>
        </AwsRumProvider>
      );

      await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));

      const record = getMockAwsRumInstance().recordEvent;
      const context = getMockHttpPlugin(pluginConstructor).getLoadedContext();
      const retainedEvent = {
        request: { method: "GET", url: MEDIA_URL },
        error: { type: "TypeError", message: "Failed to fetch" },
      };

      context.record("com.amazon.rum.http_event", retainedEvent);

      expect(record).toHaveBeenCalledWith(
        "com.amazon.rum.http_event",
        expect.objectContaining({
          request: expect.objectContaining({
            url: expect.stringContaining("/author_id/"),
          }),
        })
      );
      expect(JSON.stringify(record.mock.calls)).not.toContain(TEST_AUTHOR_ID);

      const recordedEventCount = record.mock.calls.length;
      context.record("com.amazon.rum.http_event", {
        request: { method: "GET", url: MEDIA_URL },
        error: { type: "AbortError", message: "The operation was aborted" },
      });

      expect(record).toHaveBeenCalledTimes(recordedEventCount);
    }
  );

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

  it("does not download or start AWS RUM for an unsampled session", async () => {
    randomSpy.mockReturnValue(0.5);

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() =>
      expect(window.sessionStorage.getItem(AWS_RUM_SAMPLING_STORAGE_KEY)).toBe(
        "0"
      )
    );
    expect(mockAwsRum).not.toHaveBeenCalled();
    expect(mockFetchPlugin).not.toHaveBeenCalled();
    expect(window.awsRum).toBeUndefined();
  });

  it("keeps a tab's stored sampling decision across reloads", async () => {
    window.sessionStorage.setItem(AWS_RUM_SAMPLING_STORAGE_KEY, "0");

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(randomSpy).not.toHaveBeenCalled();
    expect(mockAwsRum).not.toHaveBeenCalled();
  });

  it("joins a recorded AWS RUM session that another tab started", async () => {
    window.sessionStorage.setItem(AWS_RUM_SAMPLING_STORAGE_KEY, "0");
    setAwsRumSessionCookie(true);

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));
    expect(randomSpy).not.toHaveBeenCalled();
  });

  it("stays out of an AWS RUM session the SDK did not sample", async () => {
    setAwsRumSessionCookie(false);

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(randomSpy).not.toHaveBeenCalled();
    expect(mockAwsRum).not.toHaveBeenCalled();
  });

  it("uses default AWS RUM values when optional env values are empty strings", async () => {
    publicEnv.AWS_RUM_REGION = "";
    publicEnv.AWS_RUM_SAMPLE_RATE = "";
    publicEnv.VERSION = "";
    // Just under the 0.2 default sample rate.
    randomSpy.mockReturnValue(0.19);

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
        sessionSampleRate: 1,
        releaseId: "1.0.0",
      })
    );
  });

  it("uses the default AWS RUM sample rate when the env value is invalid", async () => {
    publicEnv.AWS_RUM_SAMPLE_RATE = "not-a-number";
    // Just over the 0.2 default sample rate.
    randomSpy.mockReturnValue(0.21);

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    await waitFor(() =>
      expect(window.sessionStorage.getItem(AWS_RUM_SAMPLING_STORAGE_KEY)).toBe(
        "0"
      )
    );
    expect(mockAwsRum).not.toHaveBeenCalled();
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
  const xhrConfig = mockXhrPlugin.mock.calls[0]?.[0] as
    | AwsRumHttpPluginConfig
    | undefined;
  const fetchConfig = mockFetchPlugin.mock.calls[0]?.[0] as
    | AwsRumHttpPluginConfig
    | undefined;

  expect(xhrConfig).toBeDefined();
  expect(fetchConfig?.urlsToExclude).toEqual(xhrConfig?.urlsToExclude);

  return xhrConfig?.urlsToExclude ?? [];
};

const getMockHttpPlugin = (pluginConstructor: jest.Mock): MockHttpPlugin => {
  const plugin = pluginConstructor.mock.results[0]?.value as
    | MockHttpPlugin
    | undefined;

  if (!plugin) {
    throw new Error("AWS RUM HTTP plugin was not initialized");
  }

  return plugin;
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
