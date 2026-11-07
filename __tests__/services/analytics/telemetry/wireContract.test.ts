import schema from "@/ops/telemetry/telemetry-collector.v1.schema.json";
import * as collector from "@/services/analytics/telemetry/collector";
import { PRODUCT_EVENT_PROPS } from "@/services/analytics/telemetry/wire";

jest.mock("@/config/env", () => ({
  publicEnv: { NEXT_PUBLIC_FEATURE_FIRST_PARTY_TELEMETRY: "true" },
}));

type Schema = Record<string, unknown>;

// The subset of JSON Schema 2020-12 the vendored collector schema uses.
function validate(node: Schema, value: unknown, path = "$"): string[] {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(`${path}: ${message}`);
  if (typeof node["$ref"] === "string") {
    const target = node["$ref"].replace("#/$defs/", "");
    return validate(
      (schema.$defs as Record<string, Schema>)[target]!,
      value,
      path
    );
  }
  if ("const" in node && value !== node["const"])
    fail(`expected ${String(node["const"])}`);
  if (Array.isArray(node["enum"]) && !node["enum"].includes(value))
    fail(`not in enum: ${String(value)}`);
  const type = node["type"];
  if (
    type === "object" &&
    (typeof value !== "object" || value === null || Array.isArray(value))
  )
    return [...errors, `${path}: not an object`];
  if (type === "array" && !Array.isArray(value))
    return [...errors, `${path}: not an array`];
  if (type === "string" && typeof value !== "string") fail("not a string");
  if (type === "boolean" && typeof value !== "boolean") fail("not a boolean");
  if (type === "number" && typeof value !== "number") fail("not a number");
  if (type === "integer" && !Number.isInteger(value)) fail("not an integer");
  if (typeof value === "string") {
    if (
      typeof node["maxLength"] === "number" &&
      value.length > node["maxLength"]
    )
      fail("too long");
    if (
      typeof node["pattern"] === "string" &&
      !new RegExp(node["pattern"]).test(value)
    )
      fail(`pattern ${node["pattern"]}`);
  }
  if (typeof value === "number") {
    if (typeof node["minimum"] === "number" && value < node["minimum"])
      fail("below minimum");
    if (typeof node["maximum"] === "number" && value > node["maximum"])
      fail("above maximum");
  }
  if (Array.isArray(value)) {
    if (typeof node["maxItems"] === "number" && value.length > node["maxItems"])
      fail("too many items");
    if (node["items"])
      value.forEach((item, i) =>
        errors.push(...validate(node["items"] as Schema, item, `${path}[${i}]`))
      );
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const properties = (node["properties"] ?? {}) as Record<string, Schema>;
    for (const key of (node["required"] as string[] | undefined) ?? [])
      if (!(key in record)) fail(`missing ${key}`);
    if (
      typeof node["maxProperties"] === "number" &&
      Object.keys(record).length > node["maxProperties"]
    )
      fail("too many properties");
    for (const [key, child] of Object.entries(record)) {
      if (node["propertyNames"])
        errors.push(
          ...validate(node["propertyNames"] as Schema, key, `${path}.<${key}>`)
        );
      if (properties[key])
        errors.push(...validate(properties[key], child, `${path}.${key}`));
      else if (node["additionalProperties"] === false)
        fail(`unexpected property ${key}`);
      else if (typeof node["additionalProperties"] === "object")
        errors.push(
          ...validate(
            node["additionalProperties"] as Schema,
            child,
            `${path}.${key}`
          )
        );
    }
  }
  if (
    Array.isArray(node["anyOf"]) &&
    !node["anyOf"].some(
      (option) => validate(option as Schema, value, path).length === 0
    )
  )
    fail("matches no anyOf branch");
  for (const branch of (node["allOf"] as Schema[] | undefined) ?? []) {
    if (
      branch["if"] &&
      validate(branch["if"] as Schema, value, path).length > 0
    )
      continue;
    errors.push(...validate((branch["then"] ?? branch) as Schema, value, path));
  }
  return errors;
}

const eventSchema = (schema.$defs as Record<string, Schema>)["event"]!;
const schemaEventProps = new Map(
  (eventSchema["allOf"] as Schema[]).map((branch) => {
    const name = (
      (branch["if"] as Schema)["properties"] as Record<string, Schema>
    )["name"]!["const"] as string;
    const p = (
      (branch["then"] as Schema)["properties"] as Record<string, Schema>
    )["p"]!;
    return [name, Object.keys(p["properties"] as Schema).sort()];
  })
);

describe("wire format v1 matches the vendored backend schema", () => {
  it("registers exactly the schema's product events and their props", () => {
    expect(Object.keys(PRODUCT_EVENT_PROPS).sort()).toEqual(
      [...schemaEventProps.keys()].sort()
    );
    expect(
      (eventSchema["properties"] as Record<string, Schema>)["name"]!["enum"]
    ).toEqual(expect.arrayContaining(Object.keys(PRODUCT_EVENT_PROPS)));
    for (const [name, props] of Object.entries(PRODUCT_EVENT_PROPS)) {
      expect([name, [...props].sort()]).toEqual([
        name,
        schemaEventProps.get(name),
      ]);
      expect(props.length).toBeLessThanOrEqual(6);
    }
  });

  it("emits batches the schema accepts", () => {
    const sendBeacon = jest.fn<boolean, [string, string]>(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://www.google.com/",
    });
    try {
      collector.setTelemetryCountry("US", false);
      collector.recordPageView({
        pathname: "/",
        route: "/",
        pageGroup: "home",
        signedIn: false,
      });
      collector.recordProductEvent("Homepage action clicked", {
        logical_page: "home",
        layout_version: "1",
        signed_in: false,
        is_native: false,
        screen_size: "Large",
        section: "Get started",
        action: "Connect wallet",
      });
      collector.recordProductEvent("Profile section seen", {
        logical_page: "profile_collected",
        page_group: "profile",
        route_pattern: "/:handle/collected",
        profile_tab: "Collected",
        profile_viewer_context: "other",
        platform: "desktop_web",
        section: "Artwork",
      });
      collector.recordProductEvent("Auth Session Refresh Product Impact", {
        telemetry_version: 1,
        online: true,
        route_family: "/waves/[wave]",
        visibility_state: "visible",
        client_type: "web",
        had_local_jwt: true,
        outcome: "reauth_required",
        refresh_outcome: "success",
        product_failure: false,
        reauth_required: false,
      });
      collector.recordProductEvent("Wave Feed Load Failed", {
        duration_bucket: "1s_3s",
        endpoint_family: "wave_drops_feed",
        had_cached_drops: false,
        is_native: false,
        load_source: "initial_visible",
        status_bucket: "5xx",
        error_kind: "server",
        product_failure: true,
      });
      collector.recordProductEvent("Wave Feature Activated", {
        feature: "wave_tab",
        value: "chat",
        placement: "wave_tabs",
        platform: "desktop_web",
        viewer: "profile",
        eligibility: "available",
        route_family: "/waves/:waveId",
        selected: true,
        selection_source: "user",
        action: "choose",
      });
      collector.countApiRequest({
        endpoint: "https://api.6529.io/api/drops/123",
        status: 502,
        durationMs: 4000,
      });
      collector.countWebSocket("drop");
      collector.countBoundaryError();
      collector.recordVital("LCP", 2000);
      collector.recordVital("CLS", 0.02);
      collector.recordPageView({
        pathname: "/waves/abc",
        route: "/waves/[wave]",
        pageGroup: "waves",
        signedIn: false,
      });
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      globalThis.dispatchEvent(new Event("visibilitychange"));

      const bodies = sendBeacon.mock.calls.map(
        ([, body]) => JSON.parse(body) as unknown
      );
      const types = bodies.flatMap((body) =>
        (body as { events: { t: string }[] }).events.map((e) => e.t)
      );
      expect(new Set(types)).toEqual(new Set(["pv", "ev", "health", "vitals"]));
      for (const body of bodies)
        expect(validate(schema as Schema, body)).toEqual([]);
    } finally {
      collector.resetTelemetryForTests();
    }
  });

  it("rejects what the schema rejects", () => {
    const event = {
      v: 1,
      t: "ev",
      route: "/",
      device: "desktop",
      platform: "web",
    };
    const batch = (extra: Record<string, unknown>) => ({
      v: 1,
      events: [{ ...event, ...extra }],
    });
    expect(
      validate(
        schema as Schema,
        batch({ name: "Homepage section seen", p: { section: "Introduction" } })
      )
    ).toEqual([]);
    expect(
      validate(
        schema as Schema,
        batch({ name: "Homepage section seen", p: { action: "Mint" } })
      )
    ).not.toEqual([]);
    expect(
      validate(schema as Schema, batch({ name: "Not registered", p: {} }))
    ).not.toEqual([]);
    expect(
      validate(schema as Schema, batch({ url: "https://6529.io/x" }))
    ).not.toEqual([]);
  });
});
