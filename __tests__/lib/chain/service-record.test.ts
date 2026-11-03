/**
 * @jest-environment node
 */
import type { Hex } from "viem";

import {
  operatorKey,
  operatorsFor,
  SERVICE_MIN_OPERATORS,
  type ServiceRecord,
} from "@/lib/chain/types/service-record";

function record(
  name: string,
  roles: ServiceRecord["services"][number]["role"][],
  principal: Hex | null = null
): ServiceRecord {
  return {
    v: 0,
    operator: { principal, name },
    services: roles.map((role) => ({ role, endpoints: [`https://${name}.invalid/`] })),
    price: { free: true },
    jurisdictions: ["US"],
    abuseContact: `abuse@${name}.invalid`,
    subscribedLists: [],
    signature: null,
  };
}

describe("ServiceRecord v0 (P44 VS1)", () => {
  it("counts distinct operators per role", () => {
    const records = [
      record("alpha", ["gateway", "pinner"]),
      record("alpha", ["gateway"]),
      record("beta", ["gateway"]),
      record("gamma", ["relay"]),
    ];
    expect(operatorsFor(records, "gateway")).toEqual(["name:alpha", "name:beta"]);
    expect(operatorsFor(records, "gateway").length).toBeGreaterThanOrEqual(SERVICE_MIN_OPERATORS);
    expect(operatorsFor(records, "pinner")).toEqual(["name:alpha"]);
    expect(operatorsFor(records, "web-mirror")).toEqual([]);
  });

  it("does not let case variants of one principal or name count twice", () => {
    const principal: Hex = `0x${"ab".repeat(32)}`;
    const upper = `0x${"AB".repeat(32)}` as Hex;
    const records = [
      record("one", ["gateway"], principal),
      record("one-again", ["gateway"], upper),
      record("Beta ", ["gateway"]),
      record("beta", ["gateway"]),
    ];
    expect(operatorsFor(records, "gateway")).toEqual([`principal:${principal}`, "name:beta"]);
    expect(operatorKey(record("x", [], upper))).toBe(`principal:${principal}`);
  });
});
