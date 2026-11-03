/**
 * @jest-environment node
 */
import {
  operatorsFor,
  SERVICE_MIN_OPERATORS,
  type ServiceRecord,
} from "@/lib/chain/types/service-record";

function record(name: string, roles: ServiceRecord["services"][number]["role"][]): ServiceRecord {
  return {
    v: 0,
    operator: { principal: null, name },
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
    expect(operatorsFor(records, "gateway")).toEqual(["alpha", "beta"]);
    expect(operatorsFor(records, "gateway").length).toBeGreaterThanOrEqual(SERVICE_MIN_OPERATORS);
    expect(operatorsFor(records, "pinner")).toEqual(["alpha"]);
    expect(operatorsFor(records, "web-mirror")).toEqual([]);
  });
});
