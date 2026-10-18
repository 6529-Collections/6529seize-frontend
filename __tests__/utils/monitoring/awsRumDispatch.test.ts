import { AWS_RUM_DISPATCH_CONFIG } from "@/utils/monitoring/awsRumDispatch";
import { AwsRum, type AwsRumConfig } from "aws-rum-web";

// Runs the installed aws-rum-web client (not a mock) with the app's dispatch
// settings, so an SDK upgrade that changes batching or the page-hide flush
// fails here. Only the transport is replaced.

type ClientBuilder = NonNullable<AwsRumConfig["clientBuilder"]>;
type DataPlaneClient = ReturnType<ClientBuilder>;
type PutRumEventsRequest = Parameters<DataPlaneClient["sendFetch"]>[0];

const SUCCESS = { response: { statusCode: 200 } };
const TEST_EVENT_TYPE = "com.6529.test_event";

const createTransport = () => {
  const sendFetch = jest.fn(async (_request: PutRumEventsRequest) => SUCCESS);
  const sendBeacon = jest.fn(async (_request: PutRumEventsRequest) => SUCCESS);
  const clientBuilder: ClientBuilder = () =>
    ({ sendFetch, sendBeacon }) as unknown as DataPlaneClient;
  return { clientBuilder, sendBeacon, sendFetch };
};

const testEventCount = (
  requests: ReadonlyArray<readonly [PutRumEventsRequest]>
): number =>
  requests
    .flatMap(([request]) => request.RumEvents)
    .filter((event) => event.type === TEST_EVENT_TYPE).length;

const setVisibility = (state: DocumentVisibilityState) => {
  jest.spyOn(document, "visibilityState", "get").mockReturnValue(state);
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("AWS RUM dispatch settings", () => {
  let awsRum: AwsRum | undefined;
  let transport: ReturnType<typeof createTransport>;

  const startRum = () => {
    awsRum = new AwsRum("test-app-monitor", "test-version", "us-east-1", {
      ...AWS_RUM_DISPATCH_CONFIG,
      allowCookies: false,
      disableAutoPageView: true,
      eventPluginsToLoad: [],
      telemetries: [],
      sessionSampleRate: 1,
      signing: false,
      clientBuilder: transport.clientBuilder,
    });
    awsRum.recordPageView("/test");
    return awsRum;
  };

  const recordTestEvents = (rum: AwsRum, count: number) => {
    for (let index = 0; index < count; index += 1) {
      rum.recordEvent(TEST_EVENT_TYPE, { index });
    }
  };

  beforeEach(() => {
    jest.useFakeTimers();
    transport = createTransport();
  });

  afterEach(() => {
    awsRum?.disable();
    awsRum = undefined;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("sends queued events at most once a minute", async () => {
    const rum = startRum();
    recordTestEvents(rum, 3);

    await jest.advanceTimersByTimeAsync(59_999);
    expect(transport.sendFetch).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(transport.sendFetch).toHaveBeenCalledTimes(1);
    expect(testEventCount(transport.sendFetch.mock.calls)).toBe(3);

    recordTestEvents(rum, 2);
    await jest.advanceTimersByTimeAsync(59_999);
    expect(transport.sendFetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(transport.sendFetch).toHaveBeenCalledTimes(2);
    expect(testEventCount(transport.sendFetch.mock.calls)).toBe(5);
  });

  it("sends nothing while the queue is empty", async () => {
    startRum();

    await jest.advanceTimersByTimeAsync(60_000);
    expect(transport.sendFetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(5 * 60_000);
    expect(transport.sendFetch).toHaveBeenCalledTimes(1);
  });

  it("caps each request at the batch limit and keeps the rest queued", async () => {
    const rum = startRum();
    recordTestEvents(rum, AWS_RUM_DISPATCH_CONFIG.batchLimit + 5);

    await jest.advanceTimersByTimeAsync(60_000);
    const [[firstRequest]] = transport.sendFetch.mock.calls as [
      [PutRumEventsRequest],
    ];
    expect(firstRequest.RumEvents).toHaveLength(
      AWS_RUM_DISPATCH_CONFIG.batchLimit
    );

    await jest.advanceTimersByTimeAsync(60_000);
    expect(testEventCount(transport.sendFetch.mock.calls)).toBe(
      AWS_RUM_DISPATCH_CONFIG.batchLimit + 5
    );
  });

  it("flushes queued events with a beacon when the page becomes hidden", async () => {
    const rum = startRum();
    recordTestEvents(rum, 4);
    await jest.advanceTimersByTimeAsync(10_000);

    setVisibility("hidden");
    await jest.advanceTimersByTimeAsync(0);

    expect(transport.sendBeacon).toHaveBeenCalledTimes(1);
    expect(testEventCount(transport.sendBeacon.mock.calls)).toBe(4);
    expect(transport.sendFetch).not.toHaveBeenCalled();
  });

  it("falls back to fetch when the browser refuses the beacon", async () => {
    transport.sendBeacon.mockRejectedValueOnce(new Error("beacon refused"));
    const rum = startRum();
    recordTestEvents(rum, 2);

    setVisibility("hidden");
    await jest.advanceTimersByTimeAsync(0);

    expect(transport.sendBeacon).toHaveBeenCalledTimes(1);
    expect(transport.sendFetch).toHaveBeenCalledTimes(1);
    expect(testEventCount(transport.sendFetch.mock.calls)).toBe(2);
  });

  it("does not flush when the page becomes visible again", async () => {
    const rum = startRum();
    recordTestEvents(rum, 2);

    setVisibility("visible");
    await jest.advanceTimersByTimeAsync(0);

    expect(transport.sendBeacon).not.toHaveBeenCalled();
    expect(transport.sendFetch).not.toHaveBeenCalled();
  });
});
