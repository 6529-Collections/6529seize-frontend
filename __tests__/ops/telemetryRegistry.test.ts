const mockSentryLogger = {
  info: jest.fn(),
  warn: jest.fn(),
};

jest.mock("@sentry/nextjs", () => ({
  SPAN_STATUS_ERROR: 2,
  logger: {
    info: (...args: unknown[]) => mockSentryLogger.info(...args),
    warn: (...args: unknown[]) => mockSentryLogger.warn(...args),
  },
  startInactiveSpan: jest.fn(),
  startSpanManual: jest.fn(),
}));
jest.mock("mixpanel-browser", () => ({
  __esModule: true,
  default: {},
}));

import registry from "@/ops/telemetry/registry.json";
import { ART_BLOCKS_SIGNAL_NAMES } from "@/components/waves/ArtBlocksTokenCard";
import {
  AUTH_IMPACT_EVENT_NAMES,
  PAGE_VIEW_EVENT_NAME,
} from "@/services/analytics/mixpanel";
import { PRODUCT_IMPACT_EVENT_NAMES } from "@/services/analytics/productImpactTelemetry";
import { SESSION_REFRESH_SIGNAL_NAME } from "@/services/auth/session-refresh-telemetry.utils";
import { DROP_OPEN_SIGNAL_NAMES } from "@/utils/monitoring/dropOpenTiming";
import { MOBILE_LAUNCH_SIGNAL_NAME } from "@/utils/monitoring/mobileLaunchTiming";
import { SERVER_ROUTE_SPAN_NAMES } from "@/utils/monitoring/serverRouteTelemetry";

type RegistrySignal = (typeof registry.signals)[number];

const REQUIRED_SIGNAL_FIELDS = [
  "name",
  "kind",
  "question",
  "owner",
  "producer",
  "destinations",
  "sampling",
  "privacy",
  "externalUsage",
  "lifecycle",
  "replacement",
  "reviewBy",
] as const;

function getSignal(name: string): RegistrySignal {
  const signal = registry.signals.find((candidate) => candidate.name === name);
  if (!signal) {
    throw new Error(`Missing telemetry registry signal: ${name}`);
  }
  return signal;
}

describe("frontend telemetry registry", () => {
  it("has schema-like required fields, valid dates, and unique signal names", () => {
    expect(registry.version).toBeGreaterThan(0);
    expect(registry.operationalOwner).toBeTruthy();
    expect(registry.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Date.parse(registry.lastReviewed)).not.toBeNaN();

    const providerIds = registry.providers.map((provider) => provider.id);
    expect(new Set(providerIds).size).toBe(providerIds.length);
    for (const provider of registry.providers) {
      expect(provider).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          owns: expect.any(Array),
          automatic: expect.any(Array),
          sampling: expect.any(String),
          release: expect.any(String),
          notes: expect.any(String),
        })
      );
    }

    const names = registry.signals.map((signal) => signal.name);
    expect(new Set(names).size).toBe(names.length);

    for (const signal of registry.signals) {
      for (const field of REQUIRED_SIGNAL_FIELDS) {
        expect(signal).toHaveProperty(field);
      }
      expect(signal.name.trim()).not.toBe("");
      expect(signal.destinations.length).toBeGreaterThan(0);
      for (const destination of signal.destinations) {
        const destinationParts = destination.split(":");
        expect(destinationParts).toHaveLength(2);
        expect(providerIds).toContain(destinationParts[0]);
        expect(["owner", "compatibility", "diagnostic"]).toContain(
          destinationParts[1]
        );
      }
      expect(signal.producer).not.toMatch(/^(?:\/|[A-Za-z]:\\)/);
      expect(signal.producer).not.toContain("..");
      expect(signal.reviewBy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Date.parse(signal.reviewBy)).not.toBeNaN();
      expect(["keep", "temporary", "deprecate"]).toContain(signal.lifecycle);

      if (
        signal.lifecycle === "temporary" ||
        signal.lifecycle === "deprecate"
      ) {
        expect(signal.replacement).toEqual(expect.any(String));
        expect(signal.replacement).not.toBe("");
      }
    }
  });

  it("registers the runtime custom signal constants", () => {
    const runtimeSignalNames = [
      PAGE_VIEW_EVENT_NAME,
      ...AUTH_IMPACT_EVENT_NAMES,
      ...PRODUCT_IMPACT_EVENT_NAMES,
      SESSION_REFRESH_SIGNAL_NAME,
      MOBILE_LAUNCH_SIGNAL_NAME,
      ...Object.values(DROP_OPEN_SIGNAL_NAMES),
      ...Object.values(ART_BLOCKS_SIGNAL_NAMES),
      ...Object.values(SERVER_ROUTE_SPAN_NAMES),
    ];
    const registeredNames = new Set(
      registry.signals.map((signal) => signal.name)
    );

    for (const signalName of runtimeSignalNames) {
      expect(registeredNames).toContain(signalName);
    }
  });

  it("matches product-impact delivery without duplicating provider roles", () => {
    const sentryOmittedSignals = new Set([
      "Wave Feed Load Started",
      "Wave Feed Load Cancelled",
    ]);

    for (const signalName of PRODUCT_IMPACT_EVENT_NAMES) {
      const signal = getSignal(signalName);
      const providers = signal.destinations
        .map((destination) => destination.split(":")[0])
        .sort();
      expect(providers).toEqual(
        sentryOmittedSignals.has(signalName)
          ? ["mixpanel"]
          : ["mixpanel", "sentry"]
      );

      if (sentryOmittedSignals.has(signalName)) {
        expect(signal.sampling).toContain("omitted from Sentry");
      }
    }
  });

  it("records current Art Blocks ownership and normalized page-view privacy", () => {
    for (const signalName of Object.values(ART_BLOCKS_SIGNAL_NAMES)) {
      expect(getSignal(signalName)).toMatchObject({
        owner: "aws-rum",
        destinations: ["aws-rum:owner"],
        externalUsage: "unverified",
        lifecycle: "temporary",
        replacement: expect.stringContaining("Mixpanel"),
      });
    }

    expect(getSignal(PAGE_VIEW_EVENT_NAME)).toMatchObject({
      owner: "mixpanel",
      destinations: ["mixpanel:owner"],
      externalUsage: "unverified",
      privacy: expect.stringContaining(
        "normalized route pattern and logical page"
      ),
    });
  });

  it("contains no local absolute paths or private attribute names", () => {
    const serializedRegistry = JSON.stringify(registry);
    expect(serializedRegistry).not.toMatch(/\/(?:Users|home)\//);
    expect(serializedRegistry).not.toMatch(/[A-Za-z]:\\/);
    expect(serializedRegistry).not.toContain("file://");

    const forbiddenAttributeNames = [
      "access_token",
      "cookie",
      "drop_id",
      "full_url",
      "notification_content",
      "profile_handle",
      "wallet_address",
      "wave_id",
    ];
    for (const attributeName of forbiddenAttributeNames) {
      expect(serializedRegistry).not.toContain(attributeName);
    }
  });
});
