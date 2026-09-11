import { AwsRumExpectedAbortPlugin } from "@/utils/monitoring/awsRumExpectedAbort";
import type { Plugin, PluginContext } from "aws-rum-web";

const HTTP_EVENT_TYPE = "com.amazon.rum.http_event";
const RESOURCE_EVENT_TYPE = "com.amazon.rum.performance_resource_event";

type PluginHarness = {
  readonly delegateDisable: jest.Mock;
  readonly delegateEnable: jest.Mock;
  readonly delegateLoad: jest.Mock;
  readonly delegateRecord: jest.Mock;
  readonly delegateUpdate: jest.Mock;
  readonly filteredContext: () => PluginContext;
  readonly plugin: AwsRumExpectedAbortPlugin<string>;
  readonly record: jest.Mock;
};

function createPluginHarness(record: jest.Mock = jest.fn()): PluginHarness {
  const delegateLoad = jest.fn();
  const delegateEnable = jest.fn();
  const delegateDisable = jest.fn();
  const delegateRecord = jest.fn();
  const delegateUpdate = jest.fn();
  const delegate: Plugin<string> = {
    load: delegateLoad,
    enable: delegateEnable,
    disable: delegateDisable,
    getPluginId: () => "fetch",
    record: delegateRecord,
    update: delegateUpdate,
  };
  const plugin = new AwsRumExpectedAbortPlugin(delegate);

  plugin.load({ record } as unknown as PluginContext);

  return {
    delegateDisable,
    delegateEnable,
    delegateLoad,
    delegateRecord,
    delegateUpdate,
    filteredContext: () => {
      const context = delegateLoad.mock.calls[0]?.[0] as
        | PluginContext
        | undefined;
      if (!context) {
        throw new Error("Expected the delegate plugin to be loaded");
      }
      return context;
    },
    plugin,
    record,
  };
}

describe("AwsRumExpectedAbortPlugin", () => {
  it.each([
    { type: "AbortError", message: "The operation was aborted" },
    { type: "TypeError", message: "signal is aborted without reason" },
    { type: "TypeError", message: "Fetch is aborted" },
  ])("drops an exact expected HTTP cancellation %#", (error) => {
    const harness = createPluginHarness();

    harness.filteredContext().record(HTTP_EVENT_TYPE, { error });

    expect(harness.record).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "successful response",
      eventData: { response: { status: 200 } },
    },
    {
      name: "HTTP client error",
      eventData: { response: { status: 404 } },
    },
    {
      name: "HTTP server error",
      eventData: { response: { status: 503 } },
    },
    {
      name: "timeout",
      eventData: {
        error: { type: "String", message: "XMLHttpRequest timeout" },
      },
    },
    {
      name: "unverified XHR abort shape",
      eventData: {
        error: { type: "String", message: "XMLHttpRequest abort" },
      },
    },
    {
      name: "generic network failure",
      eventData: {
        error: { type: "TypeError", message: "Failed to fetch" },
      },
    },
    {
      name: "near-match cancellation message",
      eventData: {
        error: { type: "TypeError", message: "Fetch is aborted by timeout" },
      },
    },
  ])("preserves a $name", ({ eventData }) => {
    const harness = createPluginHarness();

    harness.filteredContext().record(HTTP_EVENT_TYPE, eventData);

    expect(harness.record).toHaveBeenCalledWith(HTTP_EVENT_TYPE, eventData);
  });

  it("preserves non-HTTP telemetry even when it contains an abort error", () => {
    const harness = createPluginHarness();
    const eventData = {
      error: { type: "AbortError", message: "The operation was aborted" },
    };

    harness.filteredContext().record(RESOURCE_EVENT_TYPE, eventData);

    expect(harness.record).toHaveBeenCalledWith(RESOURCE_EVENT_TYPE, eventData);
  });

  it("fails open when classification throws and stays non-blocking when recording throws", () => {
    const classificationFailure = new Proxy(
      {},
      {
        get: () => {
          throw new Error("classification failed");
        },
      }
    );
    const record = jest
      .fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error("recording failed");
      });
    const harness = createPluginHarness(record);

    expect(() =>
      harness.filteredContext().record(HTTP_EVENT_TYPE, classificationFailure)
    ).not.toThrow();
    expect(record).toHaveBeenCalledTimes(1);
    expect(record.mock.calls[0]?.[0]).toBe(HTTP_EVENT_TYPE);
    expect(record.mock.calls[0]?.[1]).toBe(classificationFailure);
    expect(() =>
      harness.filteredContext().record(HTTP_EVENT_TYPE, {
        error: { type: "TypeError", message: "Failed to fetch" },
      })
    ).not.toThrow();
    expect(record).toHaveBeenCalledTimes(2);
  });

  it("delegates the official plugin lifecycle and manual methods", () => {
    const harness = createPluginHarness();
    const manualEvent = { request: { method: "GET" } };

    harness.plugin.enable();
    harness.plugin.disable();
    harness.plugin.record(manualEvent);
    harness.plugin.update("next-config");

    expect(harness.plugin.getPluginId()).toBe("fetch");
    expect(harness.delegateLoad).toHaveBeenCalledTimes(1);
    expect(harness.delegateEnable).toHaveBeenCalledTimes(1);
    expect(harness.delegateDisable).toHaveBeenCalledTimes(1);
    expect(harness.delegateRecord).toHaveBeenCalledWith(manualEvent);
    expect(harness.delegateUpdate).toHaveBeenCalledWith("next-config");
  });
});
