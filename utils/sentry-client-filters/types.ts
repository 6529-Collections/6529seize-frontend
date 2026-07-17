export type SentryStackFrame = {
  filename?: string | undefined;
  abs_path?: string | undefined;
  function?: string | undefined;
  in_app?: boolean | undefined;
  lineno?: number | undefined;
  colno?: number | undefined;
  context_line?: string | undefined;
};

export type SentryTransactionSpan = {
  op?: string | undefined;
  description?: string | undefined;
  data?: Record<string, unknown> | undefined;
};

export type SentryContext = Record<string, unknown>;

export type SentryBreadcrumb = {
  timestamp?: number | undefined;
  type?: string | undefined;
  category?: string | undefined;
  level?: string | undefined;
  message?: string | undefined;
  data?: Record<string, unknown> | undefined;
};

export type NetworkTargetCandidate = {
  url: string;
  isFirstParty?: boolean | undefined;
  isFirstPartyApi?: boolean | undefined;
  isPlaceholder?: boolean | undefined;
};

export type NetworkBreadcrumbFailureKind = "transport" | "http";

export type FailedBreadcrumbScanResult =
  | { action: "continue" }
  | { action: "return"; target: NetworkTargetCandidate | null };

export type SentryExceptionValue = {
  type?: string | undefined;
  value?: string | undefined;
  mechanism?:
    | {
        type?: string | undefined;
        handled?: boolean | undefined;
      }
    | undefined;
  stacktrace?:
    | {
        frames?: SentryStackFrame[] | undefined;
      }
    | undefined;
};

export type SentryTags = Record<string, unknown>;

export type SentryClientEvent = {
  event_id?: string | undefined;
  timestamp?: number | undefined;
  transaction?: string | undefined;
  message?: string | undefined;
  exception?:
    | {
        values?: SentryExceptionValue[] | undefined;
      }
    | undefined;
  contexts?: Record<string, SentryContext | undefined> | undefined;
  extra?: Record<string, unknown> | undefined;
  request?:
    | {
        url?: string | undefined;
        headers?: Record<string, unknown> | undefined;
      }
    | undefined;
  tags?: SentryTags | undefined;
  breadcrumbs?:
    | SentryBreadcrumb[]
    | {
        values?: SentryBreadcrumb[] | undefined;
      }
    | undefined;
};

export type SentryEventHint = {
  originalException?: unknown;
  syntheticException?: unknown;
};

export type LowValueNetworkErrorDecision =
  | "not_applicable"
  | "drop"
  | "keep_sampled";
