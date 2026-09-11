import type { Plugin, PluginContext } from "aws-rum-web";

const AWS_RUM_HTTP_EVENT_TYPE = "com.amazon.rum.http_event";
// These exact strings come from the pinned SDK/browser cancellation shapes.
// Near matches intentionally fail open so new failure forms stay observable.
const EXPECTED_ABORT_MESSAGES = new Set([
  "signal is aborted without reason",
  "Fetch is aborted",
]);

type AwsRumHttpEvent = {
  readonly error?: unknown;
};

type AwsRumHttpError = {
  readonly type?: unknown;
  readonly message?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExpectedAbortHttpEvent(
  eventType: string,
  eventData: object
): boolean {
  if (eventType !== AWS_RUM_HTTP_EVENT_TYPE) {
    return false;
  }

  const { error } = eventData as AwsRumHttpEvent;
  if (!isRecord(error)) {
    return false;
  }

  const { type, message } = error as AwsRumHttpError;
  if (type === "AbortError") {
    return true;
  }

  return typeof message === "string" && EXPECTED_ABORT_MESSAGES.has(message);
}

function createExpectedAbortFilter(
  record: PluginContext["record"]
): PluginContext["record"] {
  return (eventType, eventData) => {
    let shouldDrop = false;

    try {
      shouldDrop = isExpectedAbortHttpEvent(eventType, eventData);
    } catch {
      // Preserve the event when classification fails.
    }

    if (shouldDrop) {
      return;
    }

    try {
      record(eventType, eventData);
    } catch {
      // Monitoring must not change the outcome of an application request.
    }
  };
}

export class AwsRumExpectedAbortPlugin<
  UpdateType = unknown,
> implements Plugin<UpdateType> {
  constructor(private readonly delegate: Plugin<UpdateType>) {}

  public load(context: PluginContext): void {
    this.delegate.load({
      ...context,
      record: createExpectedAbortFilter(context.record),
    });
  }

  public enable(): void {
    this.delegate.enable();
  }

  public disable(): void {
    this.delegate.disable();
  }

  public getPluginId(): string {
    return this.delegate.getPluginId();
  }

  public record(data: unknown): void {
    this.delegate.record?.(data);
  }

  public update(updateWith: UpdateType): void {
    this.delegate.update?.(updateWith);
  }
}
