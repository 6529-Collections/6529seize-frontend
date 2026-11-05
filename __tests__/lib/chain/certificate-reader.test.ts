/**
 * @jest-environment node
 */
import fixture from "@/lib/chain/validator/fixtures/devnet-4-accounts.json";
import {
  createFixtureCertificateReader,
  createValidatorApiCertificateReader,
} from "@/lib/chain/validator/certificate-reader";
import { parseCertificateView, parseCycleRecord, ValidatorFormatError } from "@/lib/chain/validator/parse";
import { certificateLevel, isFinalCertificate } from "@/lib/chain/validator/types";

describe("validator certificate reader (format 1)", () => {
  const reader = createFixtureCertificateReader(fixture, "devnet node 1");

  it("reads the devnet fixture with provenance", async () => {
    const cycles = await reader.cycles(20758, 20760);
    expect(cycles.prov).toEqual({ source: "fixture", reportedBy: "devnet node 1", verifiedByClient: false });
    expect(cycles.value.map((c) => [c.day, c.state])).toEqual([
      [20758, "CERTIFIED"],
      [20759, "SIGNED"],
      [20760, "OPEN"],
    ]);
    const [certified] = (await reader.certificates(20758)).value;
    expect(certified).toBeDefined();
    expect(certified && isFinalCertificate(certified)).toBe(true);
    expect((await reader.certificates(20761)).value).toEqual([]);
  });

  it("keeps the fixture internally consistent", async () => {
    for (const record of (await reader.cycles(20758, 20760)).value) {
      const cert = record.certificate;
      if (cert === null) {
        continue;
      }
      expect(cert.level).toBe(certificateLevel(cert.signed_weight, cert.w));
      const weights = [...cert.signer_weights, ...cert.unsigned_weights].reduce((a, b) => a + b, 0);
      expect(weights + (cert.own_weight ?? 0)).toBe(cert.w);
      expect(cert.signed_weight).toBe(cert.own_signed + cert.signer_weights.reduce((a, b) => a + b, 0));
    }
  });

  it("follows the levels of ARCHITECTURE.md §2.7", () => {
    expect(certificateLevel(667, 1000)).toBe("STRONG");
    expect(certificateLevel(666, 1000)).toBe("MAJORITY");
    expect(certificateLevel(500, 1000)).toBe("WEAK");
  });

  it("fills serde defaults and ignores fields added later", () => {
    const base = fixture.certificates["20758"][0];
    const older: Record<string, unknown> = { ...base, future_field: { nested: true } };
    for (const key of ["key_count", "signer_weights", "own_weight", "reported_by", "strong_unix"]) {
      delete older[key];
    }
    expect(parseCertificateView(older)).toMatchObject({
      key_count: 0,
      signer_weights: [],
      own_weight: null,
      reported_by: 0,
      strong_unix: null,
    });
  });

  it("refuses another format, wrong types and malformed hashes", () => {
    const record = fixture.cycles[0];
    expect(() => parseCycleRecord({ ...record, format: 2 })).toThrow(ValidatorFormatError);
    expect(() => parseCycleRecord({ ...record, day: "20758" })).toThrow(ValidatorFormatError);
    expect(() => parseCycleRecord({ ...record, cycle_root: "0x1234" })).toThrow(ValidatorFormatError);
    expect(() => parseCycleRecord({ ...record, updated_unix: 2 ** 60 })).toThrow(ValidatorFormatError);
  });

  it("bounds ranges as the local API does", async () => {
    await expect(reader.cycles(20700, 20764)).rejects.toThrow(RangeError);
    await expect(reader.cycles(20760, 20758)).rejects.toThrow(RangeError);
  });

  it("reads the local API with a bearer token", async () => {
    const seen: { url: string; auth: string | null }[] = [];
    const fakeFetch = ((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      seen.push({ url, auth: new Headers(init?.headers).get("authorization") });
      const body = url.includes("/certificates/") ? fixture.certificates["20759"] : fixture.cycles.slice(0, 2);
      return Promise.resolve(new Response(JSON.stringify(body)));
    }) as typeof fetch;
    const api = createValidatorApiCertificateReader({ bearerToken: "test-token", fetch: fakeFetch });
    const certificates = await api.certificates(20759);
    expect(certificates.value[0]?.level).toBe("MAJORITY");
    expect(certificates.prov).toMatchObject({ source: "validator-local-api", verifiedByClient: false });
    expect((await api.cycles(20758, 20759)).value).toHaveLength(2);
    expect(seen).toEqual([
      { url: "http://127.0.0.1:6529/api/v1/certificates/20759", auth: "Bearer test-token" },
      { url: "http://127.0.0.1:6529/api/v1/cycles?from=20758&to=20759", auth: "Bearer test-token" },
    ]);
  });
});
